
import React, { useRef, useEffect, useState } from 'react';

declare global {
  interface Window {
    headtrackr: any;
  }
}

export const Webcam: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [headtrackrLoaded, setHeadtrackrLoaded] = useState(false);
  const [headtracker, setHeadtracker] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Load headtrackr.js script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/headtrackr@1.0.3/headtrackr.min.js';
    script.async = true;
    script.onload = () => {
      setHeadtrackrLoaded(true);
      console.log('Headtrackr script loaded successfully');
    };
    script.onerror = () => {
      setErrorMessage('Headtrackr script yüklenemedi.');
      console.error('Failed to load headtrackr script');
    };
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  // Initialize headtrackr once the script is loaded
  useEffect(() => {
    if (!headtrackrLoaded || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
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
    
    let htracker: any = null;
    
    // Get camera access
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user"
      } 
    })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
      
      // Configure canvas size to match video
      setTimeout(() => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }, 500);
      
      // Start headtracking
      try {
        htracker = new window.headtrackr.Tracker({
          calcAngles: true,
          ui: false,
          headPosition: false,
          debug: false,
          detectionInterval: 100  // Check for face every 100ms
        });
        
        setHeadtracker(htracker);
        
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
      } catch (error) {
        console.error('Error initializing headtracker:', error);
        setErrorMessage('Yüz takibi başlatılamadı.');
      }
    })
    .catch(err => {
      console.error("Error accessing the camera:", err);
      setErrorMessage('Kamera erişimi sağlanamadı. Lütfen kamera izinlerini kontrol ediniz.');
    });
    
    return () => {
      if (htracker) {
        htracker.stop();
      }
      
      if (video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      
      document.removeEventListener('facetrackingEvent', () => {});
      document.removeEventListener('headtrackrStatusEvent', () => {});
    };
  }, [headtrackrLoaded]);
  
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
