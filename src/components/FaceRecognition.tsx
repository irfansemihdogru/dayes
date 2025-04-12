import React, { useState, useEffect, useRef } from 'react';
import { Webcam } from './Webcam';
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from '@/context/ThemeContext';

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
  const consecutiveFaceDetections = useRef(0);
  const { isDarkMode } = useTheme();
  const navigatedRef = useRef(false); // Track if we've already navigated to prevent multiple calls
  
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
          consecutiveFaceDetections.current = 0;
          navigatedRef.current = false; // Reset navigation state
        }
      }
    };
    
    window.addEventListener('cameraStatus', handleCameraStatus);
    
    return () => {
      window.removeEventListener('cameraStatus', handleCameraStatus);
    };
  }, []);
  
  // Listen for the faceDetected event from the Webcam component
  const handleFaceDetection = (detected: boolean, facingCamera: boolean) => {
    if (!detecting || !cameraActive || navigatedRef.current) return;
    
    // Only consider detection valid if the person is actually facing the camera
    if (detected && facingCamera) {
      consecutiveFaceDetections.current += 1;
      
      // Require only 1 detection for faster response (reduced from 2)
      if (consecutiveFaceDetections.current >= 1) {
        // If we detect face consistently, navigate immediately
        if (!navigatedRef.current) {
          navigatedRef.current = true; // Mark that we've navigated
          faceDetectedRef.current = true;
          setDetectedCount(prev => prev + 1);
          setDetecting(false);
          
          if (detectionTimeoutRef.current) {
            clearTimeout(detectionTimeoutRef.current);
          }
          
          // Navigate immediately regardless of welcome message status for faster response
          onDetected();
        }
      }
    } else {
      // Reset detection when face is lost (but keep it slower to prevent flickering)
      consecutiveFaceDetections.current = 0;
    }
  };

  // Check if welcome message has finished playing and we have already detected a face
  useEffect(() => {
    if (faceDetectedRef.current && !isWelcomeMessagePlaying && detecting && !navigatedRef.current) {
      navigatedRef.current = true; // Mark that we've navigated
      setDetecting(false);
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
      // Navigate immediately
      onDetected();
    }
  }, [isWelcomeMessagePlaying, onDetected, detecting]);

  // Use a global event listener for face detection events
  useEffect(() => {
    const handleFaceEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const { detected, facingCamera } = customEvent.detail;
        handleFaceDetection(detected, facingCamera);
      }
    };
    
    window.addEventListener('faceDetected', handleFaceEvent);
    
    // Reduced timeout for faster response - 2 seconds instead of 5
    detectionTimeoutRef.current = setTimeout(() => {
      if (detecting && cameraActive && !navigatedRef.current) {
        // If we have any detection at all after this short timeout, just navigate
        if (detectedCount > 0 || consecutiveFaceDetections.current > 0) {
          navigatedRef.current = true; // Mark that we've navigated
          setDetecting(false);
          faceDetectedRef.current = true;
          onDetected();
        }
      }
    }, 2000); // Reduced timeout to 2 seconds for faster response
    
    return () => {
      window.removeEventListener('faceDetected', handleFaceEvent);
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [detecting, onDetected, cameraActive, isWelcomeMessagePlaying, detectedCount]);

  return (
    <Card className={`w-full max-w-5xl mx-auto ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90'} backdrop-blur-sm shadow-lg`}>
      <CardContent className="p-6">
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-800'} mb-4`}>Yüz Tanıma</h2>
          <div className="relative w-full h-[500px] bg-gray-100 dark:bg-gray-900 rounded-lg mb-4 overflow-hidden">
            <Webcam />
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
                  : "Lütfen kameraya bakınız, yüzünüz tanınıyor..."
                : "Yüzünüz başarıyla tanındı, uygulama başlatılıyor..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaceRecognition;
