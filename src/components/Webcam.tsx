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
  
  const detectFaces = async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    if (!video.videoWidth || !video.videoHeight) return;
    
    try {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const faceAreaRadius = Math.min(canvas.width, canvas.height) * 0.35;
      
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
      
      const samplingStep = 8;
      
      for (let y = 0; y < imageData.height; y += samplingStep) {
        for (let x = 0; x < imageData.width; x += samplingStep) {
          const distFromCenter = Math.sqrt(Math.pow(x - imageData.width/2, 2) + Math.pow(y - imageData.height/2, 2));
          
          if (distFromCenter <= faceAreaRadius * 0.8) {
            const i = (y * imageData.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (r > 60 && g > 40 && b > 20 && r > g && r > b) {
              facePixels++;
            }
            totalSampledPixels++;
            
            if (y < imageData.height * 0.5 && 
                distFromCenter < faceAreaRadius * 0.6 && 
                distFromCenter > faceAreaRadius * 0.2) {
              
              const brightness = (r + g + b) / 3;
              if (brightness < 120) {
                eyeRegionPixels++;
              }
              eyeRegionTotal++;
            }
          }
        }
      }
      
      const faceRatio = totalSampledPixels > 0 ? facePixels / totalSampledPixels : 0;
      const eyeRatio = eyeRegionTotal > 0 ? eyeRegionPixels / eyeRegionTotal : 0;
      
      const currentFaceDetected = faceRatio > 0.08;
      const currentFacingCamera = eyeRatio > 0.12;
      
      if (currentFaceDetected) {
        consecutiveDetectionsRef.current++;
        consecutiveNonDetectionsRef.current = 0;
        
        if (currentFacingCamera) {
          facingCameraConsecutiveRef.current++;
          if (facingCameraConsecutiveRef.current >= 2) {
            setFacingCamera(true);
          }
        } else {
          facingCameraConsecutiveRef.current = Math.max(0, facingCameraConsecutiveRef.current - 1);
          if (facingCameraConsecutiveRef.current === 0) {
            setFacingCamera(false);
          }
        }
        
        if (consecutiveDetectionsRef.current >= 2 && !faceDetected) {
          setFaceDetected(true);
          lastFaceDetectedTime.current = Date.now();
          
          const event = new CustomEvent('faceDetected', { 
            detail: { detected: true, facingCamera } 
          });
          window.dispatchEvent(event);
        } else if (faceDetected) {
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
        
        if (consecutiveNonDetectionsRef.current >= 3 && faceDetected) {
          setFaceDetected(false);
          
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
        
        setCameraActive(true);
        
        const event = new CustomEvent('cameraStatus', { 
          detail: { active: true } 
        });
        window.dispatchEvent(event);
        
        video.onloadedmetadata = () => {
          video.play().then(() => {
            console.log('Video playback started');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            faceDetectionInterval.current = setInterval(() => {
              detectFaces(video, canvas);
            }, 30);
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (faceDetectionInterval.current) {
        clearInterval(faceDetectionInterval.current);
      }
      
      const event = new CustomEvent('cameraStatus', { 
        detail: { active: false } 
      });
      window.dispatchEvent(event);
    };
  }, []);
  
  const handleCameraError = (message: string) => {
    setErrorMessage(message);
    setCameraActive(false);
    
    const event = new CustomEvent('cameraStatus', { 
      detail: { active: false } 
    });
    window.dispatchEvent(event);
  };
  
  useEffect(() => {
    const checkCameraStatus = setInterval(() => {
      if (streamRef.current) {
        const tracks = streamRef.current.getVideoTracks();
        const isActive = tracks.length > 0 && tracks[0].enabled && tracks[0].readyState === 'live';
        
        if (cameraActive !== isActive) {
          setCameraActive(isActive);
          
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
        style={{ transform: 'scaleX(-1)' }} 
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
