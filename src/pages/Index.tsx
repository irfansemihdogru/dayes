
import React, { useEffect, useState, useRef } from 'react';
import FaceRecognition from '@/components/FaceRecognition';
import MainMenu from '@/components/MainMenu';
import GradeSelection from '@/components/GradeSelection';
import StaffDirectionResult from '@/components/StaffDirectionResult';
import VoiceRecognition from '@/components/VoiceRecognition';
import StartScreen from '@/components/StartScreen';
import { processVoiceCommand } from '@/utils/geminiApi';
import { Volume2Icon, VolumeXIcon, School } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { speakText, initSpeechSynthesis, clearSpeechQueue, isCurrentlySpeaking, cancelSpeech } from '@/utils/speechUtils';

type AppState = 
  | 'start-screen'
  | 'face-recognition'
  | 'main-menu'
  | 'grade-selection'
  | 'staff-direction';

interface StaffMapping {
  [key: string]: string;
}

interface StaffRoomInfo {
  name: string;
  floor: number;
  location: string;
  roomNumber: number;
}

const staffInfo: Record<string, StaffRoomInfo> = {
  'YENER HANCI': { name: 'YENER HANCI', floor: 2, location: 'sol', roomNumber: 24 },
  'ERDEM ÜÇER': { name: 'ERDEM ÜÇER', floor: 2, location: 'sağ', roomNumber: 15 },
  'FEHMİ OKŞAK': { name: 'FEHMİ OKŞAK', floor: 3, location: 'sol', roomNumber: 32 },
  'ÖZLEM KOTANOĞLU': { name: 'ÖZLEM KOTANOĞLU', floor: 1, location: 'koridor sonunda', roomNumber: 8 },
  'ASUMAN ÖZŞİMŞEKLER': { name: 'ASUMAN ÖZŞİMŞEKLER', floor: 2, location: 'merdiven karşısı', roomNumber: 22 },
  'OKAN KARAHAN': { name: 'OKAN KARAHAN', floor: 1, location: 'giriş kapısı yanında', roomNumber: 5 },
};

const gradeToStaff: StaffMapping = {
  '9': 'ERDEM ÜÇER',
  '10': 'FEHMİ OKŞAK',
  '11': 'ÖZLEM KOTANOĞLU',
  '12': 'ASUMAN ÖZŞİMŞEKLER',
};

const serviceToStaff: StaffMapping = {
  'mesem': 'YENER HANCI',
  'usta-ogreticilik-belgesi': 'YENER HANCI',
  'diploma': 'YENER HANCI',
  'disiplin': 'OKAN KARAHAN',
  '9-sinif-kayit': 'ERDEM ÜÇER',
};

