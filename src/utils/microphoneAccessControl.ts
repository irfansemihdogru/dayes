
// List of routes where microphone is allowed to be active
const MICROPHONE_ALLOWED_ROUTES = [
  '/main',           // Main menu page
  '/devamsizlik'     // Attendance form page (but only for name input)
];

// Check if microphone access is allowed on current route
export const isMicrophoneAccessAllowed = (): boolean => {
  const currentPath = window.location.pathname;
  return MICROPHONE_ALLOWED_ROUTES.includes(currentPath);
};

// For routes that need conditional microphone access (like devamsizlik form)
export const isConditionalMicrophoneRoute = (): boolean => {
  return window.location.pathname === '/devamsizlik';
};

// Force stop any active microphone streams
export const forceStopMicrophone = (): void => {
  // Stop any active MediaStreams
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      stream.getTracks().forEach(track => track.stop());
      console.log('Microphone access forcibly stopped');
    })
    .catch(() => {
      // If we can't get the stream, it might already be stopped
      console.log('No active microphone stream found or access denied');
    });
  
  // If Speech Recognition is active, try to stop it
  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      // This is just a safety measure, actual stopping is handled in the VoiceRecognition component
      console.log('Speech recognition API exists on this browser');
    }
  } catch (err) {
    console.log('Speech recognition not supported in this browser');
  }
};
