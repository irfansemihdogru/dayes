
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
  
  // Load headtrackr.js script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/headtrackr@1.0.3/headtrackr.min.js';
    script.async = true;
    script.onload = () => {
      setHeadtrackrLoaded(true);
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
    
    // Get camera access
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
        
        // Start headtracking
        const htracker = new window.headtrackr.Tracker({
          calcAngles: true,
          ui: false,
          headPosition: false
        });
        
        htracker.init(video, canvas);
        htracker.start();
        
        // Listen for track events
        document.addEventListener('facetrackingEvent', (event: any) => {
          if (event.detection === 'CS') {
            setFaceDetected(true);
          }
        });
        
        document.addEventListener('headtrackrStatusEvent', (event: any) => {
          if (event.status === 'found') {
            setFaceDetected(true);
          } else if (event.status === 'lost' || event.status === 'redetecting') {
            setFaceDetected(false);
          }
        });
        
        return () => {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
          htracker.stop();
          document.removeEventListener('facetrackingEvent', () => {});
          document.removeEventListener('headtrackrStatusEvent', () => {});
        };
      })
      .catch(err => {
        console.error("Error accessing the camera:", err);
      });
  }, [headtrackrLoaded]);
  
  return (
    <div className="w-full h-full relative">
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover rounded-lg"
        style={{ transform: 'scaleX(-1)' }} // Mirror effect
      />
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full" 
        style={{ display: 'none' }} 
      />
      
      <div className="text-blue-900 text-opacity-70 text-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {faceDetected ? "Yüz algılandı!" : "Kamera Görüntüsü"}
      </div>
      
      {faceDetected && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 border-4 border-green-500 rounded-full animate-pulse opacity-70"></div>
        </div>
      )}
    </div>
  );
};
