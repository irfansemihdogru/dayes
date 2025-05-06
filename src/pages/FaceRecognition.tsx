
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2Icon, VolumeXIcon } from 'lucide-react';
import SimpleFaceDetection from '@/components/SimpleFaceDetection';
import { speakText, isCurrentlySpeaking, cancelSpeech } from '@/utils/speechUtils';
import { useTheme } from '@/context/ThemeContext';

const FaceRecognition: React.FC = () => {
  const navigate = useNavigate();
  const [welcomeMessagePlaying, setWelcomeMessagePlaying] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const { isDarkMode } = useTheme();
  
  useEffect(() => {
    setTimeout(() => {
      if (audioEnabled) {
        setWelcomeMessagePlaying(true);
        speakWelcomeMessage();
      }
    }, 1000);
    
    return () => {
      cancelSpeech();
    };
  }, [audioEnabled]);
  
  const speakWelcomeMessage = () => {
    if (!audioEnabled) {
      setWelcomeMessagePlaying(false);
      return;
    }
    
    // Cancel any ongoing speech first
    cancelSpeech();
    
    const welcomeText = "Yıldırım Ticaret Meslek ve Teknik Anadolu Lisesi Veli Yönlendirme Sistemine hoş geldiniz. Lütfen kameraya bakarak yüzünüzün algılanmasını bekleyiniz.";
    
    speakText(welcomeText, {
      onStart: () => {
        setWelcomeMessagePlaying(true);
      },
      onEnd: () => {
        setWelcomeMessagePlaying(false);
      }
    });
  };
  
  const handleFaceDetected = () => {
    // First cancel any ongoing speech and ensure not listening
    cancelSpeech();
    
    setTimeout(() => {
      navigate('/main-menu');
    }, 1000);
  };
  
  const toggleAudio = () => {
    // Cancel any ongoing speech when toggling audio
    cancelSpeech();
    
    setAudioEnabled(!audioEnabled);
    
    if (!audioEnabled) {
      setTimeout(() => {
        speakText('Sesli yönlendirme etkinleştirildi.');
      }, 300);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 transition-colors duration-300">
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-4 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-blue-800 dark:text-blue-300">Yıldırım Ticaret Meslek ve Teknik Anadolu Lisesi</h1>
          <button
            onClick={toggleAudio}
            className="ml-3 p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={audioEnabled ? "Sesli yönlendirmeyi kapat" : "Sesli yönlendirmeyi aç"}
          >
            {audioEnabled ? 
              <Volume2Icon size={20} className="text-blue-700 dark:text-blue-400" /> :
              <VolumeXIcon size={20} className="text-gray-500 dark:text-gray-400" />
            }
          </button>
        </div>
        
        <div className="transition-all duration-500 fade-in mx-auto max-w-4xl">
          <SimpleFaceDetection 
            onDetected={handleFaceDetected}
            isWelcomeMessagePlaying={welcomeMessagePlaying}
          />
        </div>
      </div>
    </div>
  );
};

export default FaceRecognition;
