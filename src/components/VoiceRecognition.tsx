import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MicIcon, MicOffIcon, LoaderIcon } from 'lucide-react';
import { isCurrentlySpeaking, cancelSpeech } from '@/utils/speechUtils';

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
  const systemSpeakingTimestampRef = useRef<number>(0);
  const recognitionBufferTimeMs = 800; // Wait time after system speech before accepting new commands
  
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
        
        // Check if enough time has passed since system last spoke
        const currentTime = Date.now();
        const timeSinceSystemSpoke = currentTime - systemSpeakingTimestampRef.current;
        
        if (timeSinceSystemSpoke < recognitionBufferTimeMs) {
          console.log(`Ignoring voice input, system spoke ${timeSinceSystemSpoke}ms ago`);
          return;
        }
        
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
  }, [isListening, onListeningEnd, onResult]);
  
  // Track when system is speaking to ignore self-triggered commands
  useEffect(() => {
    // Create a modified version of speechSynthesis.speak that updates our timestamp
    const originalSpeak = window.speechSynthesis.speak;
    window.speechSynthesis.speak = function(utterance) {
      // Update the timestamp when system starts speaking
      systemSpeakingTimestampRef.current = Date.now();
      
      // Also update when speech ends
      const originalOnEnd = utterance.onend;
      utterance.onend = function(event) {
        // Add buffer time to prevent immediate recognition after speech
        systemSpeakingTimestampRef.current = Date.now();
        if (originalOnEnd) {
          originalOnEnd.call(this, event);
        }
      };
      
      return originalSpeak.call(this, utterance);
    };
    
    // Restore original function when component unmounts
    return () => {
      window.speechSynthesis.speak = originalSpeak;
    };
  }, []);
  
  const startRecognition = useCallback(() => {
    // Don't start if we're already active or if speech synthesis is speaking
    if (isRecognitionActiveRef.current || isCurrentlySpeaking()) {
      console.log('Recognition already active or system is speaking, not starting recognition');
      return;
    }
    
    // Check if enough time has passed since system spoke
    const currentTime = Date.now();
    const timeSinceSystemSpoke = currentTime - systemSpeakingTimestampRef.current;
    if (timeSinceSystemSpoke < recognitionBufferTimeMs) {
      console.log(`Not starting recognition, system spoke ${timeSinceSystemSpoke}ms ago`);
      setTimeout(() => {
        // Try again after buffer time has passed
        if (isListening && !isCurrentlySpeaking()) {
          startRecognition();
        }
      }, recognitionBufferTimeMs - timeSinceSystemSpoke);
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
  
  // Check if system is speaking before starting recognition
  useEffect(() => {
    const checkSpeakingInterval = setInterval(() => {
      // If system is speaking, ensure recognition is stopped
      if (isCurrentlySpeaking() && isRecognitionActiveRef.current) {
        console.log("System is speaking, stopping recognition");
        stopRecognition();
        // Update the timestamp
        systemSpeakingTimestampRef.current = Date.now();
      } 
      // If system is not speaking and we should be listening, start recognition
      else if (!isCurrentlySpeaking() && isListening && !isRecognitionActiveRef.current) {
        // Check if enough time has passed since system spoke
        const currentTime = Date.now();
        const timeSinceSystemSpoke = currentTime - systemSpeakingTimestampRef.current;
        if (timeSinceSystemSpoke > recognitionBufferTimeMs) {
          console.log("System not speaking for sufficient time, can start recognition");
          startRecognition();
        }
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
        <div className="flex items-center mb-2">
          <p className="text-lg text-blue-800">{prompt}</p>
          <button 
            onClick={() => {
              if (prompt && 'speechSynthesis' in window) {
                // Stop any active recognition
                stopRecognition();
                // Update timestamp to prevent self-triggering
                systemSpeakingTimestampRef.current = Date.now();
                
                cancelSpeech(); // Cancel any ongoing speech
                
                const utterance = new SpeechSynthesisUtterance(prompt);
                utterance.lang = 'tr-TR';
                utterance.onstart = () => {
                  // Update timestamp when speech starts
                  systemSpeakingTimestampRef.current = Date.now();
                };
                utterance.onend = () => {
                  // Update timestamp when speech ends
                  systemSpeakingTimestampRef.current = Date.now();
                  // Re-enable recognition when prompt reading ends
                  if (isListening && !isCurrentlySpeaking()) {
                    setTimeout(() => startRecognition(), recognitionBufferTimeMs);
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
              {processingVoice ? 'İşleniyor...' : isCurrentlySpeaking() ? 'Sistem konuşuyor...' : 'Sizi dinliyorum...'}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <MicOffIcon size={24} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              {isCurrentlySpeaking() ? 'Sistem konuşuyor...' : 'Mikrofon kapalı'}
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
        <div className="mt-2">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {/* Manual input as a fallback */}
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
