
import React, { useRef, useEffect, useState } from 'react';

export const Webcam: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectionInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Function to detect faces using the built-in browser API
  const detectFaces = async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    if (!video.videoWidth || !video.videoHeight) return;
    
    try {
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Simple face detection using color detection for skin tones
      // This is a very basic approach and not as accurate as ML-based methods
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Look for pixel patterns that might indicate a face
      // This is a simplistic algorithm that looks for skin tone colors
      let facePixels = 0;
      const totalPixels = data.length / 4;
      
      for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel for performance
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Simple skin tone detection
        if (r > 60 && g > 40 && b > 20 && 
            r > g && r > b && 
            r - g > 15 && 
            r - b > 15) {
          facePixels++;
        }
      }
      
      // If more than 5% of pixels match our skin tone criteria, assume a face is present
      const faceDetected = (facePixels / (totalPixels / 4)) > 0.05;
      setFaceDetected(faceDetected);
      
      // Dispatch custom event for face detection
      const event = new CustomEvent('faceDetected', { 
        detail: { detected: faceDetected } 
      });
      window.dispatchEvent(event);
      
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
            
            // Start face detection loop
            faceDetectionInterval.current = setInterval(() => {
              detectFaces(video, canvas);
            }, 200); // Check for faces every 200ms
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
        <div className="absolute top-0 left-0 w-full bg-red-500 text-white p-2 text-center">
          {errorMessage}
          <button 
            onClick={handleManualDetection}
            className="ml-2 bg-white text-red-500 px-2 py-1 rounded text-sm"
            aria-label="Devam Et"
          >
            Devam Et
          </button>
        </div>
      )}
      
      <div className="text-blue-900 text-opacity-70 text-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {!cameraActive 
          ? "Kamera erişimi bekleniyor..." 
          : faceDetected 
            ? "Yüz algılandı!" 
            : "Yüzünüzü kameraya gösteriniz"}
      </div>
      
      {faceDetected && cameraActive && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-4 border-green-500 rounded-full animate-pulse opacity-70"></div>
        </div>
      )}
    </div>
  );
};
