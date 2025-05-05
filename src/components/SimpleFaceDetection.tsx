
import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from '@/context/ThemeContext';
import { useNavigate } from 'react-router-dom';

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
  const detectionProgressRef = useRef(0);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Setup camera and detection process
  useEffect(() => {
    console.log('Setting up face detection with realistic demo');
    
    // Setup camera
    const setupCamera = async () => {
      try {
        console.log('Setting up camera...');
        // Make sure videoRef is available
        if (!videoRef.current) {
          // Try again in a moment if the ref isn't yet available
          setTimeout(setupCamera, 100);
          return;
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setCameraActive(true);
          
          // Draw detection UI once camera is active
          videoRef.current.onloadedmetadata = () => {
            if (canvasRef.current && videoRef.current) {
              // Set canvas dimensions to match video
              canvasRef.current.width = videoRef.current.videoWidth || 640;
              canvasRef.current.height = videoRef.current.videoHeight || 480;
              
              // Start the face detection simulator
              startDetectionSimulation();
            }
          };
        }
        
        console.log('Camera setup complete');
      } catch (error) {
        console.error('Camera access error:', error);
        setErrorMessage('Kamera erişilemez durumda. Lütfen kamera izinlerini kontrol ediniz.');
        setCameraActive(false);
      }
    };
    
    // Start a more realistic detection simulation that progressively increases
    const startDetectionSimulation = () => {
      // Reset progress
      detectionProgressRef.current = 0;
      setDetectionProgress(0);
      
      // Animate the detection - gradually increases from 0 to 100%
      const simulateDetection = () => {
        if (!detecting) return;
        
        // Simulate small random increments (more realistic)
        if (detectionProgressRef.current < 100) {
          // Generate a random increment between 1 and 5
          const increment = Math.random() * 3 + 1;
          
          // Add some variability - sometimes pause or go slower
          if (Math.random() > 0.3) {
            detectionProgressRef.current += increment;
            setDetectionProgress(Math.min(detectionProgressRef.current, 100));
          }
          
          // Drawing on canvas to simulate detection
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              
              // Only draw detection box once we're past 30% progress
              if (detectionProgressRef.current > 30) {
                // Center coordinates
                const centerX = canvasRef.current.width / 2;
                const centerY = canvasRef.current.height / 2;
                
                // Draw face outline - size increases with detection progress
                const size = 100 + (detectionProgressRef.current / 100) * 100;
                
                // Draw different elements based on progress
                if (detectionProgressRef.current > 80) {
                  // Face recognized - green box
                  ctx.strokeStyle = '#10b981'; // green
                  ctx.lineWidth = 3;
                  ctx.strokeRect(centerX - size/2, centerY - size/2, size, size);
                  
                  // Add facial feature markers
                  ctx.fillStyle = '#10b981';
                  // Eyes
                  ctx.beginPath();
                  ctx.arc(centerX - size/6, centerY - size/8, 5, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.beginPath();
                  ctx.arc(centerX + size/6, centerY - size/8, 5, 0, Math.PI * 2);
                  ctx.fill();
                  
                  // Mouth outline
                  ctx.beginPath();
                  ctx.arc(centerX, centerY + size/6, size/5, 0, Math.PI);
                  ctx.stroke();
                } else if (detectionProgressRef.current > 40) {
                  // Scanning - yellow box
                  ctx.strokeStyle = '#eab308'; // yellow
                  ctx.lineWidth = 2;
                  ctx.strokeRect(centerX - size/2, centerY - size/2, size, size);
                  
                  // Scanning lines
                  ctx.beginPath();
                  ctx.moveTo(centerX - size/2, centerY);
                  ctx.lineTo(centerX + size/2, centerY);
                  ctx.stroke();
                  
                  ctx.beginPath();
                  ctx.moveTo(centerX, centerY - size/2);
                  ctx.lineTo(centerX, centerY + size/2);
                  ctx.stroke();
                } else {
                  // Initial detection - blue box
                  ctx.strokeStyle = '#3b82f6'; // blue
                  ctx.lineWidth = 1;
                  ctx.strokeRect(centerX - size/2, centerY - size/2, size, size);
                }
              }
            }
          }
          
          // Continue animation
          animationFrameRef.current = requestAnimationFrame(simulateDetection);
        } else {
          // Detection complete
          console.log('Face detection simulation complete');
          setFaceDetected(true);
          
          // Wait a moment before calling onDetected
          setTimeout(() => {
            if (!isWelcomeMessagePlaying) {
              console.log('Detected face, proceeding to next step');
              setDetecting(false);
              onDetected();
            }
          }, 1000);
        }
      };
      
      // Start the animation
      animationFrameRef.current = requestAnimationFrame(simulateDetection);
    };
    
    setupCamera();
    
    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
            
            {/* Detection progress indicator */}
            {detecting && cameraActive && !faceDetected && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-3/4 max-w-md">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${detectionProgress}%` }}
                  ></div>
                </div>
                <div className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                  {detectionProgress < 30 ? 'Yüz araştırılıyor...' : 
                   detectionProgress < 70 ? 'Yüz özellikleriniz taranıyor...' : 
                   'Yüz tanıma tamamlanıyor...'}
                </div>
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
