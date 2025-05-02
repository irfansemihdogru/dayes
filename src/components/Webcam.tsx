
import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

// Dynamically import face-api.js to avoid issues
let faceapi: any;

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
  const faceApiLoaded = useRef(false);

  // Load face-api.js dynamically
  useEffect(() => {
    const loadFaceApi = async () => {
      try {
        // Dynamic import of face-api.js
        const faceApiModule = await import('face-api.js');
        faceapi = faceApiModule;
        faceApiLoaded.current = true;
        console.log('Face API library loaded successfully');
        
        // Now that face-api is loaded, we can load models
        loadModels();
      } catch (error) {
        console.error('Failed to load face-api.js:', error);
        setErrorMessage('Yüz tanıma kütüphanesi yüklenemedi. Lütfen sayfayı yenileyin.');
      }
    };
    
    // Ensure TensorFlow backend is ready
    tf.ready().then(() => {
      console.log('TensorFlow backend ready:', tf.getBackend());
      loadFaceApi();
    });
  }, []);

  // Load face-api.js models
  const loadModels = async () => {
    if (!faceApiLoaded.current) {
      console.warn('Face API not yet loaded, skipping model loading');
      return;
    }
    
    try {
      // Set the path to the models
      const MODEL_URL = '/models';

      // Load models sequentially
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);

      console.log('Face detection models loaded successfully');
      modelsLoaded.current = true;
      
      // Now that models are loaded, we can start the camera
      setupCamera();
    } catch (error) {
      console.error('Error loading face detection models:', error);
      setErrorMessage('Yüz tanıma modelleri yüklenemedi. Lütfen sayfayı yenileyin.');
    }
  };

  // Detect faces using face-api.js
  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded.current || !faceApiLoaded.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.paused || video.ended || !video.videoWidth) return;

    try {
      // Configure face detection options
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 416, // Smaller for better performance
        scoreThreshold: 0.5, // Lower threshold for faster detection
      });

      // Detect faces with landmarks
      const detections = await faceapi
        .detectAllFaces(video, options)
        .withFaceLandmarks();

      // Update canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Get canvas context
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Check if a face is detected
      const currentFaceDetected = detections.length > 0;

      if (currentFaceDetected) {
        // Get the first detected face and its landmarks
        const face = detections[0];
        const landmarks = face.landmarks;

        // Get the positions of the eyes
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        // Calculate the vertical difference between the eyes
        const eyeLevelDiff = Math.abs(leftEye[0].y - rightEye[0].y);
        const isFacingCamera = eyeLevelDiff < 10; // Threshold: Eyes should be nearly aligned horizontally

        if (isFacingCamera) {
          consecutiveDetectionsRef.current++;
          consecutiveNonDetectionsRef.current = 0;

          // Only need 2 consecutive detections for faster response
          if (consecutiveDetectionsRef.current >= 2 && !faceDetected) {
            setFaceDetected(true);

            // Dispatch custom event for face detection
            const event = new CustomEvent('faceDetected', {
              detail: { detected: true },
            });
            window.dispatchEvent(event);
          }
        } else {
          consecutiveNonDetectionsRef.current++;
          consecutiveDetectionsRef.current = 0;
        }
      } else {
        consecutiveNonDetectionsRef.current++;
        consecutiveDetectionsRef.current = 0;
      }

      // Require more consecutive non-detections before declaring face lost
      if (consecutiveNonDetectionsRef.current >= 8 && faceDetected) {
        consecutiveDetectionsRef.current = 0;
        setFaceDetected(false);

        // Dispatch custom event for face lost
        const event = new CustomEvent('faceDetected', {
          detail: { detected: false },
        });
        window.dispatchEvent(event);
      }

      // Optionally draw the detected faces and landmarks on the canvas for visual feedback
      if (ctx && currentFaceDetected) {
        faceapi.draw.drawDetections(canvas, detections);
        faceapi.draw.drawFaceLandmarks(canvas, detections);
      }
    } catch (error) {
      console.error('Error during face detection:', error);
      setErrorMessage('Yüz algılama sırasında bir hata oluştu.');
    }
  };

  // Initialize face detection and camera
  const setupCamera = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 }, // Reduced for better performance
          height: { ideal: 480 }, // Reduced for better performance
          facingMode: 'user',
        },
      });

      streamRef.current = stream;
      video.srcObject = stream;

      // Set camera as active
      setCameraActive(true);

      // Emit camera status event
      const event = new CustomEvent('cameraStatus', {
        detail: { active: true },
      });
      window.dispatchEvent(event);

      video.onloadedmetadata = () => {
        video
          .play()
          .then(() => {
            console.log('Video playback started');

            // Start face detection at a reasonable interval (60ms = ~16fps)
            detectionInterval.current = setInterval(() => {
              detectFaces();
            }, 60);
          })
          .catch((err) => {
            console.error('Error playing video:', err);
            handleCameraError('Kamera başlatılamadı');
          });
      };
    } catch (err) {
      console.error('Error accessing the camera:', err);
      handleCameraError('Kamera erişilemez durumda. Lütfen kamera izinlerini kontrol ediniz.');
    }
  };

  const handleCameraError = (message: string) => {
    setErrorMessage(message);
    setCameraActive(false);

    // Emit camera status event
    const event = new CustomEvent('cameraStatus', {
      detail: { active: false },
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
            detail: { active: isActive },
          });
          window.dispatchEvent(event);
        }
      }
    }, 1000);

    return () => clearInterval(checkCameraStatus);
  }, [cameraActive]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      // Clean up
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (detectionInterval.current) {
        clearInterval(detectionInterval.current);
      }

      // Emit camera inactive event
      const event = new CustomEvent('cameraStatus', {
        detail: { active: false },
      });
      window.dispatchEvent(event);
    };
  }, []);

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
        style={{ display: 'none' }} // Hidden for visual feedback, can be shown if needed
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
