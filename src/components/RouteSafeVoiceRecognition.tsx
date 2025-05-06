import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VoiceRecognition from './VoiceRecognition';
import { isMicrophoneAccessAllowed, forceStopMicrophone } from '@/utils/microphoneAccessControl';

interface RouteSafeVoiceRecognitionProps {
  isListening: boolean;
  onResult: (text: string) => void;
  onListeningEnd?: () => void;
  prompt?: string;
  systemLastSpokeTimestamp?: number;
  bufferTimeMs?: number;
  forceDisable?: boolean;
}

const RouteSafeVoiceRecognition: React.FC<RouteSafeVoiceRecognitionProps> = (props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [micAllowed, setMicAllowed] = useState(false);
  
  // Check microphone access permission whenever the route changes
  useEffect(() => {
    const allowed = isMicrophoneAccessAllowed();
    setMicAllowed(allowed);
    
    if (!allowed) {
      console.log(`Microphone access denied on route: ${location.pathname}`);
      forceStopMicrophone();
    } else {
      console.log(`Microphone access allowed on route: ${location.pathname}`);
    }
    
    // Add Q key listener for disabling microphone
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') {
        console.log('Q key pressed, stopping microphone');
        if (props.onListeningEnd) {
          props.onListeningEnd();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      forceStopMicrophone();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [location.pathname, props.onListeningEnd]);
  
  // If microphone access isn't allowed on this route or is forced disabled, return null
  if (!micAllowed || props.forceDisable) {
    return null;
  }
  
  // Otherwise, render the VoiceRecognition component with its props
  return <VoiceRecognition {...props} />;
};

export default RouteSafeVoiceRecognition;
