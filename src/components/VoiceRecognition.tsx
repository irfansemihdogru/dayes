
import React, { useState, useEffect, useCallback } from 'react';

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
  
  // Initialize speech recognition
  const recognition = useCallback(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('Speech Recognition API is not supported in this browser');
        setRecognitionSupported(false);
        return null;
      }
      
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'tr-TR'; // Turkish language
      
      return recognitionInstance;
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setRecognitionSupported(false);
      return null;
    }
  }, []);
  
  useEffect(() => {
    const recognitionInstance = recognition();
    let restartTimeout: NodeJS.Timeout | null = null;
    
    if (!recognitionInstance) {
      console.log('Recognition not supported, falling back to manual input');
      return;
    }
    
    if (isListening) {
      try {
        recognitionInstance.onresult = (event) => {
          const current = event.resultIndex;
          const result = event.results[current];
          const transcriptValue = result[0].transcript;
          
          console.log('Speech recognition result:', transcriptValue);
          setTranscript(transcriptValue);
          
          if (result.isFinal) {
            onResult(transcriptValue);
            setTranscript('');
          }
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setError(`Ses tanıma hatası: ${event.error}`);
          
          // Attempt to restart recognition after error
          if (restartTimeout) clearTimeout(restartTimeout);
          restartTimeout = setTimeout(() => {
            try {
              recognitionInstance.stop();
              setTimeout(() => {
                if (isListening) recognitionInstance.start();
              }, 500);
            } catch (e) {
              console.error('Failed to restart after error:', e);
            }
          }, 1000);
        };
        
        recognitionInstance.onend = () => {
          console.log('Speech recognition session ended');
          if (isListening) {
            // Restart if we're still supposed to be listening
            try {
              setTimeout(() => {
                recognitionInstance.start();
                console.log('Restarted speech recognition');
              }, 500);
            } catch (err) {
              console.error('Failed to restart speech recognition:', err);
              setError('Ses tanıma yeniden başlatılamadı');
            }
          } else if (onListeningEnd) {
            onListeningEnd();
          }
        };
        
        try {
          recognitionInstance.start();
          console.log('Started speech recognition');
        } catch (startErr) {
          console.error('Failed to start speech recognition:', startErr);
          setError('Ses tanıma başlatılamadı');
        }
      } catch (err) {
        console.error('Error setting up speech recognition:', err);
        setError('Ses tanıma ayarlanamadı');
      }
      
      return () => {
        try {
          recognitionInstance.stop();
          console.log('Stopped speech recognition');
          if (restartTimeout) clearTimeout(restartTimeout);
        } catch (err) {
          console.error('Error stopping recognition:', err);
        }
      };
    } else if (recognitionInstance) {
      try {
        recognitionInstance.stop();
        console.log('Stopped speech recognition');
        if (restartTimeout) clearTimeout(restartTimeout);
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
      setTranscript('');
    }
  }, [isListening, onListeningEnd, onResult, recognition]);
  
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
      {prompt && <p className="text-lg text-blue-800 mb-2">{prompt}</p>}
      
      <div className="flex items-center">
        <div className={`w-4 h-4 rounded-full mr-2 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
        <span className="text-sm text-gray-600">
          {isListening ? 'Dinleniyor...' : 'Dinleme beklemede'}
        </span>
      </div>
      
      {transcript && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-gray-700">{transcript}</p>
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
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
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 transition-colors"
          disabled={!isListening}
        >
          Gönder
        </button>
      </form>
    </div>
  );
};

export default VoiceRecognition;
