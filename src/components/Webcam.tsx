
import React, { useRef, useEffect, useState } from 'react';

export const Webcam: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectionInterval = useRef<NodeJS.Timeout | null>(null);
  const lastFaceDetectedTime = useRef<number | null>(null);
  const consecutiveDetectionsRef = useRef(0);
  const consecutiveNonDetectionsRef = useRef(0);
  
  // Function to detect faces using the built-in browser API with improved sensitivity
  const detectFaces = async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    if (!video.videoWidth || !video.videoHeight) return;
    
    try {
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Enhanced face detection using color detection for skin tones with focus on center area
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Focus on the center area where a face is more likely to be
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const faceAreaRadius = Math.min(canvas.width, canvas.height) * 0.4; // Focus on 40% of central area
      
      let facePixels = 0;
      let totalSampledPixels = 0;
      
      // Sample pixels more densely in the center area
      for (let y = 0; y < canvas.height; y += 8) {
        for (let x = 0; x < canvas.width; x += 8) {
          // Calculate distance from center
          const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          
          // Weight pixels closer to center more heavily
          if (distFromCenter <= faceAreaRadius) {
            const i = (y * canvas.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Improved skin tone detection - more sensitive to common skin color ranges
            if (r > 60 && g > 40 && b > 20 && 
                r > g && r > b && 
                Math.abs(r - g) > 15) {
              facePixels++;
            }
            totalSampledPixels++;
          }
        }
      }
      
      // Calculate face detection ratio with higher weight for center area
      const faceRatio = totalSampledPixels > 0 ? facePixels / totalSampledPixels : 0;
      const currentFaceDetected = faceRatio > 0.08; // More sensitive threshold
      
      // Implement hysteresis to avoid flickering
      if (currentFaceDetected) {
        consecutiveDetectionsRef.current++;
        consecutiveNonDetectionsRef.current = 0;
        
        // Require several consecutive detections for stability
        if (consecutiveDetectionsRef.current >= 3 && !faceDetected) {
          setFaceDetected(true);
          lastFaceDetectedTime.current = Date.now();
          
          // Dispatch custom event for face detection
          const event = new CustomEvent('faceDetected', { 
            detail: { detected: true } 
          });
          window.dispatchEvent(event);
        }
      } else {
        consecutiveNonDetectionsRef.current++;
        consecutiveDetectionsRef.current = 0;
        
        // Require several consecutive non-detections before declaring face lost
        if (consecutiveNonDetectionsRef.current >= 10 && faceDetected) {
          setFaceDetected(false);
          
          // Dispatch custom event for face lost
          const event = new CustomEvent('faceDetected', { 
            detail: { detected: false } 
          });
          window.dispatchEvent(event);
        }
      }
      
      // Check if face was detected recently but person may have walked away
      if (faceDetected && lastFaceDetectedTime.current) {
        const elapsed = Date.now() - lastFaceDetectedTime.current;
        if (elapsed > 5000 && consecutiveNonDetectionsRef.current > 15) {
          // Person likely left - reset face detection
          setFaceDetected(false);
          lastFaceDetectedTime.current = null;
          
          // Dispatch custom event for face lost
          const event = new CustomEvent('faceDetected', { 
            detail: { detected: false } 
          });
          window.dispatchEvent(event);
        }
      }
      
    } catch (error) {
      console.error('Error during face detection:', error);
    }
  };
  
  // Initialize camera
  useEffect(() => {
    const setupCamera = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          } 
        });
        
        streamRef.current = stream;
        video.srcObject = stream;
        
        // Set camera as active
        setCameraActive(true);
        
        // Emit camera status event
        const event = new CustomEvent('cameraStatus', { 
          detail: { active: true } 
        });
        window.dispatchEvent(event);
        
        video.onloadedmetadata = () => {
          video.play().then(() => {
            console.log('Video playback started');
            
            // Configure canvas to match video dimensions
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Start face detection loop - more frequent checks for better responsiveness
            faceDetectionInterval.current = setInterval(() => {
              detectFaces(video, canvas);
            }, 150); // Check more frequently for better responsiveness
          }).catch(err => {
            console.error("Error playing video:", err);
            handleCameraError("Kamera başlatılamadı");
          });
        };
      } catch (err) {
        console.error("Error accessing the camera:", err);
        handleCameraError('Kamera erişilemez durumda. Lütfen kamera izinlerini kontrol ediniz.');
      }
    };
    
    setupCamera();
    
    return () => {
      // Clean up
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (faceDetectionInterval.current) {
        clearInterval(faceDetectionInterval.current);
      }
      
      // Emit camera inactive event
      const event = new CustomEvent('cameraStatus', { 
        detail: { active: false } 
      });
      window.dispatchEvent(event);
    };
  }, []);
  
  const handleCameraError = (message: string) => {
    setErrorMessage(message);
    setCameraActive(false);
    
    // Emit camera status event
    const event = new CustomEvent('cameraStatus', { 
      detail: { active: false } 
    });
    window.dispatchEvent(event);
  };
  
  // Check camera status periodically
  useEffect(() => {
    const checkCameraStatus = setInterval(() => {
      if (streamRef.current) {
        const tracks = streamRef.current.getVideoTracks();
        const isActive = tracks.length > 0 && tracks[0].enabled && tracks[0].readyState === 'live';
        
        if (cameraActive !== isActive) {
          setCameraActive(isActive);
          
          // Emit camera status event
          const event = new CustomEvent('cameraStatus', { 
            detail: { active: isActive } 
          });
          window.dispatchEvent(event);
        }
      }
    }, 1000);
    
    return () => clearInterval(checkCameraStatus);
  }, [cameraActive]);
  
  // Provide a manual way to bypass face detection if needed
  const handleManualDetection = () => {
    const event = new CustomEvent('faceDetected', { 
      detail: { detected: true } 
    });
    window.dispatchEvent(event);
    setFaceDetected(true);
  };
  
  return (
    <div className="w-full h-full relative">
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
        style={{ display: 'none' }} 
      />
      
      {errorMessage && (
        <div className="absolute top-0 left-0 w-full bg-red-500 dark:bg-red-700 text-white p-2 text-center">
          {errorMessage}
          <button 
            onClick={handleManualDetection}
            className="ml-2 bg-white text-red-500 dark:bg-gray-800 dark:text-red-300 px-2 py-1 rounded text-sm"
            aria-label="Devam Et"
          >
            Devam Et
          </button>
        </div>
      )}
      
      <div className="text-blue-900 dark:text-blue-300 text-opacity-70 dark:text-opacity-90 text-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/60 dark:bg-gray-800/60 px-4 py-2 rounded-lg">
        {!cameraActive 
          ? "Kamera erişimi bekleniyor..." 
          : faceDetected 
            ? "Yüz algılandı!" 
            : "Yüzünüzü kameraya gösteriniz"}
      </div>
      
      {faceDetected && cameraActive && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-4 border-green-500 dark:border-green-400 rounded-full animate-pulse opacity-70"></div>
        </div>
      )}
      
      {cameraActive && !faceDetected && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-dashed border-blue-500 dark:border-blue-400 rounded-full opacity-50"></div>
          <div className="absolute w-24 h-24 border-2 border-yellow-500 dark:border-yellow-400 rounded-full opacity-70"></div>
        </div>
      )}
    </div>
  );
};
