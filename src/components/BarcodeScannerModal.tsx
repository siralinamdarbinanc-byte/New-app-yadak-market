import React, { useState, useEffect, useRef } from 'react';
import { X, ScanBarcode, Camera, AlertCircle, CheckCircle2, RefreshCw, Check, Upload, Flashlight, SwitchCamera } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Product } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  onProductFound?: (product: Product) => void;
  onScanCode?: (code: string) => void;
  onDetected?: (code: string) => void;
  title?: string;
  subtitle?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products = [],
  onProductFound,
  onScanCode,
  onDetected,
  title = 'اسکن بارکد قطعه',
  subtitle = 'ثبت یا جستجوی آنی بارکد با استفاده از دوربین گوشی یا سیستم',
}) => {
  if (!isOpen) return null;

  const [barcodeInput, setBarcodeInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [torchOn, setTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<any>(null);
  const nativeDetectorRef = useRef<any>(null);

  const playScanBeep = () => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // ignore audio context restrictions
    }
  };

  const handleApplyCode = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    playScanBeep();
    setScannedResult(cleanCode);
    setErrorMsg('');

    if (onScanCode) {
      onScanCode(cleanCode);
    }
    if (onDetected) {
      onDetected(cleanCode);
    }

    if (onProductFound && products.length > 0) {
      const match = products.find((p) => {
        const codeStr = String(p.barcode || '');
        const idStr = String(p.id || '');
        const oemStr = String(p.oemCode || '');
        return codeStr === cleanCode || idStr === cleanCode || oemStr === cleanCode;
      });

      if (match) {
        setFoundProduct(match);
        onProductFound(match);
      } else if (!onScanCode) {
        setErrorMsg(`هیچ قطعه‌ای با کد یا بارکد "${cleanCode}" در انبار پیدا نشد.`);
      }
    }
  };

  const stopCamera = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (e) {
        console.error('Error resetting code reader', e);
      }
    }

    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setIsLoading(false);
  };

  const getCodeReaderInstance = () => {
    if (!codeReaderRef.current) {
      const hints = new Map();
      const formats = [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.ITF,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
      ];
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      hints.set(DecodeHintType.TRY_HARDER, true);

      codeReaderRef.current = new BrowserMultiFormatReader(hints);
    }
    return codeReaderRef.current;
  };

  const startCamera = async (targetDeviceId?: string, overrideFacing?: 'environment' | 'user') => {
    setIsLoading(true);
    setErrorMsg('');
    stopCamera();

    const currentFacing = overrideFacing || facingMode;

    // Check if native BarcodeDetector is available
    if ('BarcodeDetector' in window) {
      try {
        const supportedFormats = await (window as any).BarcodeDetector.getSupportedFormats();
        nativeDetectorRef.current = new (window as any).BarcodeDetector({ formats: supportedFormats });
      } catch (e) {
        console.debug('Native BarcodeDetector init failed:', e);
      }
    }

    try {
      const reader = getCodeReaderInstance();

      // Enumerate devices if not done yet
      try {
        const devList = await reader.listVideoInputDevices();
        setDevices(devList);
      } catch (e) {
        console.debug('Error listing video devices:', e);
      }

      const videoConstraints: any = targetDeviceId
        ? { deviceId: { exact: targetDeviceId } }
        : {
            facingMode: { ideal: currentFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            focusMode: 'continuous',
          };

      // Use ZXing decodeFromConstraints which binds video and starts continuous scanner
      if (videoRef.current) {
        await reader.decodeFromConstraints(
          { video: videoConstraints },
          videoRef.current,
          (result, err) => {
            if (result && result.getText()) {
              const text = result.getText();
              stopCamera();
              handleApplyCode(text);
            }
          }
        );

        setCameraActive(true);
        setIsLoading(false);

        // Save active media stream for torch/flash
        if (videoRef.current.srcObject) {
          activeStreamRef.current = videoRef.current.srcObject as MediaStream;
        }

        // Secondary interval checking with native BarcodeDetector if available
        scanTimerRef.current = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          if (nativeDetectorRef.current) {
            try {
              const detected = await nativeDetectorRef.current.detect(videoRef.current);
              if (detected && detected.length > 0 && detected[0].rawValue) {
                const code = detected[0].rawValue;
                stopCamera();
                handleApplyCode(code);
              }
            } catch (e) {
              // ignore frame errors
            }
          }
        }, 150);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsLoading(false);
      setCameraActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('دسترسی به دوربین توسط کاربر یا مرورگر مسدود شده است. لطفاً در تنظیمات مرورگر اجازه دسترسی دهید.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('هیچ دوربینی در دستگاه یافت نشد. می‌توانید بارکد را دستی یا با عکس وارد کنید.');
      } else {
        setErrorMsg('امکان راه اندازی مستقیم دوربین وجود ندارد. می‌توانید بارکد را دستی وارد کنید یا تصویر آن را آپلود کنید.');
      }
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    setSelectedDeviceId('');
    startCamera(undefined, nextMode);
  };

  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const devId = e.target.value;
    setSelectedDeviceId(devId);
    startCamera(devId);
  };

  const toggleTorch = async () => {
    if (!activeStreamRef.current) return;
    const track = activeStreamRef.current.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const newTorchState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: newTorchState }]
        });
        setTorchOn(newTorchState);
      } catch (e) {
        console.log('Torch not supported on this device/camera');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const reader = getCodeReaderInstance();
      const imageUrl = URL.createObjectURL(file);

      // Try native detector first on image
      if ('BarcodeDetector' in window) {
        try {
          const img = new Image();
          img.src = imageUrl;
          await img.decode();
          const detector = new (window as any).BarcodeDetector();
          const barcodes = await detector.detect(img);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            URL.revokeObjectURL(imageUrl);
            handleApplyCode(barcodes[0].rawValue);
            return;
          }
        } catch (e) {
          console.debug('Native image decode failed, falling back to ZXing', e);
        }
      }

      const result = await reader.decodeFromImageUrl(imageUrl);
      URL.revokeObjectURL(imageUrl);

      if (result && result.getText()) {
        handleApplyCode(result.getText());
      } else {
        setErrorMsg('بارکد خوانایی در تصویر بارگذاری شده شناسایی نشد.');
      }
    } catch (err) {
      setErrorMsg('تصویر بارگذاری شده حاوی بارکد معتبر نبود.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">{title}</h2>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera / Viewfinder Box */}
        <div className="mb-3 relative rounded-2xl overflow-hidden bg-black aspect-[4/3] border-2 border-purple-500/80 flex items-center justify-center shadow-inner">
          
          {/* Always rendered video element so ref is always bound */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${cameraActive ? 'opacity-100' : 'opacity-20'}`}
          />

          {/* Scanner Overlay UI */}
          {cameraActive && (
            <>
              {/* Target Scan Box */}
              <div className="absolute inset-8 sm:inset-10 border-2 border-purple-400/90 rounded-2xl pointer-events-none flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.4)]">
                <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_15px_#f43f5e] animate-pulse" />
                <span className="absolute bottom-2 text-[10px] bg-slate-950/80 text-purple-200 px-2 py-0.5 rounded-md font-medium border border-purple-800/60">
                  بارکد را در این کادر نگه دارید
                </span>
              </div>

              {/* Controls Overlay */}
              <div className="absolute top-3 inset-x-3 flex justify-between items-center pointer-events-auto">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2 bg-slate-900/80 hover:bg-slate-900 text-slate-200 rounded-xl backdrop-blur-md border border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
                  title="تغییر دوربین"
                >
                  <SwitchCamera className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[11px]">چرخش</span>
                </button>

                {devices.length > 1 && (
                  <select
                    value={selectedDeviceId}
                    onChange={handleDeviceChange}
                    className="px-2 py-1 bg-slate-900/90 text-slate-200 text-[11px] rounded-xl border border-slate-700 focus:outline-none max-w-[140px] truncate"
                  >
                    <option value="">دوربین پیش‌فرض</option>
                    {devices.map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `دوربین ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2 rounded-xl backdrop-blur-md border text-xs flex items-center gap-1.5 transition-colors ${
                    torchOn
                      ? 'bg-amber-500/30 border-amber-500/60 text-amber-300'
                      : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-900'
                  }`}
                  title="فلاش دوربین"
                >
                  <Flashlight className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">فلاش</span>
                </button>
              </div>

              {/* Manual capture button */}
              <div className="absolute bottom-3 inset-x-3 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-medium shadow-md backdrop-blur-md flex items-center gap-1.5 border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>آپلود عکس بارکد</span>
                </button>
              </div>
            </>
          )}

          {/* Loading or Off State Overlay */}
          {(!cameraActive || isLoading) && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                  <p className="text-xs text-slate-300 font-medium">در حال راه اندازی دوربین...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Camera className="w-9 h-9 text-slate-500 mb-2" />
                  <p className="text-xs text-slate-400 mb-3">دوربین آماده نیست یا مسدود است.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startCamera(selectedDeviceId)}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
                    >
                      تلاش مجدد دوربین
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-purple-400" />
                      <span>آپلود تصویر</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Manual Barcode Input */}
        <div className="space-y-1.5 mb-3">
          <label className="block text-[11px] font-bold text-slate-300">وارد کردن دستی یا با بارکدخوان USB:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCode(barcodeInput)}
              placeholder="کد بارکد را تایپ یا اسکن کنید..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => handleApplyCode(barcodeInput)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>ثبت</span>
            </button>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success / Scanned feedback */}
        {scannedResult && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-xs text-emerald-200 mb-3 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-emerald-400 block font-semibold">بارکد شناسایی و ثبت شد:</span>
                <span className="font-mono font-bold text-emerald-200 text-sm">{scannedResult}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
            >
              تأیید و بستن
            </button>
          </div>
        )}

        {/* Found product info if search mode */}
        {foundProduct && (
          <div className="p-3 bg-indigo-950/50 border border-indigo-800/60 rounded-xl text-xs text-indigo-200 mb-3 flex items-center justify-between animate-fade-in">
            <div>
              <div className="font-bold text-indigo-300 text-xs">کالا در انبار پیدا شد:</div>
              <div className="text-slate-200 font-semibold">{foundProduct.name} ({foundProduct.brand})</div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
            >
              مشاهده قطعه
            </button>
          </div>
        )}

      </div>
    </div>
  );
};


