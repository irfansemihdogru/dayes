
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleFaceDetection from '@/components/SimpleFaceDetection';
import { Volume2Icon, VolumeXIcon, School } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import StartScreen from '@/components/StartScreen';
import { speakText, initSpeechSynthesis, clearSpeechQueue, cancelSpeech } from '@/utils/speechUtils';
import { forceStopMicrophone } from '@/utils/microphoneAccessControl';

type AppState = 'start-screen' | 'face-recognition';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('start-screen');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [welcomeMessagePlaying, setWelcomeMessagePlaying] = useState(false);
  
  const navigate = useNavigate();
  const appInitialized = useRef(false);
  const { isDarkMode } = useTheme();
  
  // Ensure microphone is stopped when this page loads
  useEffect(() => {
    forceStopMicrophone();
    
    // Initialize speech synthesis
    initSpeechSynthesis().then(() => {
      console.log('Speech synthesis initialized');
    });
    
    // Add keyboard shortcut for ESC key to reset app
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.location.reload();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearSpeechQueue();
    };
  }, []);
  
  useEffect(() => {
    if (!appInitialized.current && appState === 'face-recognition') {
      appInitialized.current = true;
      setTimeout(() => {
        if (audioEnabled) {
          setWelcomeMessagePlaying(true);
          speakWelcomeMessage();
        }
      }, 1000);
    }
  }, [appState, audioEnabled]);
  
  const speakWelcomeMessage = () => {
    if (!audioEnabled) {
      setWelcomeMessagePlaying(false);
      return;
    }
    
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
    if (appState === 'face-recognition') {
      console.log('Face detection successful, proceeding to main menu');
      
      cancelSpeech();
      
      setTimeout(() => {
        navigate('/main');
      }, 1000);
    }
  };
  
  const handleStartApp = () => {
    setAppState('face-recognition');
  };
  
  const toggleAudio = () => {
    cancelSpeech();
    setAudioEnabled(!audioEnabled);
    
    if (!audioEnabled) {
      setTimeout(() => {
        speakText('Sesli yönlendirme etkinleştirildi.');
      }, 300);
    }
  };
  
  const renderContent = () => {
    switch (appState) {
      case 'start-screen':
        return <StartScreen 
          onStart={handleStartApp} 
          audioEnabled={audioEnabled} 
          toggleAudio={toggleAudio} 
        />;
      
      case 'face-recognition':
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
      
      default:
        return null;
    }
  };
  
  return renderContent();
};

export default Index;
