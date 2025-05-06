
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2Icon, VolumeXIcon, School } from 'lucide-react';
import MainMenuComponent from '@/components/MainMenu';
import VoiceRecognition from '@/components/VoiceRecognition';
import { processVoiceCommand } from '@/utils/geminiApi';
import { speakText, isCurrentlySpeaking, cancelSpeech } from '@/utils/speechUtils';
import { useTheme } from '@/context/ThemeContext';

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [voiceCommandProcessing, setVoiceCommandProcessing] = useState(false);
  const [promptAlreadyGiven, setPromptAlreadyGiven] = useState(false);
  
  const systemLastSpokeRef = useRef<number>(Date.now());
  const voiceCommandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voiceRecognitionBufferTimeMs = 1000; // Increased buffer time
  
  const { isDarkMode } = useTheme();
  
  // Initialize voice interactions when the page loads
  useEffect(() => {
    // Clear any existing timeouts
    if (voiceCommandTimeoutRef.current) {
      clearTimeout(voiceCommandTimeoutRef.current);
    }
    
    // Cancel any ongoing speech
    cancelSpeech();
    
    // Reset listening state
    setIsListening(false);
    
    // Initialize prompt and voice
    initializeVoice();
    
    return () => {
      // Cleanup
      cancelSpeech();
      if (voiceCommandTimeoutRef.current) {
        clearTimeout(voiceCommandTimeoutRef.current);
      }
    };
  }, []);
  
  const initializeVoice = () => {
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
          }
        });
      } else {
        // Wait a moment before activating microphone
        setTimeout(() => {
          if (!voiceCommandProcessing) {
            setIsListening(true);
          }
        }, voiceRecognitionBufferTimeMs);
      }
    } else {
      // If prompt already given, just enable listening after buffer time
      if (!isListening && !isCurrentlySpeaking() && !voiceCommandProcessing) {
        setTimeout(() => {
          setIsListening(true);
        }, voiceRecognitionBufferTimeMs);
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
                  if (!voiceCommandProcessing) {
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
  
  const handleVoiceResult = async (text: string) => {
    // Ignore voice commands if we're already processing a voice command
    if (voiceCommandProcessing) {
      console.log("Already processing a voice command, ignoring");
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
      
      // Temporarily disable listening while processing command
      setIsListening(false);
      
      // Process the voice command
      const result = await processVoiceCommand(text);
      console.log("Gemini API result:", result);
      
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
              setIsListening(true);
            }, voiceRecognitionBufferTimeMs);
          }
        });
      } else {
        // Reset the processing flag
        setVoiceCommandProcessing(false);
        
        // Re-enable listening after a short delay
        setTimeout(() => {
          setIsListening(true);
        }, voiceRecognitionBufferTimeMs);
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      
      // Reset the processing flag
      setVoiceCommandProcessing(false);
      
      // Re-enable listening after error
      setTimeout(() => {
        if (!isCurrentlySpeaking()) {
          setIsListening(true);
        }
      }, voiceRecognitionBufferTimeMs);
    }
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
    
    if (service === 'devamsizlik') {
      navigate('/attendance-form');
      return;
    }
    
    if (service === '9-sinif-kayit') {
      navigate('/registration-contract');
      return;
    }
    
    if (service === 'disiplin') {
      navigate(`/staff-direction/OKAN KARAHAN/Disiplin`);
      return;
    }
    
    if (service === 'diploma') {
      navigate(`/staff-direction/YENER HANCI/Diploma`);
      return;
    }
    
    if (service === 'ogrenci-alma-izni') {
      navigate(`/staff-direction/OKAN KARAHAN/Öğrenciyi Okuldan Alma İzni`);
      return;
    }
    
    if (service === 'mesem') {
      navigate(`/staff-direction/YENER HANCI/Mesem`);
      return;
    }
    
    if (service === 'usta-ogreticilik-belgesi') {
      navigate(`/staff-direction/YENER HANCI/Usta Öğreticilik Belgesi`);
      return;
    }
    
    navigate('/grade-selection');
  };
  
  const handleResetApp = () => {
    // Cancel any ongoing speech
    cancelSpeech();
    
    // Navigate back to start page
    navigate('/');
  };
  
  // Props for VoiceRecognition
  const getVoiceRecognitionProps = () => {
    return {
      isListening: isListening,
      onResult: handleVoiceResult,
      onListeningEnd: () => {
        setIsListening(false);
      },
      prompt: voicePrompt,
      systemLastSpokeTimestamp: systemLastSpokeRef.current,
      bufferTimeMs: voiceRecognitionBufferTimeMs
    };
  };
  
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
          <MainMenuComponent onSelection={handleServiceSelection} />
        </div>
        
        <div className="mt-4 max-w-4xl mx-auto">
          <VoiceRecognition 
            {...getVoiceRecognitionProps()}
          />
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm" role="note">
          ESC tuşuna basarak sistemi sıfırlayabilirsiniz
        </p>
      </div>
    </div>
  );
};

export default MainMenu;
