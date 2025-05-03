
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
  const streamRef = useRef<MediaStream | null>(null);
  const { isDarkMode } = useTheme();
  
  // Setup camera and detection timeout
  useEffect(() => {
    console.log('Setting up face detection demo');
    
    // Setup camera
    const setupCamera = async () => {
      if (!videoRef.current) return;
      
      try {
        console.log('Setting up camera...');
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
        
        // Draw detection UI once camera is active
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx && videoRef.current) {
            // Set canvas dimensions to match video
            canvasRef.current.width = videoRef.current.videoWidth || 640;
            canvasRef.current.height = videoRef.current.videoHeight || 480;
            
            // Draw detection UI - just a simple outline for demo
            ctx.strokeStyle = 'green';
            ctx.lineWidth = 3;
            
            // Draw a detection rectangle in the middle
            const centerX = (canvasRef.current.width / 2) - 75;
            const centerY = (canvasRef.current.height / 2) - 75;
            ctx.strokeRect(centerX, centerY, 150, 150);
          }
        }
        
        console.log('Camera setup complete');
      } catch (error) {
        console.error('Camera access error:', error);
        setErrorMessage('Kamera erişilemez durumda. Lütfen kamera izinlerini kontrol ediniz.');
        setCameraActive(false);
      }
    };
    
    setupCamera();
    
    // Demo mode: Set timeout to simulate face detection after 3 seconds
    detectionTimeoutRef.current = setTimeout(() => {
      console.log('Demo face detection timeout triggered');
      if (detecting) {
        setFaceDetected(true);
        
        // Only complete detection if welcome message is not playing
        if (!isWelcomeMessagePlaying) {
          console.log('Detected face, proceeding to next step');
          setDetecting(false);
          onDetected();
        }
      }
    }, 5000);
    
    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [onDetected, isWelcomeMessagePlaying]);

  // Handle welcome message completion
  useEffect(() => {
    if (!isWelcomeMessagePlaying && faceDetected && detecting) {
      console.log('Welcome message finished and face detected, proceeding');
      setDetecting(false);
      onDetected();
    }
  }, [isWelcomeMessagePlaying, faceDetected, detecting, onDetected]);
  
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
              style={{ transform: 'scaleX(-1)' }} // Mirror effect
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
              style={{ transform: 'scaleX(-1)' }} // Mirror effect
            />
            
            {detecting && cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
            
            {faceDetected && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full">
                Yüz tespit edildi!
              </div>
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
