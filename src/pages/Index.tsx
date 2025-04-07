import React, { useEffect, useState, useRef } from 'react';
import FaceRecognition from '@/components/FaceRecognition';
import MainMenu from '@/components/MainMenu';
import GradeSelection from '@/components/GradeSelection';
import StaffDirectionResult from '@/components/StaffDirectionResult';
import VoiceRecognition from '@/components/VoiceRecognition';
import StartScreen from '@/components/StartScreen';
import { processVoiceCommand } from '@/utils/geminiApi';
import { useToast } from '@/hooks/use-toast';
import { Volume2Icon, VolumeXIcon, School } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { speakText, initSpeechSynthesis } from '@/utils/speechUtils';

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
  const { toast } = useToast();
  const appInitialized = useRef(false);
  const isSpeakingRef = useRef(false);
  const { theme, isDarkMode } = useTheme();
  const voiceCommandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    initSpeechSynthesis().then(() => {
      console.log('Speech synthesis initialized');
    });
  }, []);
  
  const isSpeaking = () => {
    return window.speechSynthesis && window.speechSynthesis.speaking;
  };
  
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
  
  useEffect(() => {
    if ((appState === 'main-menu' || appState === 'grade-selection') && isListening) {
      if (voiceCommandTimeoutRef.current) {
        clearTimeout(voiceCommandTimeoutRef.current);
      }
      
      voiceCommandTimeoutRef.current = setTimeout(() => {
        console.log('Voice command timeout - reloading page');
        window.location.reload();
      }, 20000);
      
      return () => {
        if (voiceCommandTimeoutRef.current) {
          clearTimeout(voiceCommandTimeoutRef.current);
        }
      };
    }
  }, [appState, isListening, toast]);
  
  const speakWelcomeMessage = () => {
    if (!audioEnabled) {
      setWelcomeMessagePlaying(false);
      return;
    }
    
    const welcomeText = "Yıldırım Mesleki ve Teknik Anadolu Lisesi Veli Yönlendirme Sistemine hoş geldiniz. Lütfen kameraya bakarak yüzünüzün algılanmasını bekleyiniz.";
    
    speakText(welcomeText, {
      onStart: () => {
        isSpeakingRef.current = true;
        setWelcomeMessagePlaying(true);
      },
      onEnd: () => {
        isSpeakingRef.current = false;
        setWelcomeMessagePlaying(false);
      }
    });
  };
  
  const handleFaceDetected = () => {
    if (appState === 'face-recognition') {
      setTimeout(() => {
        setAppState('main-menu');
        
        if (!isSpeaking()) {
          setIsListening(true);
        }
        
        const prompt = 'Yapmak istediğiniz işlemi söyleyiniz';
        setVoicePrompt(prompt);
        
        if (audioEnabled) {
          speakText(prompt, {
            onStart: () => {
              isSpeakingRef.current = true;
            },
            onEnd: () => {
              isSpeakingRef.current = false;
              setIsListening(true);
            }
          });
        }
      }, 1000);
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.location.reload();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  useEffect(() => {
    if (voiceCommandTimeoutRef.current) {
      clearTimeout(voiceCommandTimeoutRef.current);
      voiceCommandTimeoutRef.current = null;
    }
    
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
          if (!isSpeaking()) {
            setTimeout(() => setIsListening(true), 300);
          }
          if (audioEnabled) {
            speakText(prompt, {
              onStart: () => {
                isSpeakingRef.current = true;
                setIsListening(false);
              },
              onEnd: () => {
                isSpeakingRef.current = false;
                setIsListening(true);
              }
            });
          }
          break;
        }
        case 'grade-selection': {
          const prompt = 'Öğrenciniz kaçıncı sınıf?';
          setVoicePrompt(prompt);
          setIsListening(true);
          
          if (audioEnabled) {
            speakText(prompt, {
              onStart: () => {
                isSpeakingRef.current = true;
                setIsListening(false);
              },
              onEnd: () => {
                isSpeakingRef.current = false;
                setIsListening(true);
              }
            });
          }
          break;
        }
        case 'staff-direction':
          setIsListening(false);
          break;
      }
    }, 300);
    
    return () => clearTimeout(transitionDelay);
  }, [appState, audioEnabled]);
  
  const resetApp = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
    
    window.location.reload();
  };
  
  const handleStartApp = () => {
    setAppState('face-recognition');
  };
  
  const toggleAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
    
    setAudioEnabled(!audioEnabled);
    
    if (!audioEnabled) {
      setTimeout(() => {
        speakText('Sesli yönlendirme etkinleştirildi.');
      }, 300);
    }
  };
  
  const handleServiceSelection = (service: string) => {
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
      if (voiceCommandTimeoutRef.current) {
        clearTimeout(voiceCommandTimeoutRef.current);
      }
      
      if (appState === 'main-menu') {
        setIsListening(false);
      }
      
      voiceCommandTimeoutRef.current = setTimeout(() => {
        console.log('Voice command timeout after processing - reloading page');
        window.location.reload();
      }, 20000);
      
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
        }
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      
      if (appState === 'grade-selection' && !isSpeaking()) {
        setTimeout(() => {
          setIsListening(true);
        }, 2000);
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
              
              {(appState === 'main-menu' || appState === 'grade-selection') && isListening && (
                <div className="mt-4 max-w-4xl mx-auto">
                  <VoiceRecognition 
                    isListening={isListening} 
                    onResult={handleVoiceResult}
                    onListeningEnd={() => {
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
