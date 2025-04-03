
import React, { useState, useEffect } from 'react';

interface VoiceRecognitionProps {
  isListening: boolean;
  onResult: (text: string) => void;
  onListeningEnd?: () => void;
  prompt?: string;
}

const VoiceRecognition: React.FC<VoiceRecognitionProps> = ({ 
  isListening, 
  onResult, 
  onListeningEnd,
  prompt 
}) => {
  const [transcript, setTranscript] = useState('');
  
  useEffect(() => {
    if (!isListening) {
      setTranscript('');
      return;
    }
    
    // This is a simulated speech recognition as browser API requires HTTPS
    // In a real app, we would use the Web Speech API or a similar library
    let timer: NodeJS.Timeout;
    
    timer = setTimeout(() => {
      // Simulate recognition end
      onListeningEnd && onListeningEnd();
    }, 5000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [isListening, onListeningEnd, onResult]);
  
  // For demo purposes, let the user input text manually
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
        <span className="text-sm text-gray-600">{isListening ? 'Dinleniyor...' : 'Dinleme beklemede'}</span>
      </div>
      
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
    </div>
  );
};

export default VoiceRecognition;
