
import React, { useRef, useEffect, useState } from 'react';

export const Webcam: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isLookingAtCamera, setIsLookingAtCamera] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const faceDetectionInterval = useRef<NodeJS.Timeout | null>(null);
  const lastFaceDetectedTime = useRef<number | null>(null);
  const consecutiveDetectionsRef = useRef(0);
  const consecutiveNonDetectionsRef = useRef(0);
  const faceEngagementTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Enhanced face detection using image processing with focus on eye area
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
      let eyeAreaPresent = false;
      
      // Focus more on the upper part of the detected face area (where eyes would be)
      for (let y = 0; y < imageData.height; y += 4) {
        // Give more weight to the upper third of the face area (eye level)
        const isEyeLevel = y > imageData.height * 0.2 && y < imageData.height * 0.45;
        
        for (let x = 0; x < imageData.width; x += 4) {
          // Calculate distance from center of the sampled area
          const distFromCenter = Math.sqrt(Math.pow(x - imageData.width/2, 2) + Math.pow(y - imageData.height/2, 2));
          
          // Give more weight to pixels closer to center
          if (distFromCenter <= faceAreaRadius * 0.8) { // Focus more on the very center
            const i = (y * imageData.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Skin tone detection
            if (r > 60 && g > 40 && b > 20 && r > g) {
              facePixels++;
              
              // Enhanced eye detection: Check for contrast patterns common in the eye area
              if (isEyeLevel) {
                // Look at surrounding pixels for contrast changes that indicate eyes
                const surroundingPixels = [
                  {x: x-4, y}, {x: x+4, y}, {x, y: y-4}, {x, y: y+4}
                ].filter(pos => 
                  pos.x >= 0 && pos.x < imageData.width && 
                  pos.y >= 0 && pos.y < imageData.height
                );
                
                let contrastFound = false;
                for (const pos of surroundingPixels) {
                  const idx = (pos.y * imageData.width + pos.x) * 4;
                  // Check if there's significant contrast difference - common in eye areas
                  if (Math.abs(r - data[idx]) > 30 || Math.abs(g - data[idx+1]) > 30) {
                    contrastFound = true;
                    break;
                  }
                }
                
                if (contrastFound) {
                  eyeAreaPresent = true;
                }
              }
            }
            totalSampledPixels++;
          }
        }
      }
      
      // Calculate face detection ratio focused on close-up faces
      const faceRatio = totalSampledPixels > 0 ? facePixels / totalSampledPixels : 0;
      
      // Detect if a face is present
      const currentFaceDetected = faceRatio > 0.08;
      
      // Detect if the person is looking at the camera based on face and eye detection
      const currentlyLookingAtCamera = currentFaceDetected && eyeAreaPresent;
      
      // Face detection with consecutive checks for stability
      if (currentFaceDetected) {
        consecutiveDetectionsRef.current++;
        consecutiveNonDetectionsRef.current = 0;
        
        if (consecutiveDetectionsRef.current >= 2 && !faceDetected) {
          setFaceDetected(true);
          lastFaceDetectedTime.current = Date.now();
          
          // Dispatch custom event for face detection
          const event = new CustomEvent('faceDetected', { 
            detail: { detected: true } 
          });
          window.dispatchEvent(event);
        }
        
        // Check if person is looking at the camera
        if (currentlyLookingAtCamera) {
          // If they're looking at the camera, update state and fire event
          if (!isLookingAtCamera) {
            // Only trigger looking event after consistently seeing the person looking
            if (faceEngagementTimerRef.current) {
              clearTimeout(faceEngagementTimerRef.current);
            }
            
            faceEngagementTimerRef.current = setTimeout(() => {
              setIsLookingAtCamera(true);
              const engagementEvent = new CustomEvent('userEngagement', {
                detail: { engaged: true }
              });
              window.dispatchEvent(engagementEvent);
            }, 500); // Half second of consistent eye contact before triggering
          }
        } else {
          // If they're not looking despite face being detected
          if (isLookingAtCamera) {
            if (faceEngagementTimerRef.current) {
              clearTimeout(faceEngagementTimerRef.current);
            }
            
            faceEngagementTimerRef.current = setTimeout(() => {
              setIsLookingAtCamera(false);
              const engagementEvent = new CustomEvent('userEngagement', {
                detail: { engaged: false }
              });
              window.dispatchEvent(engagementEvent);
            }, 800); // Give a slightly longer buffer before deciding they're not looking
          }
        }
      } else {
        consecutiveNonDetectionsRef.current++;
        consecutiveDetectionsRef.current = 0;
        
        // Clear engagement timer if we no longer detect a face
        if (faceEngagementTimerRef.current) {
          clearTimeout(faceEngagementTimerRef.current);
          faceEngagementTimerRef.current = null;
        }
        
        // If we don't see a face for several frames, update states
        if (consecutiveNonDetectionsRef.current >= 5) {
          if (faceDetected) {
            setFaceDetected(false);
            
            // Dispatch custom event for face lost
            const event = new CustomEvent('faceDetected', { 
              detail: { detected: false } 
            });
            window.dispatchEvent(event);
          }
          
          if (isLookingAtCamera) {
            setIsLookingAtCamera(false);
            const engagementEvent = new CustomEvent('userEngagement', {
              detail: { engaged: false }
            });
            window.dispatchEvent(engagementEvent);
          }
        }
      }
      
      // Check if user has left the camera frame
      if (faceDetected && lastFaceDetectedTime.current) {
        const elapsed = Date.now() - lastFaceDetectedTime.current;
        if (elapsed > 3000 && consecutiveNonDetectionsRef.current > 8) {
          // Person likely left - reset face detection
          setFaceDetected(false);
          setIsLookingAtCamera(false);
          lastFaceDetectedTime.current = null;
          
          // Dispatch custom event for face lost
          const event = new CustomEvent('faceDetected', { 
            detail: { detected: false } 
          });
          window.dispatchEvent(event);
          
          const engagementEvent = new CustomEvent('userEngagement', {
            detail: { engaged: false }
          });
          window.dispatchEvent(engagementEvent);
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
            }, 50); // 50ms - higher sampling rate for better detection
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
      
      if (faceEngagementTimerRef.current) {
        clearTimeout(faceEngagementTimerRef.current);
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
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-900 dark:text-blue-300 bg-white/70 dark:bg-gray-800/70 px-4 py-2 rounded-lg text-lg font-medium backdrop-blur-sm">
        {!cameraActive 
          ? "Kamera erişimi bekleniyor..." 
          : faceDetected 
            ? isLookingAtCamera
               ? "Ekrana bakıyorsunuz!" 
               : "Lütfen doğrudan ekrana bakınız"
            : "Lütfen yüzünüzü kameraya gösteriniz"}
      </div>
      
      {faceDetected && isLookingAtCamera && cameraActive && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-4 border-green-500 dark:border-green-400 rounded-full animate-pulse opacity-70"></div>
        </div>
      )}
      
      {faceDetected && !isLookingAtCamera && cameraActive && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-4 border-yellow-500 dark:border-yellow-400 rounded-full animate-pulse opacity-70"></div>
        </div>
      )}
      
      {cameraActive && !faceDetected && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-2 border-dashed border-blue-500 dark:border-blue-400 rounded-full opacity-50"></div>
          <div className="absolute w-24 h-24 border-2 border-blue-500 dark:border-blue-400 rounded-full opacity-70"></div>
        </div>
      )}
    </div>
  );
};
