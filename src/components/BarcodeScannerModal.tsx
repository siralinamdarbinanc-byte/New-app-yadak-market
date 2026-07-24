import React, { useState, useEffect, useRef } from 'react';
import { X, ScanBarcode, Camera, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductFound: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductFound,
}) => {
  if (!isOpen) return null;

  const [barcodeInput, setBarcodeInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleSearchBarcode = (codeToSearch?: string) => {
    const target = (codeToSearch || barcodeInput).trim();
    if (!target) return;

    setErrorMsg('');
    setFoundProduct(null);

    // Search by product barcode, id, or row
    const match = products.find((p) => {
      const codeStr = String(p.barcode || '');
      const idStr = String(p.id || '');
      return codeStr === target || idStr === target;
    });

    if (match) {
      setFoundProduct(match);
      onProductFound(match);
    } else {
      setErrorMsg(`هیچ قطعه‌ای با کد یا بارکد "${target}" یافت نشد.`);
    }
  };

  const startCamera = async () => {
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      setErrorMsg('دسترسی به دوربین برقرار نشد. لطفاً کد را به صورت دستی وارد نمایید.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">اسکن بارکد قطعه</h2>
              <p className="text-xs text-slate-400">جستجوی آنی با اسکنر دوربین یا وارد کردن دستی barcode</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera / Viewfinder Box */}
        <div className="mb-5">
          {cameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-purple-500 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {/* Laser overlay animation */}
              <div className="absolute inset-x-8 h-0.5 bg-rose-500 shadow-[0_0_15px_#f43f5e] animate-pulse top-1/2" />
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-6 text-center">
              <Camera className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400 mb-3">دوربین برای اسکن مستقیم بارکد غیرفعال است.</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
              >
                فعال‌سازی دوربین
              </button>
            </div>
          )}
        </div>

        {/* Manual Barcode Input */}
        <div className="space-y-3 mb-4">
          <label className="block text-xs font-medium text-slate-300">ورود دستی بارکد یا کد کالا:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchBarcode()}
              placeholder="مثلاً 123456 یا کد محصول..."
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={() => handleSearchBarcode()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>جستجو</span>
            </button>
          </div>
        </div>

        {/* Status & Found Result */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {foundProduct && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl text-xs text-emerald-200 mb-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-emerald-300 text-sm mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>کالا پیدا شد!</span>
              </div>
              <div>{foundProduct.name} ({foundProduct.brand})</div>
            </div>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs"
            >
              نمایش کالا
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
