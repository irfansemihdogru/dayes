
import React, { useRef, useEffect, useState } from 'react';

export const Webcam: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [facingCamera, setFacingCamera] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectionInterval = useRef<NodeJS.Timeout | null>(null);
  const lastFaceDetectedTime = useRef<number | null>(null);
  const consecutiveDetectionsRef = useRef(0);
  const consecutiveNonDetectionsRef = useRef(0);
  const facingCameraConsecutiveRef = useRef(0);
  
  // Enhanced face detection using image processing - optimized for speed
  const detectFaces = async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    if (!video.videoWidth || !video.videoHeight) return;
    
    try {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      
      // Draw the current video frame to the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Focus on the center area where a face is more likely to be
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const faceAreaRadius = Math.min(canvas.width, canvas.height) * 0.35; // Focus on central area
      
      // Get image data from the center area
      const imageData = context.getImageData(
        centerX - faceAreaRadius,
        centerY - faceAreaRadius,
        faceAreaRadius * 2,
        faceAreaRadius * 2
      );
      
      const data = imageData.data;
      let facePixels = 0;
      let totalSampledPixels = 0;
      let eyeRegionPixels = 0;
      let eyeRegionTotal = 0;
      
      // First pass - detect face
      for (let y = 0; y < imageData.height; y += 5) {
        for (let x = 0; x < imageData.width; x += 5) {
          // Calculate distance from center of the sampled area
          const distFromCenter = Math.sqrt(Math.pow(x - imageData.width/2, 2) + Math.pow(y - imageData.height/2, 2));
          
          // Give more weight to pixels closer to center
          if (distFromCenter <= faceAreaRadius * 0.8) { // Focus more on the very center
            const i = (y * imageData.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Improved skin tone detection
            if (r > 60 && g > 40 && b > 20 && r > g && r > b) {
              facePixels++;
            }
            totalSampledPixels++;
            
            // Check for eye region - should be in upper half of face area
            if (y < imageData.height * 0.5 && 
                distFromCenter < faceAreaRadius * 0.6 && 
                distFromCenter > faceAreaRadius * 0.2) {
              
              // Eyes typically have darker pixels
              const brightness = (r + g + b) / 3;
              if (brightness < 120) {
                eyeRegionPixels++;
              }
              eyeRegionTotal++;
            }
          }
        }
      }
      
      // Calculate face detection ratio focused on close-up faces
      const faceRatio = totalSampledPixels > 0 ? facePixels / totalSampledPixels : 0;
      const eyeRatio = eyeRegionTotal > 0 ? eyeRegionPixels / eyeRegionTotal : 0;
      
      // Lower threshold for face detection
      const currentFaceDetected = faceRatio > 0.09;
      
      // Determine if the person is facing the camera based on eye detection
      const currentFacingCamera = eyeRatio > 0.15; // Eyes should occupy significant area
      
      if (currentFaceDetected) {
        consecutiveDetectionsRef.current++;
        consecutiveNonDetectionsRef.current = 0;
        
        // Update facing camera status with hysteresis to avoid flickering
        if (currentFacingCamera) {
          facingCameraConsecutiveRef.current++;
          if (facingCameraConsecutiveRef.current >= 3) {
            setFacingCamera(true);
          }
        } else {
          facingCameraConsecutiveRef.current = Math.max(0, facingCameraConsecutiveRef.current - 1);
          if (facingCameraConsecutiveRef.current === 0) {
            setFacingCamera(false);
          }
        }
        
        if (consecutiveDetectionsRef.current >= 3 && !faceDetected) {
          setFaceDetected(true);
          lastFaceDetectedTime.current = Date.now();
          
          // Dispatch custom event for face detection with facing status
          const event = new CustomEvent('faceDetected', { 
            detail: { detected: true, facingCamera } 
          });
          window.dispatchEvent(event);
        } else if (faceDetected) {
          // Update facing camera status even when face is already detected
          const event = new CustomEvent('faceDetected', { 
            detail: { detected: true, facingCamera } 
          });
          window.dispatchEvent(event);
        }
      } else {
        consecutiveNonDetectionsRef.current++;
        consecutiveDetectionsRef.current = 0;
        facingCameraConsecutiveRef.current = Math.max(0, facingCameraConsecutiveRef.current - 1);
        
        if (facingCameraConsecutiveRef.current === 0) {
          setFacingCamera(false);
        }
        
        // Require more consecutive non-detections before declaring face lost
        if (consecutiveNonDetectionsRef.current >= 5 && faceDetected) {
          setFaceDetected(false);
          
          // Dispatch custom event for face lost
          const event = new CustomEvent('faceDetected', { 
            detail: { detected: false, facingCamera: false } 
          });
          window.dispatchEvent(event);
        }
      }
      
      // Check if user has left the camera frame
      if (faceDetected && lastFaceDetectedTime.current) {
        const elapsed = Date.now() - lastFaceDetectedTime.current;
        if (elapsed > 3000 && consecutiveNonDetectionsRef.current > 8) {
          // Person likely left - reset face detection
          setFaceDetected(false);
          setFacingCamera(false);
          lastFaceDetectedTime.current = null;
          
          // Dispatch custom event for face lost
          const event = new CustomEvent('faceDetected', { 
            detail: { detected: false, facingCamera: false } 
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
            
            // Start face detection with higher frequency for faster responsiveness
            faceDetectionInterval.current = setInterval(() => {
              detectFaces(video, canvas);
            }, 50); // 50ms - frequent sampling for better detection
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
        </div>
      )}
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-900 dark:text-blue-300 bg-white/60 dark:bg-gray-800/60 px-4 py-2 rounded-lg text-lg">
        {!cameraActive 
          ? "Kamera erişimi bekleniyor..." 
          : faceDetected 
            ? facingCamera ? "Yüz algılandı!" : "Lütfen kameraya bakınız" 
            : "Lütfen kameraya bakınız"}
      </div>
      
      {faceDetected && facingCamera && cameraActive && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-4 border-green-500 dark:border-green-400 rounded-full animate-pulse opacity-70"></div>
        </div>
      )}
      
      {cameraActive && (!faceDetected || !facingCamera) && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-dashed border-blue-500 dark:border-blue-400 rounded-full opacity-50"></div>
          <div className="absolute w-24 h-24 border-2 border-yellow-500 dark:border-yellow-400 rounded-full opacity-70"></div>
        </div>
      )}
    </div>
  );
};
