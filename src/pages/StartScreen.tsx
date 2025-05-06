
import React from 'react';
import { useNavigate } from 'react-router-dom';
import StartScreenComponent from '@/components/StartScreen';

const StartScreen: React.FC = () => {
  const navigate = useNavigate();
  
  const handleStart = () => {
    navigate('/face-recognition');
  };
  
  return <StartScreenComponent onStart={handleStart} />;
};

export default StartScreen;
