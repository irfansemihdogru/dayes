
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MicIcon, MicOffIcon, LoaderIcon } from 'lucide-react';
import { isCurrentlySpeaking } from '@/utils/speechUtils';

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
  const maxRetries = 3;
  
  // Preprocess voice input to improve grade recognition
  const preprocessGradeInput = (text: string): string => {
    // Check if the text might be referring to a grade but in a way that's hard to parse
    const normalizedText = text.toLowerCase().trim();
    
    // Replace common variations of "9th grade" in Turkish
    if (normalizedText.includes('dokuz') || normalizedText.includes('9.') || normalizedText.includes('9 sınıf')) {
      return 'dokuzuncu sınıf';
    }
    // Replace common variations of "10th grade"
    else if (normalizedText.includes('on') || normalizedText.includes('10.') || normalizedText.includes('10 sınıf')) {
      return 'onuncu sınıf';
    }
    // Replace common variations of "11th grade"
    else if (normalizedText.includes('on bir') || normalizedText.includes('11.') || normalizedText.includes('11 sınıf')) {
      return 'on birinci sınıf';
    }
    // Replace common variations of "12th grade"
    else if (normalizedText.includes('on iki') || normalizedText.includes('12.') || normalizedText.includes('12 sınıf')) {
      return 'on ikinci sınıf';
    }
    
    return text;
  };
  
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
          
          // Preprocess the input specifically for grade recognition
          const processedText = preprocessGradeInput(transcriptValue);
          console.log('Processed voice input:', processedText);
          
          onResult(processedText);
          
          setTimeout(() => {
            setProcessingVoice(false);
            setTranscript('');
          }, 500);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        
        if (event.error === 'aborted') {
          // Don't show error for aborted, just retry
          console.log('Recognition aborted, will retry automatically');
        } else if (event.error === 'no-speech') {
          setError('Ses algılanamadı');
        } else if (event.error === 'network') {
          setError('Ağ hatası');
        } else {
          setError(`Ses tanıma hatası: ${event.error}`);
        }
        
        // Try to restart after a short delay if we're supposed to be listening
        if (isListening && retryCountRef.current < maxRetries && !isCurrentlySpeaking()) {
          retryCountRef.current++;
          setTimeout(() => {
            startRecognition();
          }, 300);
        } else {
          retryCountRef.current = 0;
        }
      };
      
      recognition.onend = () => {
        console.log('Speech recognition session ended');
        isRecognitionActiveRef.current = false;
        
        // Only try to restart if we're still supposed to be listening and not speaking
        if (isListening && !isCurrentlySpeaking()) {
          console.log('Recognition ended but isListening is true, restarting');
          setTimeout(() => {
            startRecognition();
          }, 300);
        }
      };
      
      return recognition;
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setRecognitionSupported(false);
      return null;
    }
  }, [isListening, onResult]);
  
  const startRecognition = useCallback(() => {
    // Don't start if we're already active or if speech synthesis is speaking
    if (isRecognitionActiveRef.current || isCurrentlySpeaking()) {
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
    }
  }, [initRecognition]);
  
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
      if (isCurrentlySpeaking() && isRecognitionActiveRef.current) {
        console.log("System is speaking, stopping recognition");
        stopRecognition();
      } 
      // If system is not speaking and we should be listening, start recognition
      else if (!isCurrentlySpeaking() && isListening && !isRecognitionActiveRef.current) {
        console.log("System not speaking, can start recognition");
        startRecognition();
      }
    }, 300);
    
    return () => clearInterval(checkSpeakingInterval);
  }, [isListening, startRecognition, stopRecognition]);
  
  // Manage recognition based on isListening prop
  useEffect(() => {
    if (isListening && !isCurrentlySpeaking()) {
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
        setRecognitionSupported(false);
      }
    };
    
    if (isListening) {
      checkMicrophoneAccess();
    }
  }, [isListening]);
  
  return (
    <div className="mt-4">
      {prompt && (
        <div className="flex justify-center mb-2">
          <p className="text-xl font-medium text-blue-800 dark:text-blue-300">{prompt}</p>
        </div>
      )}
      
      <div className="flex justify-center items-center">
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
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {processingVoice ? 'İşleniyor...' : isCurrentlySpeaking() ? 'Sistem konuşuyor...' : 'Sizi dinliyorum...'}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <MicOffIcon size={24} className="text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {isCurrentlySpeaking() ? 'Sistem konuşuyor...' : 'Mikrofon kapalı'}
            </span>
          </div>
        )}
      </div>
      
      {transcript && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-700">
          <p className="text-gray-700 dark:text-gray-200 text-center" role="status" aria-live="polite">{transcript}</p>
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-center">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      {/* Manual input as a fallback */}
      <form onSubmit={handleManualSubmit} className="mt-4 flex max-w-md mx-auto">
        <input
          type="text"
          value={manualInput}
          onChange={handleManualInputChange}
          placeholder="Sesli komut girmek için buraya yazın"
          className="flex-1 px-4 py-2 border border-blue-300 dark:border-blue-700 dark:bg-gray-800 dark:text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
