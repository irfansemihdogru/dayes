
import React, { useRef, useEffect, useState } from 'react';

export const Webcam: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [trackingStarted, setTrackingStarted] = useState(false);
  
  // Load headtrackr.js directly from a more reliable CDN
  useEffect(() => {
    const loadScript = () => {
      try {
        // Remove any existing script to avoid conflicts
        const existingScript = document.getElementById('headtrackr-script');
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
        
        const script = document.createElement('script');
        script.id = 'headtrackr-script';
        script.src = 'https://unpkg.com/headtrackr@1.0.3/dist/headtrackr.js';
        script.async = true;
        
        script.onload = () => {
          console.log('Headtrackr script loaded successfully');
          setScriptLoaded(true);
        };
        
        script.onerror = (e) => {
          console.error('Failed to load headtrackr script', e);
          setErrorMessage('Headtrackr yüklenemedi. Yüz tanıma manuel olarak atlanacak.');
          
          // Fallback: simulate face detection after a timeout
          setTimeout(() => {
            handleFaceDetection(true);
          }, 5000);
        };
        
        document.body.appendChild(script);
      } catch (error) {
        console.error('Error during script loading:', error);
        setErrorMessage('Script yükleme hatası');
      }
    };
    
    loadScript();
    
    return () => {
      const script = document.getElementById('headtrackr-script');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);
  
  const handleFaceDetection = (detected: boolean) => {
    setFaceDetected(detected);
    // Dispatch a custom event that can be listened to elsewhere
    const event = new CustomEvent('faceDetected', { 
      detail: { detected } 
    });
    window.dispatchEvent(event);
    
    if (detected) {
      console.log('Face detected!');
    }
  };
  
  // Initialize camera
  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user"
      } 
    })
    .then((stream) => {
      video.srcObject = stream;
      video.play()
        .then(() => {
          console.log('Video playback started');
          
          // Configure canvas size to match video
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
        })
        .catch(err => {
          console.error("Error playing video:", err);
          setErrorMessage('Video oynatma hatası');
        });
    })
    .catch(err => {
      console.error("Error accessing the camera:", err);
      setErrorMessage('Kamera erişimi sağlanamadı. Lütfen kamera izinlerini kontrol ediniz.');
    });
    
    return () => {
      if (video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  
  // Initialize headtracking once the script is loaded
  useEffect(() => {
    if (!scriptLoaded || trackingStarted || !videoRef.current || !canvasRef.current) return;
    
    try {
      // Check if headtrackr is available globally
      if (typeof window.headtrackr !== 'undefined') {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        console.log('Starting headtracking');
        
        const htracker = new window.headtrackr.Tracker({
          calcAngles: true,
          ui: false,
          headPosition: false,
          debug: false,
          detectionInterval: 100  // Check for face every 100ms
        });
        
        setTrackingStarted(true);
        
        htracker.init(video, canvas);
        htracker.start();
        
        // Listen for track events
        document.addEventListener('facetrackingEvent', (event: any) => {
          console.log('Face tracking event:', event);
          if (event.detection === 'CS') {
            handleFaceDetection(true);
          }
        });
        
        document.addEventListener('headtrackrStatusEvent', (event: any) => {
          console.log('Headtrackr status event:', event.status);
          if (event.status === 'found') {
            handleFaceDetection(true);
          } else if (event.status === 'lost' || event.status === 'redetecting') {
            handleFaceDetection(false);
          }
        });
        
        return () => {
          htracker.stop();
          document.removeEventListener('facetrackingEvent', () => {});
          document.removeEventListener('headtrackrStatusEvent', () => {});
        };
      } else {
        console.error('Headtrackr not available after script load');
        setErrorMessage('Headtrackr yüklenemedi. Yüz tanıma manuel olarak atlanacak.');
        
        // Fallback: simulate face detection after a timeout
        setTimeout(() => {
          handleFaceDetection(true);
        }, 5000);
      }
    } catch (error) {
      console.error('Error initializing headtracker:', error);
      setErrorMessage('Yüz takibi başlatılamadı.');
      
      // Fallback: simulate face detection after a timeout
      setTimeout(() => {
        handleFaceDetection(true);
      }, 5000);
    }
  }, [scriptLoaded, trackingStarted]);
  
  // Provide a manual way to bypass face detection if needed
  const handleManualDetection = () => {
    handleFaceDetection(true);
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
          >
            Devam Et
          </button>
        </div>
      )}
      
      <div className="text-blue-900 text-opacity-70 text-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {faceDetected ? "Yüz algılandı!" : "Yüzünüzü kameraya gösteriniz"}
      </div>
      
      {faceDetected && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-4 border-green-500 rounded-full animate-pulse opacity-70"></div>
        </div>
      )}
    </div>
  );
};

// Add the headtrackr type definition to the global window object
declare global {
  interface Window {
    headtrackr: any;
  }
}
