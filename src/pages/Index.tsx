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
  const [promptAlreadyGiven, setPromptAlreadyGiven] = useState(false);
  const [voiceCommandProcessing, setVoiceCommandProcessing] = useState(false); // Add to track when voice command is being processed
  
  const appInitialized = useRef(false);
  const { theme, isDarkMode } = useTheme();
  const voiceCommandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const systemLastSpokeRef = useRef<number>(Date.now());
  const voiceRecognitionBufferTimeMs = 800; // Reduced buffer time to make voice recognition more responsive
  
  // This effect handles state transitions and prevents overlapping voice commands
  useEffect(() => {
    // Store previous state when changing states
    if (appState !== lastAppState) {
      setLastAppState(appState);
      setPromptAlreadyGiven(false);
      setVoiceCommandProcessing(false); // Reset processing flag on state change
      
      // When transitioning between states, always cancel any ongoing speech
      // and stop listening to prevent command overlap
      cancelSpeech();
      setIsListening(false);
      
      // If transitioning away from grade-selection or main-menu, clear any timeouts
      if (voiceCommandTimeoutRef.current) {
        clearTimeout(voiceCommandTimeoutRef.current);
        voiceCommandTimeoutRef.current = null;
      }
      
      // Update timestamp to prevent immediate voice recognition
      systemLastSpokeRef.current = Date.now();
      
      // Add a delay before initializing voice for the new state
      // to ensure any previous speech/recognition is fully stopped
      setTimeout(() => {
        initializeStateVoice(appState);
      }, 300);
    }
  }, [appState]);
  
  // New function to initialize voice interactions for each state
  const initializeStateVoice = (state: AppState) => {
    // Don't enable listening if contract reading is active
    if (contractReadingActive) {
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
        // Only speak the prompt once
        if (!promptAlreadyGiven) {
          const prompt = 'Lütfen Yapmak İstediğiniz İşlemi Seçin Veya Sesli Olarak Söyleyin';
          setVoicePrompt(prompt);
          setPromptAlreadyGiven(true);
          
          if (audioEnabled) {
            // Update timestamp before speaking
            systemLastSpokeRef.current = Date.now();
            
            speakText(prompt, {
              onStart: () => {
                // Update timestamp when speech starts
                systemLastSpokeRef.current = Date.now();
              },
              onEnd: () => {
                // Update timestamp when speech ends
                systemLastSpokeRef.current = Date.now();
                
                // After prompt, announce each menu item
                announceMenuItems();
                
                // Check again if the state is still main-menu and no contract reading is active
                // Add a buffer time to prevent self-triggering
                setTimeout(() => {
                  if (appState === 'main-menu' && !contractReadingActive && !voiceCommandProcessing) {
                    setIsListening(true);
                  }
                }, voiceRecognitionBufferTimeMs);
              }
            });
          } else {
            // Wait a moment before activating microphone
            setTimeout(() => {
              if (appState === 'main-menu' && !contractReadingActive && !voiceCommandProcessing) {
                setIsListening(true);
              }
            }, voiceRecognitionBufferTimeMs);
          }
        } else {
          // If prompt already given, just enable listening after buffer time
          if (!isListening && !isCurrentlySpeaking() && !contractReadingActive && !voiceCommandProcessing) {
            setTimeout(() => {
              setIsListening(true);
            }, voiceRecognitionBufferTimeMs);
          }
        }
        break;
      }
      
      case 'grade-selection': {
        // Only speak the prompt once
        if (!promptAlreadyGiven) {
          const prompt = 'Öğrenciniz kaçıncı sınıf?';
          setVoicePrompt(prompt);
          setPromptAlreadyGiven(true);
          
          if (audioEnabled) {
            // Update timestamp before speaking
            systemLastSpokeRef.current = Date.now();
            
            speakText(prompt, {
              onStart: () => {
                // Update timestamp when speech starts
                systemLastSpokeRef.current = Date.now();
              },
              onEnd: () => {
                // Update timestamp when speech ends
                systemLastSpokeRef.current = Date.now();
                
                // Check again if the state is still grade-selection and no contract reading is active
                // Add a buffer time to prevent self-triggering
                setTimeout(() => {
                  if (appState === 'grade-selection' && !contractReadingActive && !voiceCommandProcessing) {
                    setIsListening(true);
                  }
                }, voiceRecognitionBufferTimeMs);
              }
            });
          } else {
            // Wait a moment before activating microphone
            setTimeout(() => {
              if (appState === 'grade-selection' && !contractReadingActive && !voiceCommandProcessing) {
                setIsListening(true);
              }
            }, voiceRecognitionBufferTimeMs);
          }
        } else {
          // If prompt already given, just enable listening after buffer time
          if (!isListening && !isCurrentlySpeaking() && !contractReadingActive && !voiceCommandProcessing) {
            setTimeout(() => {
              setIsListening(true);
            }, voiceRecognitionBufferTimeMs);
          }
        }
        break;
      }
    }
  };
  
  // Announce menu items - extract to a separate function
  const announceMenuItems = () => {
    const menuItems = [
      '9.Sınıf Kayıt İşlemleri',
      'Öğrenci İzin İşlemleri',
      'Mesem Öğrenci İşlemleri',
      'Devamsızlık İşlemleri',
      'Disiplin İşlemleri',
      'Diploma İşlemleri',
    ];
    
    // Small delay before starting to announce menu items
    setTimeout(() => {
      let delay = 0;
      menuItems.forEach((item, index) => {
        setTimeout(() => {
          speakText(item, {
            rate: 0.9,
            onStart: () => {
              systemLastSpokeRef.current = Date.now();
            },
            onEnd: () => {
              systemLastSpokeRef.current = Date.now();
              
              // Enable listening after the last item is announced
              if (index === menuItems.length - 1) {
                setTimeout(() => {
                  if (appState === 'main-menu' && !contractReadingActive && !voiceCommandProcessing) {
                    setIsListening(true);
                  }
                }, voiceRecognitionBufferTimeMs);
              }
            }
          });
        }, delay);
        delay += 1500; // Space announcements 1.5 seconds apart
      });
    }, 300);
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
          
          // Update timestamp to prevent voice recognition
          systemLastSpokeRef.current = Date.now();
          
          // Cancel any active timeouts
          if (voiceCommandTimeoutRef.current) {
            clearTimeout(voiceCommandTimeoutRef.current);
            voiceCommandTimeoutRef.current = null;
          }
        } else {
          // Update timestamp when contract reading ends
          systemLastSpokeRef.current = Date.now();
          
          // Contract reading has finished, re-initialize voice for current state after a delay
          setTimeout(() => {
            initializeStateVoice(appState);
          }, voiceRecognitionBufferTimeMs);
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
    
    // Update timestamp before speaking
    systemLastSpokeRef.current = Date.now();
    
    const welcomeText = "Yıldırım Ticaret Meslek ve Teknik Anadolu Lisesi Veli Yönlendirme Sistemine hoş geldiniz. Lütfen kameraya bakarak yüzünüzün algılanmasını bekleyiniz.";
    
    speakText(welcomeText, {
      onStart: () => {
        setWelcomeMessagePlaying(true);
        // Update timestamp when speech starts
        systemLastSpokeRef.current = Date.now();
      },
      onEnd: () => {
        setWelcomeMessagePlaying(false);
        // Update timestamp when speech ends
        systemLastSpokeRef.current = Date.now();
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
      
      // Update timestamp before state change
      systemLastSpokeRef.current = Date.now();
      
      setTimeout(() => {
        setAppState('main-menu');
      }, 1000);
    }
  };
  
  // Add keyboard shortcut for Q key to disable microphone globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key to reset app
      if (e.key === 'Escape') {
        resetApp();
      }
      
      // Q key to disable microphone
      if (e.key === 'q' || e.key === 'Q') {
        console.log('Q key pressed globally, disabling microphone');
        setIsListening(false);
        
        // Update timestamp to prevent immediate reactivation
        systemLastSpokeRef.current = Date.now();
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
    
    // Update timestamp
    systemLastSpokeRef.current = Date.now();
    
    setAudioEnabled(!audioEnabled);
    
    if (!audioEnabled) {
      setTimeout(() => {
        speakText('Sesli yönlendirme etkinleştirildi.', {
          onStart: () => {
            // Update timestamp when speech starts
            systemLastSpokeRef.current = Date.now();
          },
          onEnd: () => {
            // Update timestamp when speech ends
            systemLastSpokeRef.current = Date.now();
          }
        });
      }, 300);
    }
  };
  
  const handleServiceSelection = (service: string) => {
    // Turn off microphone when a service is selected
    setIsListening(false);
    cancelSpeech(); // Cancel any ongoing speech
    
    // Update timestamp
    systemLastSpokeRef.current = Date.now();
    
    setSelectedService(service);
    
    if (service === 'devamsizlik') {
      setAppState('devamsizlik-form');
      return;
    }
    
    if (service === '9-sinif-kayit') {
      setAppState('registration-contract');
      return;
    }
    
    if (service === 'disiplin') {
      setDirectedStaff('OKAN KARAHAN');
      setAppState('staff-direction');
      return;
    }
    
    if (service === 'diploma') {
      setDirectedStaff('YENER HANCI');
      setAppState('staff-direction');
      return;
    }
    
    if (service === 'ogrenci-alma-izni') {
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
    cancelSpeech(); // Cancel any ongoing speech
    
    // Update timestamp
    systemLastSpokeRef.current = Date.now();
    
    setSelectedGrade(grade);
    
    const staff = gradeToStaff[grade.toString()];
    if (staff) {
      setDirectedStaff(staff);
      setAppState('staff-direction');
    }
  };
  
  const handleDevamsizlikFormSubmit = (name: string, surname: string) => {
    // Make sure any speech is cancelled to prevent overlap
    cancelSpeech();
    
    // Update timestamp
    systemLastSpokeRef.current = Date.now();
    
    setStudentName(name);
    setStudentSurname(surname);
    setAppState('devamsizlik-table');
  };
  
  const handleDevamsizlikTimeout = () => {
    setAppState('main-menu');
  };
  
  const handleContractComplete = () => {
    setAppState('registration-form');
  };
  
  const handleRegistrationFormSubmit = () => {
    // Reset to main menu after registration
    setAppState('main-menu');
  };
  
  const handleVoiceResult = async (text: string) => {
    // Ignore voice commands if contract is being read or if we're already processing a voice command
    if (contractReadingActive || voiceCommandProcessing) {
      console.log("Contract reading active or already processing a voice command, ignoring");
      return;
    }
    
    // Check if enough time has passed since system last spoke
    const timeSinceSystemSpoke = Date.now() - systemLastSpokeRef.current;
    if (timeSinceSystemSpoke < voiceRecognitionBufferTimeMs) {
      console.log(`Ignoring voice input, system spoke ${timeSinceSystemSpoke}ms ago (buffer: ${voiceRecognitionBufferTimeMs}ms)`);
      return;
    }
    
    try {
      // Set the processing flag to true to prevent duplicate processing
      setVoiceCommandProcessing(true);
      
      // Reset timeout when a voice command is received
      if (voiceCommandTimeoutRef.current) {
        clearTimeout(voiceCommandTimeoutRef.current);
      }
      
      // Immediately disable listening while processing command
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
          // Update timestamp before speaking
          systemLastSpokeRef.current = Date.now();
          
          speakText("Lütfen tekrar söyleyiniz", {
            onStart: () => {
              // Update timestamp when speech starts
              systemLastSpokeRef.current = Date.now();
            },
            onEnd: () => {
              // Update timestamp when speech ends
              systemLastSpokeRef.current = Date.now();
              
              // Reset the processing flag
              setVoiceCommandProcessing(false);
              
              // Add buffer time before enabling microphone again
              setTimeout(() => {
                if (appState === 'main-menu') {
                  setIsListening(true);
                }
              }, voiceRecognitionBufferTimeMs);
            }
          });
        } else {
          // Reset the processing flag
          setVoiceCommandProcessing(false);
          
          // Re-enable listening after a short delay if still in the same state
          setTimeout(() => {
            if (appState === 'main-menu') {
              setIsListening(true);
            }
          }, voiceRecognitionBufferTimeMs);
        }
      } else if (appState === 'grade-selection' && result.grade) {
        const grade = parseInt(result.grade);
        if ([9, 10, 11, 12].includes(grade)) {
          handleGradeSelection(grade);
          return; // Exit early to prevent re-enabling listening
        } else {
          // Reset the processing flag
          setVoiceCommandProcessing(false);
          
          // If grade is not valid, provide feedback and resume listening
          if (audioEnabled) {
            // Update timestamp before speaking
            systemLastSpokeRef.current = Date.now();
            
            speakText("Lütfen tekrar söyleyiniz", {
              onStart: () => {
                // Update timestamp when speech starts
                systemLastSpokeRef.current = Date.now();
              },
              onEnd: () => {
                // Update timestamp when speech ends
                systemLastSpokeRef.current = Date.now();
                
                // Add buffer time before enabling microphone again
                setTimeout(() => {
                  if (appState === 'grade-selection') {
                    setIsListening(true);
                  }
                }, voiceRecognitionBufferTimeMs);
              }
            });
          } else {
            // Re-enable listening after a short delay if still in the same state
            setTimeout(() => {
              if (appState === 'grade-selection') {
                setIsListening(true);
              }
            }, voiceRecognitionBufferTimeMs);
          }
        }
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      
      // Reset the processing flag
      setVoiceCommandProcessing(false);
      
      // Re-enable listening after error if still in appropriate state
      setTimeout(() => {
        if ((appState === 'main-menu' || appState === 'grade-selection') && 
            !isCurrentlySpeaking() && 
            !contractReadingActive) {
          setIsListening(true);
        }
      }, voiceRecognitionBufferTimeMs);
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

  // Props for VoiceRecognition in main menu and grade selection
  const getVoiceRecognitionProps = () => {
    return {
      isListening: isListening && !contractReadingActive,
      onResult: handleVoiceResult,
      onListeningEnd: () => {
        // Immediately turn off the microphone after processing any voice command
        setIsListening(false);
      },
      prompt: voicePrompt,
      systemLastSpokeTimestamp: systemLastSpokeRef.current,
      bufferTimeMs: voiceRecognitionBufferTimeMs
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
              
              {(appState === 'main-menu' || appState === 'grade-selection') && !contractReadingActive && (
                <div className="mt-4 max-w-4xl mx-auto">
                  <VoiceRecognition 
                    {...getVoiceRecognitionProps()}
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
