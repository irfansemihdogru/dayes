
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
  
  // First try to find a Turkish voice with more specific matching for better accuracy
  let turkishVoice = availableVoices.find(voice => 
    voice.lang === 'tr-TR' || 
    voice.name.toLowerCase().includes('türk') ||
    voice.name.toLowerCase().includes('turkish')
  );
  
  // If no exact match, try more lenient matching
  if (!turkishVoice) {
    turkishVoice = availableVoices.find(voice => 
      voice.lang.toLowerCase().includes('tr')
    );
  }
  
  // If still no voice found, use the first available voice
  if (!turkishVoice && availableVoices.length > 0) {
    console.warn('No Turkish voice found, using default voice');
    turkishVoice = availableVoices[0];
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
    
    // Handle browser-specific voice loading behavior
    const loadVoices = () => {
      availableVoices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      
      // Log available voices for debugging
      console.log('Available voices loaded:', availableVoices.length);
      console.log('Turkish voices:', availableVoices.filter(v => 
        v.lang === 'tr-TR' || 
        v.lang.includes('tr') || 
        v.name.toLowerCase().includes('türk') || 
        v.name.toLowerCase().includes('turkish')
      ).map(v => `${v.name} (${v.lang})`));
      
      resolve();
    };
    
    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
      // For browsers that load voices synchronously (like Firefox)
      setTimeout(loadVoices, 100);
    }
    
    // Force a getVoices call to trigger loading
    window.speechSynthesis.getVoices();
  });
};

// Force browser to use same voice settings across platforms
const forceConsistentVoiceSettings = (utterance: SpeechSynthesisUtterance): void => {
  // Always set Turkish language
  utterance.lang = 'tr-TR';
  
  // Consistent speech parameters
  utterance.rate = 0.95; // Slightly slower than default for better clarity
  utterance.pitch = 1;   // Normal pitch
  utterance.volume = 1;  // Full volume
  
  // Try to use a Turkish voice if available
  const turkishVoice = getBestTurkishVoice();
  if (turkishVoice) {
    utterance.voice = turkishVoice;
    console.log(`Using voice: ${turkishVoice.name} (${turkishVoice.lang})`);
  } else {
    console.warn('No suitable voice found for Turkish');
  }
};

// Ensure speech synthesis is properly terminated between utterances
const ensureSpeechReset = () => {
  // Cancel any ongoing speech
  try {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      // Small pause to ensure clean slate
      setTimeout(() => {}, 50);
    }
  } catch (err) {
    console.error('Error resetting speech synthesis:', err);
  }
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
    options.onEnd?.();
    return;
  }
  
  // Ensure clean state before starting
  ensureSpeechReset();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Apply consistent voice settings
  forceConsistentVoiceSettings(utterance);
  
  // Override with any custom options
  if (options.rate !== undefined) utterance.rate = options.rate;
  if (options.pitch !== undefined) utterance.pitch = options.pitch;
  if (options.volume !== undefined) utterance.volume = options.volume;
  
  // Set event handlers
  if (options.onStart) {
    utterance.onstart = options.onStart;
  }
  
  // More reliable end event handling
  if (options.onEnd) {
    // Multiple event handlers to ensure onEnd is called
    utterance.onend = options.onEnd;
    utterance.onerror = () => {
      console.error('Speech synthesis error');
      options.onEnd?.();
    };
    
    // Safari and some mobile browsers sometimes don't fire onend events correctly
    // So we set a timeout as a fallback
    const estimatedDuration = (text.length * 60) + 1000; // ~60ms per character + buffer
    setTimeout(() => {
      // Only call onEnd if speech synthesis is not currently speaking
      // This prevents the callback from being called twice
      if (!window.speechSynthesis.speaking) {
        options.onEnd?.();
      }
    }, estimatedDuration);
  }
  
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
  }, 2000); // Check more frequently (2s instead of 5s)
};

// Initialize immediately
initSpeechSynthesis();

export default {
  speakText,
  initSpeechSynthesis,
  getBestTurkishVoice
};
