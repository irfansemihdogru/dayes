
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
  
  // Initialize speech recognition
  const recognition = useCallback(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setRecognitionSupported(false);
        return null;
      }
      
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'tr-TR'; // Turkish language
      
      return recognitionInstance;
    } catch (err) {
      setRecognitionSupported(false);
      return null;
    }
  }, []);
  
  useEffect(() => {
    const recognitionInstance = recognition();
    
    if (!recognitionInstance) return;
    
    if (isListening) {
      try {
        recognitionInstance.onresult = (event) => {
          const current = event.resultIndex;
          const result = event.results[current];
          const transcriptValue = result[0].transcript;
          
          setTranscript(transcriptValue);
          
          if (result.isFinal) {
            onResult(transcriptValue);
            setTranscript('');
          }
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setError(`Ses tanıma hatası: ${event.error}`);
        };
        
        recognitionInstance.onend = () => {
          if (isListening) {
            recognitionInstance.start(); // Restart if we're still supposed to be listening
          } else if (onListeningEnd) {
            onListeningEnd();
          }
        };
        
        recognitionInstance.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setError('Ses tanıma başlatılamadı');
      }
      
      return () => {
        try {
          recognitionInstance.stop();
        } catch (err) {
          console.error('Error stopping recognition:', err);
        }
      };
    } else if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
      setTranscript('');
    }
  }, [isListening, onListeningEnd, onResult, recognition]);
  
  // For fallback if speech recognition is not supported
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTranscript(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transcript.trim()) {
      onResult(transcript);
      setTranscript('');
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
      
      {!recognitionSupported && (
        <form onSubmit={handleSubmit} className="mt-2 flex">
          <input
            type="text"
            value={transcript}
            onChange={handleInputChange}
            placeholder="Sesli komut simülasyonu için buraya yazın"
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
      )}
    </div>
  );
};

export default VoiceRecognition;
