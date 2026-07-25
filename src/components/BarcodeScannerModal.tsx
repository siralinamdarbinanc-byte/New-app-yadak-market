import React, { useState, useEffect, useRef } from 'react';
import { X, ScanBarcode, Camera, AlertCircle, CheckCircle2, RefreshCw, Check, Upload, Flashlight, SwitchCamera, ZoomIn, ZoomOut } from 'lucide-react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
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
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(1);
  const [isZoomSupported, setIsZoomSupported] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const nativeDetectorRef = useRef<any>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
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

    // Check native BarcodeDetector support
    if ('BarcodeDetector' in window) {
      try {
        const supportedFormats = await (window as any).BarcodeDetector.getSupportedFormats();
        nativeDetectorRef.current = new (window as any).BarcodeDetector({ formats: supportedFormats });
      } catch (e) {
        console.debug('Native BarcodeDetector init failed:', e);
      }
    }

    const reader = getCodeReaderInstance();

    // Enumerate video devices
    try {
      const devList = await reader.listVideoInputDevices();
      setDevices(devList);
    } catch (e) {
      console.debug('Error listing video devices:', e);
    }

    const constraintAttempts: MediaStreamConstraints[] = [];

    if (targetDeviceId) {
      constraintAttempts.push({ video: { deviceId: { exact: targetDeviceId }, width: { ideal: 1920, min: 640 }, height: { ideal: 1080, min: 480 } } });
    }

    constraintAttempts.push(
      { video: { facingMode: { ideal: currentFacing }, width: { ideal: 1920, min: 1280 }, height: { ideal: 1080, min: 720 }, frameRate: { ideal: 30, min: 15 } } },
      { video: { facingMode: { ideal: currentFacing }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: currentFacing } },
      { video: true }
    );

    let stream: MediaStream | null = null;
    let lastError: any = null;

    for (const constraint of constraintAttempts) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraint);
        if (stream) break;
      } catch (err: any) {
        lastError = err;
        console.debug('Camera constraint attempt failed:', constraint, err);
      }
    }

    if (!stream) {
      console.error('All camera stream attempts failed:', lastError);
      setIsLoading(false);
      setCameraActive(false);

      if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
        setErrorMsg('دسترسی به دوربین توسط کاربر یا مرورگر مسدود شده است. لطفاً در تنظیمات مرورگر/برنامه اجازه دسترسی به دوربین را دهید.');
      } else if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
        setErrorMsg('هیچ دوربینی روی دستگاه یافت نشد. می‌توانید کد را دستی یا از طریق عکس وارد کنید.');
      } else {
        setErrorMsg('امکان دریافت تصویر زنده از دوربین وجود ندارد. می‌توانید از دکمه عکاسی مستقیم یا وارد کردن دستی کد استفاده کنید.');
      }
      return;
    }

    try {
      activeStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        await videoRef.current.play().catch((e) => console.debug('Video play error:', e));

        setCameraActive(true);
        setIsLoading(false);

        // Apply Focus & Zoom settings if track supports them
        const track = stream.getVideoTracks()[0];
        if (track && 'getCapabilities' in track) {
          try {
            const caps = (track as any).getCapabilities?.() || {};
            if (caps.zoom) {
              setIsZoomSupported(true);
              setMaxZoom(caps.zoom.max || 4);
              const initialZoom = Math.min(1.5, caps.zoom.max || 1);
              setZoomLevel(initialZoom);
              await (track as any).applyConstraints({
                advanced: [{ zoom: initialZoom, focusMode: 'continuous' }]
              });
            } else {
              await (track as any).applyConstraints({
                advanced: [{ focusMode: 'continuous' }]
              });
            }
          } catch (e) {
            // Ignore constraint errors
          }
        }

        // Initialize Canvas for frame extraction
        if (!offscreenCanvasRef.current) {
          offscreenCanvasRef.current = document.createElement('canvas');
        }

        // High frequency scanning loop with Multi-Pass Canvas extraction
        let passCounter = 0;
        scanIntervalRef.current = setInterval(async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.videoWidth < 10) return;

          const canvas = offscreenCanvasRef.current;
          if (!canvas) return;

          const vWidth = video.videoWidth;
          const vHeight = video.videoHeight;

          // 1. Native detector pass on live video if supported
          if (nativeDetectorRef.current) {
            try {
              const detected = await nativeDetectorRef.current.detect(video);
              if (detected && detected.length > 0 && detected[0].rawValue) {
                const code = detected[0].rawValue;
                stopCamera();
                handleApplyCode(code);
                return;
              }
            } catch (e) {
              // ignore frame error
            }
          }

          // 2. Multi-Pass Canvas extraction for ZXing
          passCounter++;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;

          // Target processing width (scale high-res video down to ~900px for fast & sharp decoding)
          const targetW = Math.min(vWidth, 900);
          const targetH = Math.round((vHeight / vWidth) * targetW);

          canvas.width = targetW;
          canvas.height = targetH;

          if (passCounter % 2 === 1) {
            // Pass A: Center crop (70% of frame where scan box is located)
            const cropX = vWidth * 0.15;
            const cropY = vHeight * 0.15;
            const cropW = vWidth * 0.7;
            const cropH = vHeight * 0.7;
            ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
          } else {
            // Pass B: Full frame
            ctx.drawImage(video, 0, 0, targetW, targetH);
          }

          // Apply contrast enhancement on every 4th pass for low-light / glossy barcodes
          if (passCounter % 4 === 0) {
            try {
              const imgData = ctx.getImageData(0, 0, targetW, targetH);
              const data = imgData.data;
              for (let i = 0; i < data.length; i += 4) {
                // Greyscale + Contrast boost
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const v = avg < 110 ? 0 : 255;
                data[i] = v;
                data[i + 1] = v;
                data[i + 2] = v;
              }
              ctx.putImageData(imgData, 0, 0);
            } catch (e) {
              // ignore canvas manipulation errors
            }
          }

          // Decode frame with ZXing
          try {
            const result = await reader.decodeFromCanvas(canvas);
            if (result && result.getText()) {
              const text = result.getText();
              stopCamera();
              handleApplyCode(text);
            }
          } catch (e) {
            // NotFoundException expected when no barcode in frame
          }
        }, 120);

      }
    } catch (err: any) {
      console.error('Video decode binding error:', err);
      setIsLoading(false);
      setCameraActive(false);
      setErrorMsg('خطا در اتصال تصویر دوربین. می‌توانید از عکاسی مستقیم یا بارکدخوان دستی استفاده کنید.');
    }
  };

  const setZoom = async (newLevel: number) => {
    if (!activeStreamRef.current) return;
    const track = activeStreamRef.current.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      try {
        const clampedLevel = Math.max(1, Math.min(newLevel, maxZoom));
        await (track as any).applyConstraints({
          advanced: [{ zoom: clampedLevel }]
        });
        setZoomLevel(clampedLevel);
      } catch (e) {
        console.log('Zoom not supported');
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

              {/* Controls Overlay Top */}
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
                    className="px-2 py-1 bg-slate-900/90 text-slate-200 text-[11px] rounded-xl border border-slate-700 focus:outline-none max-w-[130px] truncate"
                  >
                    <option value="">دوربین اصلی</option>
                    {devices.map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `دوربین ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex items-center gap-1">
                  {/* Zoom Controls */}
                  {isZoomSupported && (
                    <div className="flex items-center bg-slate-900/80 rounded-xl border border-slate-700 p-0.5 backdrop-blur-md">
                      <button
                        type="button"
                        onClick={() => setZoom(zoomLevel - 0.5)}
                        className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px]"
                        title="زوم کمتر"
                      >
                        <ZoomOut className="w-3 h-3 text-purple-300" />
                      </button>
                      <span className="text-[10px] font-mono px-1 text-purple-200">{zoomLevel.toFixed(1)}x</span>
                      <button
                        type="button"
                        onClick={() => setZoom(zoomLevel + 0.5)}
                        className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px]"
                        title="زوم بیشتر"
                      >
                        <ZoomIn className="w-3 h-3 text-purple-300" />
                      </button>
                    </div>
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
                  </button>
                </div>
              </div>

              {/* Manual capture button & Native camera capture */}
              <div className="absolute bottom-3 inset-x-3 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => captureInputRef.current?.click()}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5 border border-purple-400/50"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                  <span>عکاسی مستقیم از بارکد</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-medium shadow-md backdrop-blur-md flex items-center gap-1.5 border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>انتخاب عکس</span>
                </button>
              </div>
            </>
          )}

          {/* Loading or Off State Overlay */}
          {(!cameraActive || isLoading) && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center z-10">
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                  <p className="text-xs text-slate-300 font-medium">در حال راه اندازی دوربین...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-xs">
                  <Camera className="w-9 h-9 text-purple-400 mb-2" />
                  <p className="text-xs text-slate-200 font-bold mb-1">دسترسی ویدیو مستقیم زنده محدود است</p>
                  <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                    می‌توانید با دکمه زیر مستقیماً دوربین گوشی را باز کرده و از بارکد عکس بگیرید:
                  </p>
                  <div className="flex flex-col w-full gap-2">
                    <button
                      type="button"
                      onClick={() => captureInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>عکاسی مستقیم با دوربین گوشی</span>
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera(selectedDeviceId)}
                        className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 transition-colors"
                      >
                        تلاش مجدد ویدیو
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                        <span>انتخاب فایل</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Native Camera Capture Input (Forces Android Camera App) */}
        <input
          ref={captureInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

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


