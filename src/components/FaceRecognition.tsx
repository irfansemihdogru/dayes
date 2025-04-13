
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
  const [faceDetected, setFaceDetected] = useState(false);
  const [isUserEngaged, setIsUserEngaged] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(isWelcomeMessagePlaying);
  const faceDetectedRef = useRef(false);
  const { isDarkMode } = useTheme();
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Listen for camera status from the Webcam component
  useEffect(() => {
    const handleCameraStatus = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.active !== undefined) {
        setCameraActive(customEvent.detail.active);
        
        // Reset face detection when camera becomes inactive
        if (!customEvent.detail.active) {
          setFaceDetected(false);
          setIsUserEngaged(false);
          faceDetectedRef.current = false;
        }
      }
    };
    
    window.addEventListener('cameraStatus', handleCameraStatus);
    
    return () => {
      window.removeEventListener('cameraStatus', handleCameraStatus);
    };
  }, []);
  
  // Listen for face detection events - optimized for faster response
  useEffect(() => {
    const handleFaceEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.detected !== undefined) {
        setFaceDetected(customEvent.detail.detected);
        if (customEvent.detail.detected) {
          faceDetectedRef.current = true;
        }
      }
    };
    
    // Listen for user engagement events (looking at camera) - faster response
    const handleEngagementEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.engaged !== undefined) {
        setIsUserEngaged(customEvent.detail.engaged);
        
        // Only proceed with detection if the user is engaged (looking at camera)
        // and welcome message isn't playing and we're still in detecting state
        if (customEvent.detail.engaged && !isWelcomeMessagePlaying && detecting) {
          if (detectionTimeoutRef.current) {
            clearTimeout(detectionTimeoutRef.current);
          }
          
          // Reduced delay to make detection faster (from 800ms to 400ms)
          detectionTimeoutRef.current = setTimeout(() => {
            if (detecting) {
              setDetecting(false);
              onDetected();
            }
          }, 400);
        } else if (!customEvent.detail.engaged) {
          // If user looks away, cancel any pending detection
          if (detectionTimeoutRef.current) {
            clearTimeout(detectionTimeoutRef.current);
            detectionTimeoutRef.current = null;
          }
        }
      }
    };
    
    window.addEventListener('faceDetected', handleFaceEvent);
    window.addEventListener('userEngagement', handleEngagementEvent);
    
    return () => {
      window.removeEventListener('faceDetected', handleFaceEvent);
      window.removeEventListener('userEngagement', handleEngagementEvent);
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, [detecting, onDetected, isWelcomeMessagePlaying]);
  
  // Update isSpeaking status when welcome message changes
  useEffect(() => {
    setIsSpeaking(isWelcomeMessagePlaying);
  }, [isWelcomeMessagePlaying]);
  
  // Check if welcome message has finished and face is detected and user is engaged - faster now
  useEffect(() => {
    if (faceDetectedRef.current && isUserEngaged && !isWelcomeMessagePlaying && detecting) {
      setDetecting(false);
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
      onDetected();
    }
  }, [isWelcomeMessagePlaying, onDetected, detecting, isUserEngaged]);

  return (
    <Card className={`w-full max-w-5xl mx-auto ${isDarkMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95'} backdrop-blur-sm shadow-lg transition-all duration-300`}>
      <CardContent className="p-6">
        <div className="text-center">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-800'} mb-4`}>Yüz Tanıma</h2>
          <div className="relative w-full h-[500px] bg-gray-100 dark:bg-gray-900 rounded-lg mb-4 overflow-hidden shadow-inner">
            <Webcam />
            {detecting && cameraActive && faceDetected && !isUserEngaged && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-64 h-64 border-4 ${isDarkMode ? 'border-yellow-400' : 'border-yellow-500'} rounded-full animate-pulse opacity-70`}></div>
              </div>
            )}
            {detecting && cameraActive && isUserEngaged && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-64 h-64 border-4 ${isDarkMode ? 'border-green-400' : 'border-green-500'} rounded-full animate-pulse opacity-70`}></div>
              </div>
            )}
            {!cameraActive && (
              <Alert variant="destructive" className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} max-w-md`}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Kamera erişilemez durumda. Lütfen kamera izinlerini kontrol edin.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-lg font-medium`}>
            {!cameraActive 
              ? "Kamera izni gerekli." 
              : detecting
                ? isSpeaking
                  ? "Hoş geldiniz..."
                  : faceDetected
                    ? isUserEngaged
                      ? "Yüzünüz tanındı..."
                      : "Ekrana bakın"
                    : "Yüzünüzü gösterin"
                : "Başlatılıyor..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FaceRecognition;
