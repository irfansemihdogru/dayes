/**
 * Speech synthesis utilities to ensure consistent voice output across devices and browsers
 */

// Tracks if voices have been loaded
let voicesLoaded = false;
let availableVoices: SpeechSynthesisVoice[] = [];

// Store the current utterance for better control
let currentUtterance: SpeechSynthesisUtterance | null = null;

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
    
    // Set up page unload handler to stop any ongoing speech when page refreshes
    window.addEventListener('beforeunload', () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    });
    
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
    
    // Ensure speech is canceled on page visibility change (tab switch, etc)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    });
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
    
    // Reset current utterance reference
    currentUtterance = null;
  } catch (err) {
    console.error('Error resetting speech synthesis:', err);
  }
};

// Global queue to prevent speech overlaps
let speechQueue: {text: string, options: any}[] = [];
let isSpeaking = false;

// Clear the speech queue
export const clearSpeechQueue = (): void => {
  speechQueue = [];
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  currentUtterance = null;
};

// Process the next item in the speech queue
const processSpeechQueue = () => {
  if (speechQueue.length === 0 || isSpeaking) return;
  
  isSpeaking = true;
  const item = speechQueue.shift();
  if (!item) return;
  
  const utterance = new SpeechSynthesisUtterance(item.text);
  forceConsistentVoiceSettings(utterance);
  
  // Store the current utterance for control
  currentUtterance = utterance;
  
  // Apply custom options
  if (item.options.rate !== undefined) utterance.rate = item.options.rate;
  if (item.options.pitch !== undefined) utterance.pitch = item.options.pitch;
  if (item.options.volume !== undefined) utterance.volume = item.options.volume;
  
  // Event handlers
  if (item.options.onStart) {
    utterance.onstart = () => {
      item.options.onStart();
    };
  }
  
  // Handle completion
  utterance.onend = () => {
    isSpeaking = false;
    currentUtterance = null;
    if (item.options.onEnd) item.options.onEnd();
    setTimeout(() => processSpeechQueue(), 100); // Process next item with a small delay
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    isSpeaking = false;
    currentUtterance = null;
    if (item.options.onEnd) item.options.onEnd();
    setTimeout(() => processSpeechQueue(), 100);
  };
  
  // Fallback for browsers that don't properly fire events
  const estimatedDuration = Math.min((item.text.length * 60) + 1000, 10000); // Cap at 10 seconds max
  setTimeout(() => {
    if (isSpeaking) {
      isSpeaking = false;
      currentUtterance = null;
      if (item.options.onEnd) item.options.onEnd();
      processSpeechQueue();
    }
  }, estimatedDuration);
  
  // Speak the text
  ensureSpeechReset();
  window.speechSynthesis.speak(utterance);
};

// Modified function to check if speech synthesis is currently speaking
export const isCurrentlySpeaking = (): boolean => {
  if (!('speechSynthesis' in window)) return false;
  return isSpeaking || window.speechSynthesis.speaking || window.speechSynthesis.pending;
};

// Cancel current speech
export const cancelSpeech = (): void => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  currentUtterance = null;
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
  
  // Cancel existing speech to prevent overlaps
  if (isSpeaking || window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    currentUtterance = null;
  }
  
  // Add to queue and process
  speechQueue.push({text, options});
  processSpeechQueue();
};

// Initialize immediately
initSpeechSynthesis();

export default {
  speakText,
  initSpeechSynthesis,
  getBestTurkishVoice,
  isCurrentlySpeaking: isCurrentlySpeaking,
  cancelSpeech,
  clearSpeechQueue
};
