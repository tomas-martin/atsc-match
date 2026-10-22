'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

type ScanResult = {
  status: 'valid' | 'used' | 'invalid';
  message: string;
  code?: string;
  holderName?: string;
  buyerDni?: string;
  matchRival?: string;
  typeName?: string;
  usedAt?: string;
};

export default function AdminEscanearPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState('');
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastScannedToken, setLastScannedToken] = useState('');

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setResult(null);
    setCameraError('');
    setLastScannedToken('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      // Start scanning loop
      scanIntervalRef.current = setInterval(() => {
        scanFrame();
      }, 300);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('No se pudo acceder a la cámara. Verificá los permisos.');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function scanFrame() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || video.readyState !== 4) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Use BarcodeDetector on canvas to scan QR
    // We'll try to decode any text that looks like a base64url token
    // For actual QR scanning, we'll use the canvas and post to a decoder
    try {
      decodeQR();
    } catch {
      // Continue scanning
    }
  }

  async function decodeQR() {
    // We'll post the image data to check for QR codes using a canvas-based approach
    // Since jsQR needs to be imported, we'll use a different strategy:
    // Try to use BarcodeDetector API (available in modern Chrome/Edge)
    if ('BarcodeDetector' in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const barcodes = await detector.detect(canvas);
        if (barcodes.length > 0) {
          const token = barcodes[0].rawValue;
          if (token && token !== lastScannedToken) {
            setLastScannedToken(token);
            await validateToken(token);
          }
        }
      } catch {
        // BarcodeDetector failed, fall back to manual entry
      }
    }
  }

  async function validateToken(token: string) {
    stopCamera();

    try {
      const res = await fetch('/api/validate-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      setResult(data);

      // Vibrate on result
      if ('vibrate' in navigator) {
        if (data.status === 'valid') navigator.vibrate(200);
        else navigator.vibrate([100, 50, 100]);
      }
    } catch {
      setResult({ status: 'invalid', message: 'Error de conexión' });
    }
  }

  // Manual token input
  const [manualToken, setManualToken] = useState('');

  async function handleManualValidation() {
    if (!manualToken.trim()) return;
    await validateToken(manualToken.trim());
    setManualToken('');
  }

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-black text-2xl mb-2">Control de Acceso</h1>
      <p className="text-gray-blue text-sm mb-6">Escaneá el QR de la entrada</p>

      {/* Scan result */}
      {result && (
        <div className={`mb-6 animate-fade-in-up ${
          result.status === 'valid' ? 'scan-valid' :
          result.status === 'used' ? 'scan-used' : 'scan-invalid'
        }`}>
          <div className="text-4xl mb-3">
            {result.status === 'valid' ? '✅' : result.status === 'used' ? '⚠️' : '❌'}
          </div>
          <div className="font-black text-2xl mb-1">
            {result.status === 'valid' ? 'VÁLIDA' :
             result.status === 'used' ? 'YA USADA' : 'INVÁLIDA'}
          </div>
          <div className="text-sm font-medium mb-3">{result.message}</div>

          {result.code && (
            <div className="text-sm space-y-1 text-left mt-4">
              <div><strong>Código:</strong> {result.code}</div>
              {result.holderName && <div><strong>Titular:</strong> {result.holderName}</div>}
              {result.buyerDni && <div><strong>DNI:</strong> {result.buyerDni}</div>}
              {result.typeName && <div><strong>Tipo:</strong> {result.typeName}</div>}
              {result.matchRival && <div><strong>Partido:</strong> vs {result.matchRival}</div>}
              {result.usedAt && <div><strong>Usada:</strong> {new Date(result.usedAt).toLocaleString('es-AR')}</div>}
            </div>
          )}

          <button
            className="btn-primary mt-4"
            onClick={() => { setResult(null); startCamera(); }}
          >
            Escanear otra entrada
          </button>
        </div>
      )}

      {/* Camera view */}
      {!result && (
        <>
          <div className="relative rounded-2xl overflow-hidden bg-navy-light mb-4 aspect-[4/3]">
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white/50 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-red-shield rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-red-shield rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-red-shield rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-red-shield rounded-br-lg" />
                    {/* Scan line animation */}
                    <div className="absolute left-2 right-2 h-0.5 bg-red-shield/80 animate-bounce" style={{ animationDuration: '2s' }} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="text-5xl mb-4">📷</div>
                <p className="text-gray-blue text-sm">Cámara detenida</p>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {cameraError && (
            <div className="bg-red-shield/10 border border-red-shield/30 rounded-xl p-3 text-sm text-red-shield mb-4">
              {cameraError}
            </div>
          )}

          <div className="space-y-3">
            {!scanning ? (
              <button className="btn-primary" onClick={startCamera}>
                📷 Abrir cámara
              </button>
            ) : (
              <button className="btn-secondary" onClick={stopCamera}>
                Detener cámara
              </button>
            )}

            {/* Manual input fallback */}
            <div className="border-t border-blue-shield/20 pt-4 mt-4">
              <p className="text-xs text-gray-blue mb-2">
                Si la cámara no funciona, pegá el token del QR:
              </p>
              <div className="flex gap-2">
                <input
                  className="input-field text-sm flex-1"
                  placeholder="Token del QR..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualValidation()}
                />
                <button
                  className="btn-primary !w-auto !px-4"
                  onClick={handleManualValidation}
                  disabled={!manualToken.trim()}
                >
                  Validar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