const Index = () => {
  const [appState, setAppState] = useState<AppState>('start-screen');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [directedStaff, setDirectedStaff] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [welcomeMessagePlaying, setWelcomeMessagePlaying] = useState(false);
  const appInitialized = useRef(false);
  const { theme, isDarkMode } = useTheme();
  const voiceCommandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Initialize speech synthesis when the app starts
    initSpeechSynthesis().then(() => {
      console.log('Speech synthesis initialized');
    });
    
    // Cancel any ongoing speech when the page unloads
    const handleUnload = () => {
      clearSpeechQueue();
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
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
  
  // Clear any active timeouts when app state changes
  useEffect(() => {
    if (voiceCommandTimeoutRef.current) {
      clearTimeout(voiceCommandTimeoutRef.current);
      voiceCommandTimeoutRef.current = null;
    }
    
    // Start a new timeout for main menu and grade selection states
    if ((appState === 'main-menu' || appState === 'grade-selection') && isListening) {
      voiceCommandTimeoutRef.current = setTimeout(() => {
        console.log('Voice command timeout - reloading page');
        resetApp();
      }, 30000); // 30 seconds timeout
    }
    
    return () => {
      if (voiceCommandTimeoutRef.current) {
        clearTimeout(voiceCommandTimeoutRef.current);
      }
    };
  }, [appState, isListening]);
  
  const speakWelcomeMessage = () => {
    if (!audioEnabled) {
      setWelcomeMessagePlaying(false);
      return;
    }
    
    // Cancel any ongoing speech first
    cancelSpeech();
    
    const welcomeText = "Yıldırım Mesleki ve Teknik Anadolu Lisesi Veli Yönlendirme Sistemine hoş geldiniz. Lütfen kameraya bakarak yüzünüzün algılanmasını bekleyiniz.";
    
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
      setTimeout(() => {
        setAppState('main-menu');
        
        if (!isCurrentlySpeaking()) {
          // Don't start listening yet, wait until prompt is spoken
          setIsListening(false);
        }
        
        const prompt = 'Yapmak istediğiniz işlemi söyleyiniz';
        setVoicePrompt(prompt);
        
        if (audioEnabled) {
          // Cancel any ongoing speech first
          cancelSpeech();
          
          speakText(prompt, {
            onEnd: () => {
              // Only start listening after the prompt has been spoken
              setIsListening(true);
            }
          });
        } else {
          // If audio is disabled, just start listening immediately
          setIsListening(true);
        }
      }, 1000);
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetApp();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  useEffect(() => {
    // When app state changes, update voice prompts
    const transitionDelay = setTimeout(() => {
      switch (appState) {
        case 'start-screen':
          setVoicePrompt('');
          setIsListening(false);
          break;
          
        case 'face-recognition':
          setVoicePrompt('');
          setIsListening(false);
          break;
          
        case 'main-menu': {
          const prompt = 'Yapmak istediğiniz işlemi söyleyiniz';
          setVoicePrompt(prompt);
          
          // Cancel any ongoing speech
          cancelSpeech();
          
          if (audioEnabled) {
            speakText(prompt, {
              onEnd: () => {
                // Only start listening after the prompt
                setIsListening(true);
              }
            });
          } else {
            // If audio is disabled, just start listening
            setIsListening(true);
          }
          break;
        }
        
        case 'grade-selection': {
          const prompt = 'Öğrenciniz kaçıncı sınıf?';
          setVoicePrompt(prompt);
          
          // Cancel any ongoing speech
          cancelSpeech();
          
          if (audioEnabled) {
            speakText(prompt, {
              onEnd: () => {
                // Only start listening after the prompt
                setIsListening(true);
              }
            });
          } else {
            // If audio is disabled, just start listening
            setIsListening(true);
          }
          break;
        }
        
        case 'staff-direction':
          // No need for microphone in staff direction state
          setIsListening(false);
          break;
      }
    }, 300);
    
    return () => clearTimeout(transitionDelay);
  }, [appState, audioEnabled]);
  
  const resetApp = () => {
    // Cancel any ongoing speech
    cancelSpeech();
    
    // Cancel any active timeouts
    if (voiceCommandTimeoutRef.current) {
      clearTimeout(voiceCommandTimeoutRef.current);
      voiceCommandTimeoutRef.current = null;
    }
    
    // Clear speech queue
    clearSpeechQueue();
    
    // Reset the app state
    window.location.reload();
  };
  
  const handleStartApp = () => {
    setAppState('face-recognition');
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
  
  const handleServiceSelection = (service: string) => {
    // Turn off microphone when a service is selected
    setIsListening(false);
    
    setSelectedService(service);
    
    if (service === 'disiplin') {
      setDirectedStaff('OKAN KARAHAN');
      setAppState('staff-direction');
      return;
    }
    
    if (serviceToStaff[service]) {
      setDirectedStaff(serviceToStaff[service]);
      setAppState('staff-direction');
      return;
    }
    
    setAppState('grade-selection');
  };
  
  const handleGradeSelection = (grade: number) => {
    // Turn off microphone when a grade is selected
    setIsListening(false);
    
    setSelectedGrade(grade);
    
    const staff = gradeToStaff[grade.toString()];
    if (staff) {
      setDirectedStaff(staff);
      setAppState('staff-direction');
    }
  };
  
  const handleVoiceResult = async (text: string) => {
    try {
      // Reset timeout when a voice command is received
      if (voiceCommandTimeoutRef.current) {
        clearTimeout(voiceCommandTimeoutRef.current);
      }
      
      // Process the voice command
      const result = await processVoiceCommand(text);
      console.log("Gemini API result:", result);
      
      if (appState === 'main-menu') {
        if (result.intent) {
          if (['mesem', 'usta-ogreticilik-belgesi', 'diploma', 'disiplin', 'ogrenci-alma-izni', '9-sinif-kayit'].includes(result.intent)) {
            handleServiceSelection(result.intent);
          }
        }
      } else if (appState === 'grade-selection' && result.grade) {
        const grade = parseInt(result.grade);
        if ([9, 10, 11, 12].includes(grade)) {
          handleGradeSelection(grade);
        } else {
          // If grade is not valid, restart listening
          if (!isCurrentlySpeaking()) {
            setTimeout(() => {
              setIsListening(true);
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      
      // Restart listening for grade selection if there was an error
      if (appState === 'grade-selection' && !isCurrentlySpeaking()) {
        setTimeout(() => {
          setIsListening(true);
        }, 1000);
      }
    }
  };
  
  const getServiceDisplayName = () => {
    const serviceMap: Record<string, string> = {
      'mesem': 'Mesem',
      'usta-ogreticilik-belgesi': 'Usta Öğreticilik Belgesi',
      'diploma': 'Diploma',
      'disiplin': 'Disiplin',
      'ogrenci-alma-izni': 'Öğrenciyi Okuldan Alma İzni',
      '9-sinif-kayit': '9.sınıf Kayıt Yönlendirme',
    };
    
    return serviceMap[selectedService] || selectedService;
  };
  
  const getStaffRoomInfo = (staffName: string): StaffRoomInfo => {
    return staffInfo[staffName] || { 
      name: staffName, 
      floor: 1, 
      location: 'karşıda', 
      roomNumber: 1
    };
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
                <h1 className="text-4xl font-bold text-blue-800 dark:text-blue-300">Yıldırım Mesleki ve Teknik Anadolu Lisesi</h1>
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
                <FaceRecognition 
                  onDetected={handleFaceDetected}
                  isWelcomeMessagePlaying={welcomeMessagePlaying}
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 transition-colors duration-300">
            <div className="w-full max-w-5xl mx-auto">
              <div className="text-center mb-4 flex items-center justify-center">
                <School className="mr-3 text-blue-700 dark:text-blue-400" size={32} />
                <h1 className="text-4xl font-bold text-blue-800 dark:text-blue-300">Yıldırım Mesleki ve Teknik Anadolu Lisesi</h1>
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
              
              <div className="transition-all duration-500 fade-in mx-auto">
                {appState === 'main-menu' && (
                  <MainMenu onSelection={handleServiceSelection} />
                )}
                
                {appState === 'grade-selection' && (
                  <GradeSelection onSelection={handleGradeSelection} />
                )}
                
                {appState === 'staff-direction' && (
                  <StaffDirectionResult 
                    staffName={directedStaff}
                    staffRoomInfo={getStaffRoomInfo(directedStaff)}
                    reason={getServiceDisplayName()}
                    onTimeout={resetApp}
                  />
                )}
              </div>
              
              {(appState === 'main-menu' || appState === 'grade-selection') && (
                <div className="mt-4 max-w-4xl mx-auto">
                  <VoiceRecognition 
                    isListening={isListening} 
                    onResult={handleVoiceResult}
                    onListeningEnd={() => {
                      // Only automatically turn off the microphone in main menu, not in grade selection
                      if (appState === 'main-menu') {
                        setIsListening(false);
                      }
                    }}
                    prompt={voicePrompt}
                  />
                </div>
              )}
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm" role="note">
                ESC tuşuna basarak sistemi sıfırlayabilirsiniz
              </p>
            </div>
          </div>
        );
    }
  };
  
  return renderContent();
};

export default Index;
