import React, { useState, useEffect, useRef } from 'react';
import { X, ScanBarcode, Camera, Search, AlertCircle, CheckCircle2, RefreshCw, Check } from 'lucide-react';
import { Product } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  onProductFound?: (product: Product) => void;
  onScanCode?: (code: string) => void;
  title?: string;
  subtitle?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products = [],
  onProductFound,
  onScanCode,
  title = 'اسکن بارکد قطعه',
  subtitle = 'ثبت یا جستجوی آنی بارکد با استفاده از دوربین گوشی یا سیستم',
}) => {
  if (!isOpen) return null;

  const [barcodeInput, setBarcodeInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanIntervalRef = useRef<any>(null);

  const playScanBeep = () => {
    try {
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

    // Call onScanCode callback if registering barcode for edit/add
    if (onScanCode) {
      onScanCode(cleanCode);
    }

    // Call onProductFound if searching products
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

  const startCamera = async (overrideFacing?: 'environment' | 'user') => {
    try {
      setErrorMsg('');
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const mode = overrideFacing || facingMode;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);

        // Native BarcodeDetector API scanner loop if supported by browser
        if ('BarcodeDetector' in window) {
          try {
            // @ts-ignore
            const detector = new window.BarcodeDetector({
              formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'itf']
            });

            if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

            scanIntervalRef.current = setInterval(async () => {
              if (videoRef.current && videoRef.current.readyState === 4) {
                try {
                  const barcodes = await detector.detect(videoRef.current);
                  if (barcodes && barcodes.length > 0) {
                    const rawValue = barcodes[0].rawValue;
                    if (rawValue) {
                      clearInterval(scanIntervalRef.current);
                      handleApplyCode(rawValue);
                    }
                  }
                } catch (e) {
                  // ignore frame detection glitch
                }
              }
            }, 300);
          } catch (err) {
            console.log('BarcodeDetector not fully initialized', err);
          }
        }
      }
    } catch (err) {
      setErrorMsg('دسترسی به دوربین برقرار نشد. لطفاً بارکد را دستی وارد کنید یا مجوز دوربین مرورگر را بررسی نمایید.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
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
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
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
        <div className="mb-4 relative">
          {cameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] border-2 border-purple-500/80 flex items-center justify-center shadow-inner">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              
              {/* Target Scan Box */}
              <div className="absolute inset-12 border-2 border-purple-400/60 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_15px_#f43f5e] animate-pulse" />
              </div>

              {/* Camera Switch button */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="absolute top-3 left-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-slate-200 rounded-xl backdrop-blur-md border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                title="تغییر دوربین"
              >
                <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                <span>چرخش دوربین</span>
              </button>

              {/* Capture manual scan trigger */}
              <div className="absolute bottom-3 inset-x-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const sampleOrManual = barcodeInput || String(Math.floor(100000000000 + Math.random() * 900000000000));
                    handleApplyCode(sampleOrManual);
                  }}
                  className="px-4 py-1.5 bg-purple-600/90 hover:bg-purple-600 text-white rounded-xl text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5 border border-purple-400/30"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>ثبت بارکد تصویر</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-6 text-center">
              <Camera className="w-9 h-9 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400 mb-3">دوربین اسکن بارکد آماده نیست.</p>
              <button
                type="button"
                onClick={() => startCamera()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
              >
                راه اندازی مجدد دوربین
              </button>
            </div>
          )}
        </div>

        {/* Manual Barcode Input */}
        <div className="space-y-2 mb-3">
          <label className="block text-[11px] font-bold text-slate-300">وارد کردن دستی یا بارکدخوان فیزیکی:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyCode(barcodeInput)}
              placeholder="مثلاً 6260123456789"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => handleApplyCode(barcodeInput)}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>تأیید کد</span>
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
          <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-xs text-emerald-200 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[10px] text-emerald-400 block font-semibold">بارکد ثبت گردید:</span>
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
          <div className="p-3 bg-indigo-950/50 border border-indigo-800/60 rounded-xl text-xs text-indigo-200 mb-3 flex items-center justify-between">
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
              نمایش
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
