
import React, { useState, useEffect, useRef } from 'react';
import { Webcam } from './Webcam';
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FaceRecognitionProps {
  onDetected: () => void;
  isWelcomeMessagePlaying: boolean;
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({ onDetected, isWelcomeMessagePlaying }) => {
  const [detecting, setDetecting] = useState(true);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [detectedCount, setDetectedCount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const faceDetectedRef = useRef(false);
  
  // Listen for camera status from the Webcam component
  useEffect(() => {
    const handleCameraStatus = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.active !== undefined) {
        setCameraActive(customEvent.detail.active);
        
        // Reset face detection when camera becomes inactive
        if (!customEvent.detail.active) {
          setDetectedCount(0);
          faceDetectedRef.current = false;
        }
      }
    };
    
    window.addEventListener('cameraStatus', handleCameraStatus);
    
    return () => {
      window.removeEventListener('cameraStatus', handleCameraStatus);
    };
  }, []);
  
  // Listen for the faceDetected event from the Webcam component
  const handleFaceDetection = (detected: boolean) => {
    console.log('Face detection status:', detected);
    
    if (!detecting || !cameraActive) return;
    
    if (detected) {
      // Increment detection count to make the detection more reliable
      setDetectedCount(prev => {
        const newCount = prev + 1;
        console.log('Face detection count:', newCount);
        
        // After 3 consecutive detections, mark face as detected
        if (newCount >= 3) {
          console.log('Face reliably detected');
          faceDetectedRef.current = true;
          
          // Only call onDetected if welcome message is not playing
          if (!isWelcomeMessagePlaying) {
            console.log('Welcome message finished, triggering onDetected');
            setDetecting(false);
            if (detectionTimeoutRef.current) {
              clearTimeout(detectionTimeoutRef.current);
            }
            onDetected();
          } else {
            console.log('Welcome message is still playing, waiting to proceed');
          }
          return newCount;
        }
        return newCount;
      });
    } else {
      // Reset the counter if face is lost
      setDetectedCount(0);
    }
  };

  // Check if welcome message has finished playing and we have already detected a face
  useEffect(() => {
    if (faceDetectedRef.current && !isWelcomeMessagePlaying && detecting) {
      console.log('Welcome message finished and face already detected, triggering onDetected');
      setDetecting(false);
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
      onDetected();
    }
  }, [isWelcomeMessagePlaying, onDetected, detecting]);

  // Use a global event listener for face detection events
  useEffect(() => {
    const handleFaceEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.detected !== undefined) {
        handleFaceDetection(customEvent.detail.detected);
      }
    };
    
    window.addEventListener('faceDetected', handleFaceEvent);
    
    // Set a fallback timeout in case face detection doesn't work
    detectionTimeoutRef.current = setTimeout(() => {
      console.log('Face detection timeout, checking camera status before proceeding');
      if (detecting && cameraActive) {
        console.log('Camera is active, forcing onDetected after timeout');
        setDetecting(false);
        faceDetectedRef.current = true;
        
        // Only proceed if welcome message has finished
        if (!isWelcomeMessagePlaying) {
          onDetected();
        }
      } else {
        console.log('Camera inactive, not proceeding with timeout');
      }
    }, 15000); // 15 seconds timeout
    
    return () => {
      window.removeEventListener('faceDetected', handleFaceEvent);
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [detecting, onDetected, cameraActive, isWelcomeMessagePlaying]);

  return (
    <Card className="w-full max-w-5xl bg-white/90 backdrop-blur-sm shadow-lg">
      <CardContent className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Yüz Tanıma</h2>
          <div className="relative w-full h-[500px] bg-gray-100 rounded-lg mb-4 overflow-hidden">
            <Webcam />
            {detecting && cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-blue-500 rounded-full animate-pulse opacity-70"></div>
              </div>
            )}
            {!cameraActive && (
              <Alert variant="destructive" className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Kamera erişilemez durumda. Lütfen kamera izinlerini kontrol edin ve sayfayı yenileyin.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <p className="text-gray-600">
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

export default FaceRecognition;
