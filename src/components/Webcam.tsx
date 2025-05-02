import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

// Create global variable for face-api to avoid issues with dynamic imports
let faceapi: any = null;

export const Webcam: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const modelsLoaded = useRef(false);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const consecutiveDetectionsRef = useRef(0);
  const consecutiveNonDetectionsRef = useRef(0);

  // Load face-api.js dynamically to avoid SSR issues
  useEffect(() => {
    const loadFaceApi = async () => {
      try {
        console.log('Loading face-api.js...');
        // We need to ensure TensorFlow is initialized first
        await tf.ready();
        console.log('TensorFlow backend ready:', tf.getBackend());
        
        // Then dynamically import face-api
        const module = await import('face-api.js');
        faceapi = module;
        console.log('Face API loaded successfully');
        
        // Now load the models
        await loadModels();
      } catch (error) {
        console.error('Failed to load face-api.js:', error);
        setErrorMessage('Yüz tanıma kütüphanesi yüklenemedi. Lütfen sayfayı yenileyin.');
      }
    };

    loadFaceApi();
    
    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }
    };
  }, []);

  // Load face-api.js models
  const loadModels = async () => {
    try {
      if (!faceapi) {
        console.warn('Face API not yet loaded');
        return;
      }
      
      console.log('Loading face detection models...');
      
      // Set path to models
      const MODEL_URL = '/models';

      // Load face detection models sequentially
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      console.log('Tiny face detector model loaded');
      
      // Load face landmarks model
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      console.log('Face landmark model loaded');

      console.log('All models loaded successfully');
      modelsLoaded.current = true;
      
      // Start camera once models are loaded
      await setupCamera();
    } catch (error) {
      console.error('Error loading face detection models:', error);
      setErrorMessage('Yüz tanıma modelleri yüklenemedi: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  // Set up camera
  const setupCamera = async () => {
    if (!videoRef.current) return;

    try {
      console.log('Setting up camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setCameraActive(true);

      // Emit camera status event
      window.dispatchEvent(new CustomEvent('cameraStatus', {
        detail: { active: true },
      }));

      // Start detection when video is ready
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play()
          .then(() => {
            console.log('Video playback started');
            
            // Start face detection at a reasonable interval
            detectionInterval.current = setInterval(() => {
              if (modelsLoaded.current) {
                detectFaces();
              }
            }, 100);  // 10 fps
          })
          .catch((error) => {
            console.error('Error playing video:', error);
            setErrorMessage('Kamera başlatılamadı: ' + error.message);
          });
      };
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrorMessage('Kamera erişilemez durumda. Lütfen kamera izinlerini kontrol ediniz.');
      
      // Emit camera error event
      window.dispatchEvent(new CustomEvent('cameraStatus', {
        detail: { active: false },
      }));
    }
  };

  // Detect faces using face-api.js
  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !faceapi || !modelsLoaded.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.paused || video.ended || !video.videoWidth) return;
    
    try {
      // Configure face detection options
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.5
      });
      
      // Detect all faces with landmarks
      const detections = await faceapi.detectAllFaces(video, options)
        .withFaceLandmarks();
      
      // Resize canvas to match video dimensions
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);
      
      // Get detection results scaled to video size
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      // Clear previous drawings
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Check if a face is detected
      const currentFaceDetected = resizedDetections.length > 0;
      
      // Make the canvas visible for debugging
      canvas.style.display = 'block';
      canvas.style.opacity = '0.6';
      
      if (currentFaceDetected) {
        consecutiveDetectionsRef.current++;
        consecutiveNonDetectionsRef.current = 0;
        
        // Require fewer consecutive detections (2 is more responsive)
        if (consecutiveDetectionsRef.current >= 2) {
          if (!faceDetected) {
            console.log('Face detected!');
            setFaceDetected(true);
            
            // Dispatch face detected event
            window.dispatchEvent(new CustomEvent('faceDetected', {
              detail: { detected: true }
            }));
          }
          
          // Draw face detection results if a face is detected
          if (ctx) {
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          }
        }
      } else {
        consecutiveNonDetectionsRef.current++;
        consecutiveDetectionsRef.current = 0;
        
        // Require more consecutive non-detections before declaring face lost
        if (consecutiveNonDetectionsRef.current >= 5 && faceDetected) {
          console.log('Face lost');
          setFaceDetected(false);
          
          // Dispatch face lost event
          window.dispatchEvent(new CustomEvent('faceDetected', {
            detail: { detected: false }
          }));
        }
      }
    } catch (error) {
      console.error('Error during face detection:', error);
    }
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
        style={{ 
          transform: 'scaleX(-1)', // Mirror to match video
          // Display for debugging but make it semi-transparent
          opacity: '0.6' 
        }}
      />

      {errorMessage && (
        <div className="absolute top-0 left-0 w-full bg-red-500 dark:bg-red-700 text-white p-2 text-center">
          {errorMessage}
        </div>
      )}

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-900 dark:text-blue-300 bg-white/60 dark:bg-gray-800/60 px-4 py-2 rounded-lg text-lg">
        {!cameraActive
          ? 'Kamera erişimi bekleniyor...'
          : faceDetected
            ? 'Yüz algılandı!'
            : 'Yüzünüzü kameraya gösteriniz'}
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

export default Webcam;
