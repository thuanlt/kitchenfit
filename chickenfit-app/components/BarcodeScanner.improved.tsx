"use client";

import { useState, useRef, useEffect } from "react";

const PRIMARY = "#B85C38";
const SEP = "#E3D5C5";
const TEXT2 = "#8C6545";
const CARD = "#FFFDF8";

interface FoodProduct {
  barcode: string;
  name: string;
  brand?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size_g: number;
}

// Mock database of products (in real app, this would come from API)
const mockProductDatabase: Record<string, FoodProduct> = {
  "894310001001": {
    barcode: "894310001001",
    name: "Sữa tươi Vinamilik 100%",
    brand: "Vinamilk",
    calories: 48,
    protein_g: 3.2,
    carbs_g: 4.8,
    fat_g: 2.5,
    serving_size_g: 100,
  },
  "894310002001": {
    barcode: "894310002001",
    name: "Yogurt Vinamilk",
    brand: "Vinamilk",
    calories: 65,
    protein_g: 4.5,
    carbs_g: 7.0,
    fat_g: 2.0,
    serving_size_g: 100,
  },
  "894310003001": {
    barcode: "894310003001",
    name: "Phô mai Con Bò Cười",
    brand: "Con Bò Cười",
    calories: 320,
    protein_g: 22,
    carbs_g: 2,
    fat_g: 26,
    serving_size_g: 100,
  },
};

export default function BarcodeScanner({ onProductFound }: { onProductFound: (product: FoodProduct) => void }) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannedProduct, setScannedProduct] = useState<FoodProduct | null>(null);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
        setError("");
        
        // Start barcode detection loop
        detectBarcode();
      }
    } catch (err) {
      setError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
      console.error("Camera error:", err);
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const detectBarcode = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // In a real implementation, you would use a barcode detection library
      // like QuaggaJS or ZXing. For this demo, we'll simulate detection
      // after a short delay
      setTimeout(() => {
        if (isScanning) {
          // Simulate finding a barcode (in real app, this would be actual detection)
          const mockBarcode = Object.keys(mockProductDatabase)[Math.floor(Math.random() * Object.keys(mockProductDatabase).length)];
          handleBarcodeDetected(mockBarcode);
        }
      }, 2000);
    }

    if (isScanning) {
      requestAnimationFrame(detectBarcode);
    }
  };

  const handleBarcodeDetected = (barcode: string) => {
    const product = mockProductDatabase[barcode];
    if (product) {
      setScannedProduct(product);
      stopScanning();
    } else {
      setError("Không tìm thấy sản phẩm. Vui lòng thử lại hoặc nhập thủ công.");
    }
  };

  const handleManualSearch = () => {
    if (manualBarcode.trim()) {
      const product = mockProductDatabase[manualBarcode.trim()];
      if (product) {
        setScannedProduct(product);
        setError("");
      } else {
        setError("Không tìm thấy sản phẩm với mã vạch này.");
      }
    }
  };

  const handleAddToLog = () => {
    if (scannedProduct) {
      onProductFound(scannedProduct);
      setScannedProduct(null);
      setManualBarcode("");
    }
  };

  const handleReset = () => {
    setScannedProduct(null);
    setError("");
  };

  return (
    <div style={{ background: "var(--card)", borderRadius: 16, padding: "16px", border: "1px solid var(--sep)" }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
        Quét mã vạch
      </p>

      {!scannedProduct ? (
        <>
          {/* Camera View */}
          {isScanning ? (
            <div style={{ position: "relative", marginBottom: 12 }}>
              <video
                ref={videoRef}
                style={{ 
                  width: "100%", 
                  borderRadius: 12, 
                  background: "#000" 
                }}
                playsInline
                muted
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              
              {/* Scanning overlay */}
              <div style={{ 
                position: "absolute", 
                top: "50%", 
                left: "50%", 
                transform: "translate(-50%, -50%)", 
                width: "80%", 
                height: "40%",
                border: "2px solid var(--primary)",
                borderRadius: 8,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)"
              }}>
                <div style={{ 
                  position: "absolute", 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: "2px", 
                  background: "var(--primary)",
                  animation: "scan 2s linear infinite"
                }} />
              </div>
              
              <style jsx>{`
                @keyframes scan {
                  0% { top: 0; }
                  100% { top: 100%; }
                }
              `}</style>

              <button
                onClick={stopScanning}
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(255,255,255,0.9)",
                  color: "var(--text)",
                  border: "none",
                  borderRadius: 20,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Hủy quét
              </button>
            </div>
          ) : (
            <button
              onClick={startScanning}
              style={{
                width: "100%",
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "14px",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 12,
              }}
            >
              📷 Bắt đầu quét
            </button>
          )}

          {/* Manual Input */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Nhập mã vạch thủ công..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
              style={{
                flex: 1,
                background: "var(--bg)",
                border: "1.5px solid var(--sep)",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                outline: "none",
              }}
            />
            <button
              onClick={handleManualSearch}
              style={{
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Tìm
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: "10px 12px",
              background: "#fee",
              border: "1px solid #fcc",
              borderRadius: 8,
              color: "#c33",
              fontSize: 12,
              fontWeight: 600,
            }}>
              ⚠️ {error}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Product Found */}
          <div style={{ 
            padding: "12px", 
            background: "linear-gradient(135deg,#F5EDDC,#EEE0C8)",
            borderRadius: 12,
            border: "1.5px solid #D4B896",
            marginBottom: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 10, 
                background: "#fff", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                fontSize: 24 
              }}>
                📦
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 2 }}>
                  {scannedProduct.name}
                </p>
                {scannedProduct.brand && (
                  <p style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>
                    {scannedProduct.brand}
                  </p>
                )}
              </div>
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(2, 1fr)", 
              gap: 8,
              marginTop: 8
            }}>
              <div style={{ 
                padding: "8px", 
                background: "rgba(255,255,255,0.5)", 
                borderRadius: 8 
              }}>
                <p style={{ fontSize: 10, color: "var(--text2)", fontWeight: 600 }}>Calories</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)" }}>
                  {scannedProduct.calories} kcal
                </p>
              </div>
              <div style={{ 
                padding: "8px", 
                background: "rgba(255,255,255,0.5)", 
                borderRadius: 8 
              }}>
                <p style={{ fontSize: 10, color: "var(--text2)", fontWeight: 600 }}>Protein</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#3498db" }}>
                  {scannedProduct.protein_g}g
                </p>
              </div>
              <div style={{ 
                padding: "8px", 
                background: "rgba(255,255,255,0.5)", 
                borderRadius: 8 
              }}>
                <p style={{ fontSize: 10, color: "var(--text2)", fontWeight: 600 }}>Carbs</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#2ecc71" }}>
                  {scannedProduct.carbs_g}g
                </p>
              </div>
              <div style={{ 
                padding: "8px", 
                background: "rgba(255,255,255,0.5)", 
                borderRadius: 8 
              }}>
                <p style={{ fontSize: 10, color: "var(--text2)", fontWeight: 600 }}>Fat</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#f39c12" }}>
                  {scannedProduct.fat_g}g
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                background: "var(--bg)",
                color: "var(--text)",
                border: "1.5px solid var(--sep)",
                borderRadius: 10,
              padding: "12px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Quét lại
            </button>
            <button
              onClick={handleAddToLog}
              style={{
                flex: 1,
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Thêm vào nhật ký
            </button>
          </div>
        </>
      )}
    </div>
  );
}
