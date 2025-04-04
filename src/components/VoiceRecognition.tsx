
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MicIcon, MicOffIcon, LoaderIcon } from 'lucide-react';

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
  
  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('Speech Recognition API is not supported in this browser');
        setRecognitionSupported(false);
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
          setTimeout(() => {
            setProcessingVoice(false);
            setTranscript('');
          }, 1000);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        
        if (event.error === 'aborted') {
          setError('Ses tanıma iptal edildi. Lütfen tekrar deneyin.');
        } else if (event.error === 'no-speech') {
          setError('Ses algılanamadı. Lütfen daha yüksek sesle konuşun.');
        } else if (event.error === 'network') {
          setError('Ağ hatası. Lütfen internet bağlantınızı kontrol edin.');
        } else {
          setError(`Ses tanıma hatası: ${event.error}`);
        }
        
        // Don't try to restart after error, just clear the active state
        isRecognitionActiveRef.current = false;
        
        // Try to restart after a short delay
        setTimeout(() => {
          if (isListening) {
            startRecognition();
          }
        }, 1000);
      };
      
      recognition.onend = () => {
        console.log('Speech recognition session ended');
        isRecognitionActiveRef.current = false;
        
        // Only try to restart if we're still supposed to be listening
        if (isListening) {
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
      return null;
    }
  }, [isListening, onListeningEnd, onResult]);
  
  const startRecognition = useCallback(() => {
    // Don't start if we're already active
    if (isRecognitionActiveRef.current) {
      console.log('Recognition already active, not starting again');
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
      
      // Try to restart after a short delay
      setTimeout(() => {
        if (isListening) {
          startRecognition();
        }
      }, 1500);
    }
  }, [initRecognition, isListening]);
  
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
  
  // Manage recognition based on isListening prop
  useEffect(() => {
    if (isListening) {
      startRecognition();
    } else {
      stopRecognition();
      setTranscript('');
    }
    
    return () => {
      stopRecognition();
    };
  }, [isListening, startRecognition, stopRecognition]);
  
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
    }
  };
  
  return (
    <div className="mt-4">
      {prompt && (
        <div className="flex items-center mb-2">
          <p className="text-lg text-blue-800">{prompt}</p>
          <button 
            onClick={() => prompt && window.speechSynthesis.speak(new SpeechSynthesisUtterance(prompt))}
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
              {processingVoice ? 'İşleniyor...' : 'Sizi dinliyorum...'}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <MicOffIcon size={24} className="text-gray-400" />
            <span className="text-sm text-gray-600">Dinleme beklemede</span>
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
          disabled={!isListening}
          aria-label="Sesli komut giriş alanı"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors"
          disabled={!isListening}
          aria-label="Komutu gönder"
        >
          Gönder
        </button>
      </form>
    </div>
  );
};

export default VoiceRecognition;
