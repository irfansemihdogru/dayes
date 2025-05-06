
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { School } from 'lucide-react';
import MainMenu from '@/components/MainMenu';
import RouteSafeVoiceRecognition from '@/components/RouteSafeVoiceRecognition';
import { processVoiceCommand } from '@/utils/geminiApi';
import { speakText, isCurrentlySpeaking, cancelSpeech } from '@/utils/speechUtils';
import { Volume2Icon, VolumeXIcon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const MainMenuPage = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [promptAlreadyGiven, setPromptAlreadyGiven] = useState(false);
  const [voiceCommandProcessing, setVoiceCommandProcessing] = useState(false);
  
  const systemLastSpokeRef = useRef<number>(Date.now());
  const voiceRecognitionBufferTimeMs = 800;
  const { isDarkMode } = useTheme();
  
  useEffect(() => {
    // Initialize state voice on component mount
    if (!promptAlreadyGiven) {
      const prompt = 'Lütfen Yapmak İstediğiniz İşlemi Seçin Veya Sesli Olarak Söyleyin';
      setVoicePrompt(prompt);
      setPromptAlreadyGiven(true);
      
      if (audioEnabled) {
        systemLastSpokeRef.current = Date.now();
        
        speakText(prompt, {
          onStart: () => {
            systemLastSpokeRef.current = Date.now();
          },
          onEnd: () => {
            systemLastSpokeRef.current = Date.now();
            announceMenuItems();
          }
        });
      }
      
      // Start listening after a delay
      setTimeout(() => {
        setIsListening(true);
      }, voiceRecognitionBufferTimeMs);
    }
    
    return () => {
      cancelSpeech();
      setIsListening(false);
    };
  }, [audioEnabled]);
  
  // Announce menu items
  const announceMenuItems = () => {
    const menuItems = [
      '9.Sınıf Kayıt İşlemleri',
      'Öğrenci İzin İşlemleri',
      'Mesem Öğrenci İşlemleri',
      'Devamsızlık İşlemleri',
      'Disiplin İşlemleri',
      'Diploma İşlemleri',
    ];
    
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
  
  const handleServiceSelection = (service: string) => {
    // Immediately turn off microphone when a selection is made
    setIsListening(false);
    cancelSpeech();
    
    systemLastSpokeRef.current = Date.now();
    
    // Navigate based on service selection
    if (service === 'devamsizlik') {
      navigate('/devamsizlik');
      return;
    }
    
    if (service === '9-sinif-kayit') {
      navigate('/registration-contract');
      return;
    }
    
    if (['disiplin', 'diploma', 'ogrenci-alma-izni', 'mesem', 'usta-ogreticilik-belgesi'].includes(service)) {
      navigate('/staff-direction', { 
        state: { 
          service, 
          staffName: service === 'diploma' || service === 'mesem' || service === 'usta-ogreticilik-belgesi' 
            ? 'YENER HANCI' 
            : 'OKAN KARAHAN'
        } 
      });
      return;
    }
    
    // For grade selection, we'll pass the service as state
    navigate('/grade-selection', { state: { service } });
  };
  
  const handleVoiceResult = async (text: string) => {
    // Immediately turn off microphone
    setIsListening(false);
    
    // Ignore if we're already processing a command
    if (voiceCommandProcessing) {
      return;
    }
    
    // Check if enough time has passed since system last spoke
    const timeSinceSystemSpoke = Date.now() - systemLastSpokeRef.current;
    if (timeSinceSystemSpoke < voiceRecognitionBufferTimeMs) {
      console.log(`Ignoring voice input, system spoke ${timeSinceSystemSpoke}ms ago (buffer: ${voiceRecognitionBufferTimeMs}ms)`);
      
      // Re-enable listening after a delay
      setTimeout(() => {
        setIsListening(true);
      }, voiceRecognitionBufferTimeMs);
      return;
    }
    
    try {
      setVoiceCommandProcessing(true);
      
      const result = await processVoiceCommand(text);
      console.log("Gemini API result:", result);
      
      if (result.intent) {
        if (['mesem', 'usta-ogreticilik-belgesi', 'diploma', 'disiplin', 
             'ogrenci-alma-izni', '9-sinif-kayit', 'devamsizlik'].includes(result.intent)) {
          // Intent found, handle selection
          handleServiceSelection(result.intent);
          return; // Exit early to prevent re-enabling listening
        }
      }
      
      // If we get here, no valid intent was found
      if (audioEnabled) {
        systemLastSpokeRef.current = Date.now();
        
        speakText("Lütfen tekrar söyleyiniz", {
          onStart: () => {
            systemLastSpokeRef.current = Date.now();
          },
          onEnd: () => {
            systemLastSpokeRef.current = Date.now();
            setVoiceCommandProcessing(false);
            
            // Re-enable listening after a delay
            setTimeout(() => {
              setIsListening(true);
            }, voiceRecognitionBufferTimeMs);
          }
        });
      } else {
        setVoiceCommandProcessing(false);
        
        // Re-enable listening after a delay
        setTimeout(() => {
          setIsListening(true);
        }, voiceRecognitionBufferTimeMs);
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      setVoiceCommandProcessing(false);
      
      // Re-enable listening after an error
      setTimeout(() => {
        setIsListening(true);
      }, voiceRecognitionBufferTimeMs);
    }
  };
  
  const toggleAudio = () => {
    cancelSpeech();
    systemLastSpokeRef.current = Date.now();
    setAudioEnabled(!audioEnabled);
    
    if (!audioEnabled) {
      setTimeout(() => {
        speakText('Sesli yönlendirme etkinleştirildi.', {
          onStart: () => {
            systemLastSpokeRef.current = Date.now();
          },
          onEnd: () => {
            systemLastSpokeRef.current = Date.now();
          }
        });
      }, 300);
    }
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
          <MainMenu onSelection={handleServiceSelection} />
        </div>
        
        <div className="mt-4 max-w-4xl mx-auto">
          <RouteSafeVoiceRecognition 
            isListening={isListening}
            onResult={handleVoiceResult}
            onListeningEnd={() => setIsListening(false)}
            prompt={voicePrompt}
            systemLastSpokeTimestamp={systemLastSpokeRef.current}
            bufferTimeMs={voiceRecognitionBufferTimeMs}
          />
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm" role="note">
          ESC tuşuna basarak sistemi sıfırlayabilirsiniz
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1" role="note">
          Mikrofonu kapatmak için <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-sm">Q</kbd> tuşuna basabilirsiniz
        </p>
      </div>
    </div>
  );
};

export default MainMenuPage;
