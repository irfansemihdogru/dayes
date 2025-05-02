
import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from '@/context/ThemeContext';

interface SimpleFaceDetectionProps {
  onDetected: () => void;
  isWelcomeMessagePlaying: boolean;
}

const SimpleFaceDetection: React.FC<SimpleFaceDetectionProps> = ({ onDetected, isWelcomeMessagePlaying }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [detecting, setDetecting] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const detectedCountRef = useRef(0);
  const faceDetectedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<tf.GraphModel | null>(null);
  const { isDarkMode } = useTheme();
  
  // TensorFlow model yükleme
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        console.log('TensorFlow backend ready:', tf.getBackend());
        
        // BlazeFace modelini yükleme
        const model = await tf.loadGraphModel(
          'https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1',
          { fromTFHub: true }
        );
        
        modelRef.current = model;
        console.log('Model başarıyla yüklendi');
        
        // Kamera kurulumunu başlat
        await setupCamera();
      } catch (error) {
        console.error('Model yüklenemedi:', error);
        setErrorMessage('Yüz tanıma modeli yüklenemedi. Lütfen sayfayı yenileyin.');
      }
    };
    
    loadModel();
    
    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, []);

  // Kamera kurulumu
  const setupCamera = async () => {
    if (!videoRef.current) return;
    
    try {
      console.log('Kamera kuruluyor...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });
      
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setCameraActive(true);
      
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play()
          .then(() => {
            console.log('Video oynatma başladı');
            // Düzenli aralıklarla yüz algılamayı başlat
            startFaceDetection();
            
            // 8 saniye içinde yüz algılanamazsa otomatik olarak devam et
            detectionTimeoutRef.current = setTimeout(() => {
              if (detecting && cameraActive) {
                setDetecting(false);
                faceDetectedRef.current = true;
                
                if (!isWelcomeMessagePlaying) {
                  onDetected();
                }
              }
            }, 8000);
          })
          .catch((error) => {
            console.error('Video oynatma hatası:', error);
            setErrorMessage('Kamera başlatılamadı: ' + error.message);
          });
      };
    } catch (error) {
      console.error('Kamera erişim hatası:', error);
      setErrorMessage('Kamera erişilemez durumda. Lütfen kamera izinlerini kontrol ediniz.');
      setCameraActive(false);
    }
  };
  
  // Yüz algılama fonksiyonu
  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !modelRef.current || !cameraActive) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.paused || video.ended) return;
    
    try {
      // Videoyu tensor'a dönüştür
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      // Canvas'ı video boyutlarına ayarla
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Video görüntüsünü TensorFlow tensor'a dönüştür
      const tfImg = tf.browser.fromPixels(video);
      const expandedImg = tfImg.expandDims(0);
      
      // Modelden tahmin al
      const predictions = await modelRef.current.executeAsync(expandedImg);
      
      // Belleği temizle
      tfImg.dispose();
      expandedImg.dispose();
      
      // Tahminleri işle
      // BlazeFace modeli [1, n, 17] şeklinde bir dizi döndürür
      // Her yüz için 17 değer: [yüz_skoru, x, y, genişlik, yükseklik, 6 yüz noktası koordinatları]
      let faceFound = false;
      
      // Çoklu sonuç olabilir, her birini kontrol et
      if (Array.isArray(predictions) && predictions.length > 0) {
        const faces = await predictions[0].array();
        if (faces && faces.length > 0 && faces[0].length > 0) {
          // En az bir yüz algılandı
          faceFound = true;
          
          // Canvas'a yüz çerçevesini çiz
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'green';
            
            for (const face of faces) {
              if (face[0] > 0.7) { // Sadece skoru yüksek yüzleri göster
                const x = face[1] * videoWidth;
                const y = face[2] * videoHeight;
                const width = face[3] * videoWidth;
                const height = face[4] * videoHeight;
                
                // Yüz çerçevesini çiz
                ctx.beginPath();
                ctx.rect(x, y, width, height);
                ctx.stroke();
              }
            }
          }
        }
      }
      
      // Tüm TensorFlow tensörlerini temizle
      if (Array.isArray(predictions)) {
        predictions.forEach(t => t.dispose());
      }
      
      // Yüz algılama durumunu güncelle
      if (faceFound) {
        detectedCountRef.current += 1;
        
        // 3 kez üst üste yüz algılanırsa işlemi tamamla
        if (detectedCountRef.current >= 3) {
          setFaceDetected(true);
          
          if (!faceDetectedRef.current) {
            faceDetectedRef.current = true;
            
            // Hoşgeldin mesajı bittiğinde işlemi tamamla
            if (!isWelcomeMessagePlaying) {
              setDetecting(false);
              if (detectionTimeoutRef.current) {
                clearTimeout(detectionTimeoutRef.current);
              }
              onDetected();
            }
          }
        }
      } else {
        // Yüz algılanamazsa sayacı sıfırla
        detectedCountRef.current = 0;
      }
    } catch (error) {
      console.error('Yüz algılamada hata:', error);
    }
  };
  
  // Düzenli aralıklarla yüz algılama
  const startFaceDetection = () => {
    if (!videoRef.current || !cameraActive) return;
    
    const interval = setInterval(() => {
      if (!detecting) {
        clearInterval(interval);
        return;
      }
      detectFaces();
    }, 150);
    
    // Component unmount olduğunda interval'i temizle
    return () => clearInterval(interval);
  };
  
  // Hoşgeldin mesajı bittiyse ve yüz zaten algılandıysa devam et
  useEffect(() => {
    if (faceDetectedRef.current && !isWelcomeMessagePlaying && detecting) {
      setDetecting(false);
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
      onDetected();
    }
  }, [isWelcomeMessagePlaying, onDetected, detecting]);
  
  return (
    <Card className={`w-full max-w-5xl mx-auto ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90'} backdrop-blur-sm shadow-lg`}>
      <CardContent className="p-6">
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-800'} mb-4`}>Yüz Tanıma</h2>
          <div className="relative w-full h-[500px] bg-gray-100 dark:bg-gray-900 rounded-lg mb-4 overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover rounded-lg"
              playsInline
              autoPlay
              muted
              style={{ transform: 'scaleX(-1)' }} // Ayna efekti
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
              style={{ transform: 'scaleX(-1)' }} // Ayna efekti
            />
            
            {detecting && cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-64 h-64 border-4 ${isDarkMode ? 'border-blue-400' : 'border-blue-500'} rounded-full animate-pulse opacity-70`}></div>
              </div>
            )}
            
            {!cameraActive && (
              <Alert variant="destructive" className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'} max-w-md`}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Kamera erişilemez durumda. Lütfen kamera izinlerini kontrol edin ve sayfayı yenileyin.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {!cameraActive 
              ? "Kamera izni gerekli. Lütfen izin veriniz." 
              : detecting 
                ? isWelcomeMessagePlaying
                  ? "Hoş geldiniz! Yönlendirme başlıyor..."
                  : "Yüzünüz tanınıyor, lütfen kameraya bakınız..."
                : "Yüzünüz başarıyla tanındı, uygulama başlatılıyor..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleFaceDetection;
