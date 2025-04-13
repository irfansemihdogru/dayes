import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MicIcon, MicOffIcon, LoaderIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecognitionProps {
  isListening: boolean;
  onResult: (text: string) => void;
  onListeningEnd?: () => void;
  prompt?: string;
}

// Type for the Speech Recognition API
interface SpeechRecognition {
  new (): SpeechRecognition;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
}

// Global access to the SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognition;
    webkitSpeechRecognition: SpeechRecognition;
  }
}

const VoiceRecognition: React.FC<VoiceRecognitionProps> = ({
  isListening,
  onResult,
  onListeningEnd,
  prompt
}) => {
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [processingVoice, setProcessingVoice] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isRecognitionActiveRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const { toast } = useToast();
  
  // Helper function to check if speech synthesis is speaking
  const isSpeaking = useCallback(() => {
    return window.speechSynthesis && window.speechSynthesis.speaking;
  }, []);
  
  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('Speech Recognition API is not supported in this browser');
        setRecognitionSupported(false);
        toast({
          title: "Ses tanıma desteklenmiyor",
          description: "Tarayıcınız ses tanıma özelliğini desteklemiyor. Lütfen metin girişini kullanın.",
          variant: "destructive",
        });
        return null;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'tr-TR'; // Turkish language
      
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptValue = result[0].transcript;
        
        console.log('Speech recognition result:', transcriptValue);
        setTranscript(transcriptValue);
        
        if (result.isFinal) {
          setProcessingVoice(true);
          onResult(transcriptValue);
          
          // Auto-disable microphone after receiving a command
          setTimeout(() => {
            stopRecognition();
            if (onListeningEnd) {
              onListeningEnd();
            }
            setProcessingVoice(false);
            setTranscript('');
          }, 1000);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        
        if (event.error === 'aborted') {
          // Don't show error for aborted, just retry
          console.log('Recognition aborted, will retry automatically');
        } else if (event.error === 'no-speech') {
          setError('Ses algılanamadı. Lütfen daha yüksek sesle konuşun.');
          toast({
            title: "Ses algılanamadı",
            description: "Lütfen daha yüksek sesle konuşun veya mikrofonunuzu kontrol edin.",
            variant: "default",
          });
        } else if (event.error === 'network') {
          setError('Ağ hatası. Lütfen internet bağlantınızı kontrol edin.');
          toast({
            title: "Ağ hatası",
            description: "Lütfen internet bağlantınızı kontrol edin.",
            variant: "destructive",
          });
        } else {
          setError(`Ses tanıma hatası: ${event.error}`);
          toast({
            title: "Ses tanıma hatası",
            description: `${event.error}`,
            variant: "destructive",
          });
        }
        
        // Try to restart after a short delay
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          setTimeout(() => {
            if (isListening && !isSpeaking()) {
              console.log(`Retry attempt ${retryCountRef.current} of ${maxRetries}`);
              startRecognition();
            }
          }, 300); // Shorter delay for retries
        } else {
          console.log('Max retries reached, waiting longer before next attempt');
          retryCountRef.current = 0;
          setTimeout(() => {
            if (isListening && !isSpeaking()) {
              startRecognition();
            }
          }, 1000); // Longer delay after max retries
        }
      };
      
      recognition.onend = () => {
        console.log('Speech recognition session ended');
        isRecognitionActiveRef.current = false;
        
        // Only try to restart if we're still supposed to be listening and not speaking
        if (isListening && !isSpeaking()) {
          console.log('Recognition ended but isListening is true, restarting');
          setTimeout(() => {
            startRecognition();
          }, 300);
        } else if (onListeningEnd) {
          onListeningEnd();
        }
      };
      
      return recognition;
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setRecognitionSupported(false);
      toast({
        title: "Ses tanıma başlatılamadı",
        description: "Tarayıcınız ses tanıma özelliğini desteklemiyor olabilir.",
        variant: "destructive",
      });
      return null;
    }
  }, [isListening, onListeningEnd, onResult, toast, isSpeaking]);
  
  const startRecognition = useCallback(() => {
    // Don't start if we're already active or if speech synthesis is speaking
    if (isRecognitionActiveRef.current || isSpeaking()) {
      console.log('Recognition already active or system is speaking, not starting recognition');
      return;
    }
    
    try {
      // Initialize recognition if needed
      if (!recognitionRef.current) {
        recognitionRef.current = initRecognition();
      }
      
      const recognition = recognitionRef.current;
      if (!recognition) {
        console.log('No recognition instance available');
        return;
      }
      
      // Start recognition
      recognition.start();
      isRecognitionActiveRef.current = true;
      console.log('Started speech recognition');
      setError(null);
    } catch (err) {
      console.error('Error starting recognition:', err);
      setError('Ses tanıma başlatılamadı');
      isRecognitionActiveRef.current = false;
      
      // If we got an error, reset the recognition instance to try again next time
      recognitionRef.current = null;
      
      // Try to restart after a short delay if not speaking
      setTimeout(() => {
        if (isListening && !isSpeaking()) {
          startRecognition();
        }
      }, 500);
    }
  }, [initRecognition, isListening, isSpeaking]);
  
  const stopRecognition = useCallback(() => {
    if (!isRecognitionActiveRef.current || !recognitionRef.current) {
      return;
    }
    
    try {
      recognitionRef.current.stop();
      isRecognitionActiveRef.current = false;
      console.log('Stopped speech recognition');
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
  }, []);
  
  // Check if system is speaking before starting recognition
  useEffect(() => {
    const checkSpeakingInterval = setInterval(() => {
      // If system is speaking, ensure recognition is stopped
      if (isSpeaking() && isRecognitionActiveRef.current) {
        console.log("System is speaking, stopping recognition");
        stopRecognition();
      } 
      // If system is not speaking and we should be listening, start recognition
      else if (!isSpeaking() && isListening && !isRecognitionActiveRef.current) {
        console.log("System not speaking, can start recognition");
        startRecognition();
      }
    }, 300);
    
    return () => clearInterval(checkSpeakingInterval);
  }, [isListening, isSpeaking, startRecognition, stopRecognition]);
  
  // Manage recognition based on isListening prop
  useEffect(() => {
    if (isListening && !isSpeaking()) {
      startRecognition();
    } else {
      stopRecognition();
      setTranscript('');
    }
    
    return () => {
      stopRecognition();
    };
  }, [isListening, startRecognition, stopRecognition, isSpeaking]);
  
  // For fallback if speech recognition is not supported
  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManualInput(e.target.value);
  };
  
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      console.log('Manual input submitted:', manualInput);
      onResult(manualInput);
      setManualInput('');
      
      // Auto-disable microphone after manual input
      if (onListeningEnd) {
        onListeningEnd();
      }
    }
  };

  // Check microphone access
  useEffect(() => {
    const checkMicrophoneAccess = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // We got microphone access
        stream.getTracks().forEach(track => track.stop()); // Release the microphone
        console.log('Microphone access granted');
      } catch (err) {
        console.error('Microphone access denied:', err);
        toast({
          title: "Mikrofon erişimi reddedildi",
          description: "Ses tanıma için lütfen mikrofon erişimine izin verin.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };
    
    checkMicrophoneAccess();
  }, [toast]);
  
  return (
    <div className="mt-4">
      {prompt && (
        <div className="flex items-center mb-2">
          <p className="text-lg text-blue-800">{prompt}</p>
          <button 
            onClick={() => {
              if (prompt && 'speechSynthesis' in window) {
                // Stop any active recognition
                stopRecognition();
                const utterance = new SpeechSynthesisUtterance(prompt);
                utterance.lang = 'tr-TR';
                utterance.onend = () => {
                  // Re-enable recognition when prompt reading ends
                  if (isListening && !isSpeaking()) {
                    setTimeout(() => startRecognition(), 300);
                  }
                };
                window.speechSynthesis.speak(utterance);
              }
            }}
            className="ml-2 p-1 text-blue-600 hover:text-blue-800 focus:outline-none"
            aria-label="Metni sesli dinle"
          >
            <span role="img" aria-label="sesli dinle">🔊</span>
          </button>
        </div>
      )}
      
      <div className="flex items-center">
        {isListening ? (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <MicIcon 
                size={24} 
                className={`text-red-500 ${processingVoice ? 'opacity-50' : 'animate-pulse'}`} 
              />
              {processingVoice && (
                <LoaderIcon size={16} className="absolute top-1 right-1 text-blue-600 animate-spin" />
              )}
            </div>
            <span className="text-sm text-gray-600">
              {processingVoice ? 'İşleniyor...' : isSpeaking() ? 'Sistem konuşuyor...' : 'Sizi dinliyorum...'}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <MicOffIcon size={24} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              {isSpeaking() ? 'Sistem konuşuyor...' : 'Dinleme beklemede'}
            </span>
          </div>
        )}
      </div>
      
      {transcript && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-gray-700" role="status" aria-live="polite">{transcript}</p>
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200" role="alert">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* Always show manual input as a fallback */}
      <form onSubmit={handleManualSubmit} className="mt-2 flex">
        <input
          type="text"
          value={manualInput}
          onChange={handleManualInputChange}
          placeholder="Sesli komut girmek için buraya yazın"
          className="flex-1 px-4 py-2 border border-blue-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Sesli komut giriş alanı"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors"
          aria-label="Komutu gönder"
        >
          Gönder
        </button>
      </form>
    </div>
  );
};

export default VoiceRecognition;
