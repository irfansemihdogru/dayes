
/**
 * Speech synthesis utilities to ensure consistent voice output across devices and browsers
 */

// Tracks if voices have been loaded
let voicesLoaded = false;
let availableVoices: SpeechSynthesisVoice[] = [];

// Try to find the best Turkish voice available
export const getBestTurkishVoice = (): SpeechSynthesisVoice | null => {
  if (!voicesLoaded) {
    availableVoices = window.speechSynthesis.getVoices();
    voicesLoaded = true;
  }
  
  // First try to find a Turkish voice
  let turkishVoice = availableVoices.find(voice => 
    voice.lang.toLowerCase().includes('tr-tr') || 
    voice.name.toLowerCase().includes('türk') ||
    voice.name.toLowerCase().includes('turkish')
  );
  
  // If no Turkish voice is found, try to find any voice that supports Turkish
  if (!turkishVoice) {
    turkishVoice = availableVoices.find(voice => 
      voice.lang.toLowerCase().includes('tr')
    );
  }
  
  return turkishVoice || null;
};

// Initialize speech synthesis and preload voices
export const initSpeechSynthesis = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis is not supported in this browser');
      resolve();
      return;
    }
    
    // Some browsers (like Chrome) load voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        availableVoices = window.speechSynthesis.getVoices();
        voicesLoaded = true;
        resolve();
      };
    } else {
      // For browsers that load voices synchronously
      availableVoices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      resolve();
    }
    
    // Force a getVoices call to trigger loading
    window.speechSynthesis.getVoices();
  });
};

// Unified speech function that ensures consistent behavior across browsers
export const speakText = (
  text: string, 
  options: {
    onStart?: () => void,
    onEnd?: () => void,
    rate?: number,
    pitch?: number,
    volume?: number
  } = {}
): void => {
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported');
    return;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'tr-TR';
  utterance.rate = options.rate || 0.95;
  utterance.pitch = options.pitch || 1;
  utterance.volume = options.volume || 1;
  
  // Try to use a Turkish voice if available
  const turkishVoice = getBestTurkishVoice();
  if (turkishVoice) {
    utterance.voice = turkishVoice;
  }
  
  // Set event handlers
  if (options.onStart) {
    utterance.onstart = options.onStart;
  }
  
  if (options.onEnd) {
    utterance.onend = options.onEnd;
    
    // Safari sometimes doesn't fire onend events correctly
    // So we set a timeout as a fallback
    const estimatedDuration = (text.length * 50) + 1000; // ~50ms per character + buffer
    setTimeout(() => {
      options.onEnd?.();
    }, estimatedDuration);
  }
  
  // Handle errors
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    options.onEnd?.();
  };
  
  // Speak the text
  window.speechSynthesis.speak(utterance);
  
  // Workaround for Chrome bug where speech stops after ~15 seconds
  const resumeInfinity = setInterval(() => {
    if (!window.speechSynthesis.speaking) {
      clearInterval(resumeInfinity);
      return;
    }
    
    // Resume if paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }, 5000);
};

// Initialize immediately
initSpeechSynthesis();

export default {
  speakText,
  initSpeechSynthesis,
  getBestTurkishVoice
};
