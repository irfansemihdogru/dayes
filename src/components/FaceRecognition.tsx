
import React, { useState, useEffect, useRef } from 'react';
import { Webcam } from './Webcam';
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from '@/context/ThemeContext';

interface FaceRecognitionProps {
  onDetected: () => void;
  isWelcomeMessagePlaying: boolean;
  redirectPath?: string; // Add optional redirect path prop
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({ 
  onDetected, 
  isWelcomeMessagePlaying,
  redirectPath = '/dashboard' // Default redirect path
}) => {
  const [detecting, setDetecting] = useState(true);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [detectedCount, setDetectedCount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const faceDetectedRef = useRef(false);
  const { isDarkMode } = useTheme();
  const [redirecting, setRedirecting] = useState(false);
  
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
  
  // Handle successful face detection and redirection
  const handleFaceDetectionSuccess = () => {
    console.log('Face detected successfully, preparing for redirection');
    setDetecting(false);
    setRedirecting(true);
    
    // Ensure any voice recognition is disabled during face detection
    const event = new CustomEvent('contractReading', { 
      detail: { isReading: true }
    });
    window.dispatchEvent(event);
    
    // Call the provided callback
    onDetected();
  };
  
  // Listen for the faceDetected event from the Webcam component
  useEffect(() => {
    const handleFaceEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (!detecting || !cameraActive || redirecting) return;
      
      if (customEvent.detail && customEvent.detail.detected !== undefined) {
        const detected = customEvent.detail.detected;
        
        if (detected) {
          // Face detected - increment counter
          setDetectedCount(prev => {
            const newCount = prev + 1;
            
            // Require 3 consecutive detections for more reliable detection
            if (newCount >= 3) {
              faceDetectedRef.current = true;
              
              // Only call onDetected if welcome message is not playing
              if (!isWelcomeMessagePlaying) {
                console.log('Face detection threshold met, preparing for redirection');
                if (detectionTimeoutRef.current) {
                  clearTimeout(detectionTimeoutRef.current);
                }
                handleFaceDetectionSuccess();
              }
              return newCount;
            }
            return newCount;
          });
        } else {
          // Reset the counter if face is lost
          setDetectedCount(0);
        }
      }
    };
    
    window.addEventListener('faceDetected', handleFaceEvent);
    
    // Set a fallback timeout to proceed after 8 seconds even without face detection
    detectionTimeoutRef.current = setTimeout(() => {
      if (detecting && cameraActive && !redirecting) {
        console.log('Timeout reached, proceeding anyway');
        faceDetectedRef.current = true;
        
        // Only proceed if welcome message has finished
        if (!isWelcomeMessagePlaying) {
          handleFaceDetectionSuccess();
        }
      }
    }, 8000); // 8 seconds timeout
    
    return () => {
      window.removeEventListener('faceDetected', handleFaceEvent);
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [detecting, onDetected, cameraActive, isWelcomeMessagePlaying, redirecting]);

  // Check if welcome message has finished playing and we have already detected a face
  useEffect(() => {
    if (faceDetectedRef.current && !isWelcomeMessagePlaying && detecting && !redirecting) {
      console.log('Welcome message finished and face already detected, proceeding to redirect');
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
      handleFaceDetectionSuccess();
    }
  }, [isWelcomeMessagePlaying, detecting, redirecting]);

  return (
    <Card className={`w-full max-w-5xl mx-auto ${isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90'} backdrop-blur-sm shadow-lg`}>
      <CardContent className="p-6">
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-800'} mb-4`}>Yüz Tanıma</h2>
          <div className="relative w-full h-[500px] bg-gray-100 dark:bg-gray-900 rounded-lg mb-4 overflow-hidden">
            <Webcam />
            {detecting && cameraActive && !redirecting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-64 h-64 border-4 ${isDarkMode ? 'border-blue-400' : 'border-blue-500'} rounded-full animate-pulse opacity-70`}></div>
              </div>
            )}
            {redirecting && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-64 h-64 border-4 ${isDarkMode ? 'border-green-400' : 'border-green-500'} rounded-full animate-pulse opacity-70`}></div>
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
              : redirecting
                ? "Yüzünüz başarıyla tanındı, yönlendiriliyorsunuz..."
                : detecting 
                  ? isWelcomeMessagePlaying
                    ? "Hoş geldiniz! Yönlendirme başlıyor..."
                    : "Yüzünüzü tanınıyor, lütfen kameraya bakınız..."
                  : "Yüzünüz başarıyla tanındı, uygulama başlatılıyor..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaceRecognition;
