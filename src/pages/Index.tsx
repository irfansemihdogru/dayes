import React, { useEffect, useState, useRef } from 'react';
import SimpleFaceDetection from '@/components/SimpleFaceDetection';
import MainMenu from '@/components/MainMenu';
import GradeSelection from '@/components/GradeSelection';
import StaffDirectionResult from '@/components/StaffDirectionResult';
import VoiceRecognition from '@/components/VoiceRecognition';
import StartScreen from '@/components/StartScreen';
import DevamsizlikForm from '@/components/DevamsizlikForm';
import DevamsizlikTable from '@/components/DevamsizlikTable';
import RegistrationContract from '@/components/RegistrationContract';
import RegistrationForm from '@/components/RegistrationForm';
import { processVoiceCommand } from '@/utils/geminiApi';
import { Volume2Icon, VolumeXIcon, School } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { speakText, initSpeechSynthesis, clearSpeechQueue, isCurrentlySpeaking, cancelSpeech } from '@/utils/speechUtils';

type AppState = 
  | 'start-screen'
  | 'face-recognition'
  | 'main-menu'
  | 'grade-selection'
  | 'staff-direction'
  | 'devamsizlik-form'
  | 'devamsizlik-table'
  | 'registration-contract'
  | 'registration-form';

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
  'ogrenci-alma-izni': 'OKAN KARAHAN',
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
  // Devamsızlık and Registration form states
  const [studentName, setStudentName] = useState('');
  const [studentSurname, setStudentSurname] = useState('');
  
  const [contractReadingActive, setContractReadingActive] = useState(false);
  const [lastAppState, setLastAppState] = useState<AppState | null>(null);
  const [stateTransitioning, setStateTransitioning] = useState(false);
  
  const appInitialized = useRef(false);
  const { theme, isDarkMode } = useTheme();
  const voiceCommandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stateTransitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Enhanced state transition management with cooldown to prevent accidental transitions
  const safeSetAppState = (newState: AppState) => {
    if (stateTransitioning) {
      console.log("State transition already in progress, ignoring", newState);
      return;
    }
    
    // Set transitioning flag to prevent multiple rapid transitions
    setStateTransitioning(true);
    
    // Cancel any ongoing speech and clear timeouts
    cancelSpeech();
    if (voiceCommandTimeoutRef.current) {
      clearTimeout(voiceCommandTimeoutRef.current);
      voiceCommandTimeoutRef.current = null;
    }
    
    // Store the current state before changing
    setLastAppState(appState);
    
    // Set the new state
    setAppState(newState);
    
    // Clear transition lock after a short delay
    stateTransitionTimeoutRef.current = setTimeout(() => {
      setStateTransitioning(false);
    }, 1500);  // 1.5 seconds cooldown between state transitions
  };
  
  // This effect handles state transitions and prevents overlapping voice commands
  useEffect(() => {
    // When transitioning between states, always cancel any ongoing speech
    // and stop listening to prevent command overlap
    if (appState !== lastAppState) {
      cancelSpeech();
      setIsListening(false);
      
      // Add a delay before initializing voice for the new state
      // to ensure any previous speech/recognition is fully stopped
      setTimeout(() => {
        initializeStateVoice(appState);
      }, 800); // Longer delay for more reliable state transition
    }
    
    // Cleanup on unmount
    return () => {
      if (stateTransitionTimeoutRef.current) {
        clearTimeout(stateTransitionTimeoutRef.current);
      }
    };
  }, [appState, lastAppState]);
  
  // New function to initialize voice interactions for each state
  const initializeStateVoice = (state: AppState) => {
    // Don't enable listening if contract reading is active or we're transitioning
    if (contractReadingActive || stateTransitioning) {
      return;
    }
    
    switch (state) {
      case 'start-screen':
      case 'face-recognition':
      case 'staff-direction':
      case 'devamsizlik-form': // No microphone here, handled by component
      case 'devamsizlik-table':
      case 'registration-contract':
      case 'registration-form':
        // No need for microphone in these states
        setIsListening(false);
        setVoicePrompt('');
        break;
        
      case 'main-menu': {
        const prompt = 'Yapmak istediğiniz işlemi söyleyiniz';
        setVoicePrompt(prompt);
        
        if (audioEnabled) {
          speakText(prompt, {
            rate: 0.7, // Slower for better comprehension
            onEnd: () => {
              // Check if state is still main-menu before activating microphone
              if (appState === 'main-menu' && !contractReadingActive && !stateTransitioning) {
                setTimeout(() => setIsListening(true), 300);
              }
            }
          });
        } else {
          // Wait a moment before activating microphone
          setTimeout(() => {
            if (appState === 'main-menu' && !contractReadingActive && !stateTransitioning) {
              setIsListening(true);
            }
          }, 300);
        }
        break;
      }
      
      case 'grade-selection': {
        const prompt = 'Öğrenciniz kaçıncı sınıf?';
        setVoicePrompt(prompt);
        
        if (audioEnabled) {
          speakText(prompt, {
            rate: 0.7, // Slower for better comprehension
            onEnd: () => {
              // Check if state is still grade-selection before activating microphone
              if (appState === 'grade-selection' && !contractReadingActive && !stateTransitioning) {
                setTimeout(() => setIsListening(true), 300);
              }
            }
          });
        } else {
          // Wait a moment before activating microphone
          setTimeout(() => {
            if (appState === 'grade-selection' && !contractReadingActive && !stateTransitioning) {
              setIsListening(true);
            }
          }, 300);
        }
        break;
      }
    }
  };
  
  // Modified effect for contract reading listener
  useEffect(() => {
    // Listen for contract reading status
    const handleContractReading = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.isReading !== undefined) {
        setContractReadingActive(customEvent.detail.isReading);
        
        // If contract is being read, ensure listening is disabled
        if (customEvent.detail.isReading) {
          setIsListening(false);
          
          // Cancel any ongoing speech that might conflict
          cancelSpeech();
          
          // Cancel any active timeouts
          if (voiceCommandTimeoutRef.current) {
            clearTimeout(voiceCommandTimeoutRef.current);
            voiceCommandTimeoutRef.current = null;
          }
        } else {
          // Contract reading has finished, re-initialize voice for current state after a delay
          setTimeout(() => {
            initializeStateVoice(appState);
          }, 1000);
        }
      }
    };
    
    window.addEventListener('contractReading', handleContractReading);
    
    // Cancel any ongoing speech when the page unloads
    const handleUnload = () => {
      clearSpeechQueue();
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('contractReading', handleContractReading);
      clearSpeechQueue();
    };
  }, [appState]);
  
  useEffect(() => {
    // Initialize speech synthesis when the app starts
    initSpeechSynthesis().then(() => {
      console.log('Speech synthesis initialized');
    });
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
    
    // Cancel any ongoing speech first
    cancelSpeech();
    
    const welcomeText = "Yıldırım Ticaret Meslek ve Teknik Anadolu Lisesi Veli Yönlendirme Sistemine hoş geldiniz. Lütfen kameraya bakarak yüzünüzün algılanmasını bekleyiniz.";
    
    speakText(welcomeText, {
      rate: 0.7, // Slower for better comprehension
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
      // Successfully detected face, proceed to main menu
      console.log('Face detection successful, proceeding to main menu');
      
      // First cancel any ongoing speech and ensure not listening
      cancelSpeech();
      setIsListening(false);
      
      // Add a visual transition delay before switching states
      setTimeout(() => {
        // Ensure we're still in face-recognition state before transitioning
        if (appState === 'face-recognition') {
          console.log('Transitioning to main menu');
          safeSetAppState('main-menu');
          
          // Announce successful face detection and menu options after transition
          setTimeout(() => {
            if (audioEnabled) {
              speakText('Yüzünüz başarıyla tanındı. İşlem menüsü açılıyor.', {
                rate: 0.7,
                // The MainMenu component will handle its own voice prompts
              });
            }
          }, 500);
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
  
  
  const resetApp = () => {
    // Cancel any ongoing speech
    cancelSpeech();
    
    // Cancel any active timeouts
    if (voiceCommandTimeoutRef.current) {
      clearTimeout(voiceCommandTimeoutRef.current);
      voiceCommandTimeoutRef.current = null;
    }
    
    if (stateTransitionTimeoutRef.current) {
      clearTimeout(stateTransitionTimeoutRef.current);
      stateTransitionTimeoutRef.current = null;
    }
    
    // Clear speech queue
    clearSpeechQueue();
    
    // Reset the app state
    window.location.reload();
  };
  
  const handleStartApp = () => {
    safeSetAppState('face-recognition');
  };
  
  const toggleAudio = () => {
    // Cancel any ongoing speech when toggling audio
    cancelSpeech();
    
    setAudioEnabled(!audioEnabled);
    
    if (!audioEnabled) {
      setTimeout(() => {
        speakText('Sesli yönlendirmeyi etkinleştirildi.', {
          rate: 0.7 // Slower for better comprehension
        });
      }, 300);
    }
  };
  
  const handleServiceSelection = (service: string) => {
    // Turn off microphone when a service is selected
    setIsListening(false);
    cancelSpeech(); // Cancel any ongoing speech
    
    setSelectedService(service);
    
    if (service === 'devamsizlik') {
      safeSetAppState('devamsizlik-form');
      return;
    }
    
    if (service === '9-sinif-kayit') {
      safeSetAppState('registration-contract');
      return;
    }
    
    if (service === 'disiplin') {
      setDirectedStaff('OKAN KARAHAN');
      safeSetAppState('staff-direction');
      return;
    }
    
    if (service === 'diploma') {
      setDirectedStaff('YENER HANCI');
      safeSetAppState('staff-direction');
      return;
    }
    
    if (service === 'ogrenci-alma-izni') {
      setDirectedStaff('OKAN KARAHAN');
      safeSetAppState('staff-direction');
      return;
    }
    
    if (serviceToStaff[service]) {
      setDirectedStaff(serviceToStaff[service]);
      safeSetAppState('staff-direction');
      return;
    }
    
    safeSetAppState('grade-selection');
  };
  
  const handleGradeSelection = (grade: number) => {
    // Turn off microphone when a grade is selected
    setIsListening(false);
    cancelSpeech(); // Cancel any ongoing speech
    
    setSelectedGrade(grade);
    
    const staff = gradeToStaff[grade.toString()];
    if (staff) {
      setDirectedStaff(staff);
      safeSetAppState('staff-direction');
    }
  };
  
  const handleDevamsizlikFormSubmit = (name: string, surname: string) => {
    // Make sure any speech is cancelled to prevent overlap
    cancelSpeech();
    setStudentName(name);
    setStudentSurname(surname);
    safeSetAppState('devamsizlik-table');
  };
  
  const handleDevamsizlikTimeout = () => {
    safeSetAppState('main-menu');
  };
  
  const handleContractComplete = () => {
    safeSetAppState('registration-form');
  };
  
  const handleRegistrationFormSubmit = () => {
    // Reset to main menu after registration
    safeSetAppState('main-menu');
  };
  
  const handleVoiceResult = async (text: string) => {
    // Ignore voice commands if contract is being read or during state transition
    if (contractReadingActive || stateTransitioning) {
      console.log("Contract reading active or state transitioning, ignoring voice command");
      return;
    }
    
    try {
      // Reset timeout when a voice command is received
      if (voiceCommandTimeoutRef.current) {
        clearTimeout(voiceCommandTimeoutRef.current);
      }
      
      // Temporarily disable listening while processing command
      setIsListening(false);
      
      // Process the voice command
      const result = await processVoiceCommand(text);
      console.log("Gemini API result:", result);
      
      if (appState === 'main-menu') {
        if (result.intent) {
          // Valid intent found, stop listening and handle selection
          if (['mesem', 'usta-ogreticilik-belgesi', 'diploma', 'disiplin', 'ogrenci-alma-izni', '9-sinif-kayit', 'devamsizlik'].includes(result.intent)) {
            handleServiceSelection(result.intent);
            return; // Exit early to prevent re-enabling listening
          }
        }
        
        // If we get here, no valid intent was found
        if (audioEnabled) {
          speakText("Lütfen geçerli bir işlem belirtin", {
            rate: 0.7, // Slower for better comprehension
            onEnd: () => {
              if (appState === 'main-menu' && !stateTransitioning) {
                setTimeout(() => setIsListening(true), 300);
              }
            }
          });
        } else {
          // Re-enable listening after a short delay if still in the same state
          setTimeout(() => {
            if (appState === 'main-menu' && !stateTransitioning) {
              setIsListening(true);
            }
          }, 500);
        }
      } else if (appState === 'grade-selection' && result.grade) {
        const grade = parseInt(result.grade);
        if ([9, 10, 11, 12].includes(grade)) {
          handleGradeSelection(grade);
          return; // Exit early to prevent re-enabling listening
        } else {
          // If grade is not valid, provide feedback and resume listening
          if (audioEnabled) {
            speakText("Lütfen geçerli bir sınıf belirtin", {
              rate: 0.7, // Slower for better comprehension
              onEnd: () => {
                if (appState === 'grade-selection' && !stateTransitioning) {
                  setTimeout(() => setIsListening(true), 300);
                }
              }
            });
          } else {
            // Re-enable listening after a short delay if still in the same state
            setTimeout(() => {
              if (appState === 'grade-selection' && !stateTransitioning) {
                setIsListening(true);
              }
            }, 500);
          }
        }
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      
      // Re-enable listening after error if still in appropriate state
      setTimeout(() => {
        if ((appState === 'main-menu' || appState === 'grade-selection') && 
            !isCurrentlySpeaking() && 
            !contractReadingActive &&
            !stateTransitioning) {
          setIsListening(true);
        }
      }, 1000);
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
      'devamsizlik': 'Devamsızlık Bilgileri',
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
        return (
          <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950 dark:to-gray-900 transition-colors duration-300">
            <div className="w-full max-w-5xl mx-auto">
              <div className="text-center mb-4 flex items-center justify-center">
                <School className="mr-3 text-blue-700 dark:text-blue-400" size={32} />
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
                
                {appState === 'devamsizlik-form' && (
                  <DevamsizlikForm onSubmit={handleDevamsizlikFormSubmit} />
                )}
                
                {appState === 'devamsizlik-table' && (
                  <DevamsizlikTable 
                    name={studentName} 
                    surname={studentSurname} 
                    onTimeout={handleDevamsizlikTimeout} 
                  />
                )}
                
                {appState === 'registration-contract' && (
                  <RegistrationContract onComplete={handleContractComplete} />
                )}
                
                {appState === 'registration-form' && (
                  <RegistrationForm onSubmit={handleRegistrationFormSubmit} />
                )}
              </div>
              
              {(appState === 'main-menu' || appState === 'grade-selection') && !contractReadingActive && !stateTransitioning && (
                <div className="mt-4 max-w-4xl mx-auto">
                  <VoiceRecognition 
                    isListening={isListening && !contractReadingActive && !stateTransitioning} 
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
