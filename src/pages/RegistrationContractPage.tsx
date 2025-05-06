
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { School } from 'lucide-react';
import { Volume2Icon, VolumeXIcon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import RegistrationContract from '@/components/RegistrationContract';
import { cancelSpeech } from '@/utils/speechUtils';

const RegistrationContractPage = () => {
  const navigate = useNavigate();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const { isDarkMode } = useTheme();
  
  const toggleAudio = () => {
    cancelSpeech();
    setAudioEnabled(!audioEnabled);
  };
  
  const handleContractComplete = () => {
    navigate('/registration-form');
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
          <RegistrationContract onComplete={handleContractComplete} />
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

export default RegistrationContractPage;
