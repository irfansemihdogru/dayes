
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
    
    // Cancel any existing speech immediately
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
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
  } else {
    console.warn('No suitable voice found for Turkish');
  }
};

// Ensure speech synthesis is properly terminated between utterances
const ensureSpeechReset = () => {
  // Cancel any ongoing speech
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    // Small pause to ensure clean slate
    return new Promise(resolve => setTimeout(resolve, 50));
  }
  return Promise.resolve();
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

// Cancel current speech but don't clear the queue
export const cancelSpeech = (): void => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  currentUtterance = null;
};

// Process the next item in the speech queue
const processSpeechQueue = async () => {
  if (speechQueue.length === 0 || isSpeaking) return;
  
  isSpeaking = true;
  const item = speechQueue.shift();
  if (!item) {
    isSpeaking = false;
    return;
  }
  
  // Make sure any previous speech is completely stopped
  await ensureSpeechReset();
  
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
      try {
        item.options.onStart();
      } catch (e) {
        console.error('Error in onStart callback:', e);
      }
    };
  }
  
  // Handle completion
  utterance.onend = () => {
    isSpeaking = false;
    currentUtterance = null;
    try {
      if (item.options.onEnd) item.options.onEnd();
    } catch (e) {
      console.error('Error in onEnd callback:', e);
    }
    
    // Process next item with a small delay
    setTimeout(() => processSpeechQueue(), 100);
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    isSpeaking = false;
    currentUtterance = null;
    try {
      if (item.options.onEnd) item.options.onEnd();
    } catch (e) {
      console.error('Error in onEnd callback after speech error:', e);
    }
    setTimeout(() => processSpeechQueue(), 100);
  };
  
  // Fallback for browsers that don't properly fire events
  const estimatedDuration = Math.min((item.text.length * 60) + 1000, 15000); // Cap at 15 seconds max
  setTimeout(() => {
    if (isSpeaking && currentUtterance === utterance) {
      console.log('Speech end event did not fire. Forcing completion.');
      isSpeaking = false;
      currentUtterance = null;
      try {
        if (item.options.onEnd) item.options.onEnd();
      } catch (e) {
        console.error('Error in forced onEnd callback:', e);
      }
      processSpeechQueue();
    }
  }, estimatedDuration + 500); // Add buffer time
  
  // Speak the text
  try {
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error('Error speaking:', e);
    isSpeaking = false;
    currentUtterance = null;
    if (item.options.onEnd) item.options.onEnd();
    setTimeout(() => processSpeechQueue(), 100);
  }
};

// Check if speech synthesis is speaking
export const isCurrentlySpeaking = (): boolean => {
  return isSpeaking || (window.speechSynthesis && window.speechSynthesis.speaking);
};

// Unified speech function that ensures consistent behavior across browsers
export const speakText = (
  text: string, 
  options: {
    onStart?: () => void,
    onEnd?: () => void,
    rate?: number,
    pitch?: number,
    volume?: number,
    immediate?: boolean
  } = {}
): void => {
  if (!('speechSynthesis' in window)) {
    console.error('Speech synthesis not supported');
    options.onEnd?.();
    return;
  }
  
  // For immediate speech, cancel current and clear queue
  if (options.immediate) {
    clearSpeechQueue();
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
  isCurrentlySpeaking,
  cancelSpeech,
  clearSpeechQueue
};
