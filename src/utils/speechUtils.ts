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
  
  // Consistent speech parameters - reduced rate for clarity
  utterance.rate = 0.9;  // Slightly slower than default for better clarity
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

// Process the next item in the speech queue with improved stability
const processSpeechQueue = () => {
  if (speechQueue.length === 0 || isSpeaking) return;
  
  isSpeaking = true;
  const item = speechQueue.shift();
  if (!item) return;
  
  // For longer texts, split into smaller chunks to prevent pauses
  const chunks = splitTextIntoChunks(item.text);
  
  if (chunks.length === 1) {
    // Short text, speak normally
    speakSingleChunk(chunks[0], item.options);
  } else {
    // Longer text, speak in chunks
    speakMultipleChunks(chunks, item.options);
  }
};

// Split longer texts into sentence-based chunks to prevent pauses
const splitTextIntoChunks = (text: string): string[] => {
  // If text is short, no need to split
  if (text.length < 150) return [text];
  
  // Split by sentence endings
  const sentenceRegex = /[.!?]+\s+/g;
  const sentences = text.split(sentenceRegex);
  
  // Create chunks of reasonable length (combining sentences)
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const sentence of sentences) {
    const potentialChunk = currentChunk + sentence + ". ";
    
    if (potentialChunk.length > 100) {
      // Chunk is getting large, save it and start a new one
      chunks.push(currentChunk.trim());
      currentChunk = sentence + ". ";
    } else {
      // Add to current chunk
      currentChunk = potentialChunk;
    }
  }
  
  // Add the last chunk if not empty
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
};

// Speak a single chunk of text
const speakSingleChunk = (text: string, options: any) => {
  const utterance = new SpeechSynthesisUtterance(text);
  forceConsistentVoiceSettings(utterance);
  
  // Store the current utterance for control
  currentUtterance = utterance;
  
  // Apply custom options
  if (options.rate !== undefined) utterance.rate = options.rate;
  if (options.pitch !== undefined) utterance.pitch = options.pitch;
  if (options.volume !== undefined) utterance.volume = options.volume;
  
  // Event handlers
  if (options.onStart) {
    utterance.onstart = () => {
      options.onStart();
    };
  }
  
  // Handle completion
  utterance.onend = () => {
    isSpeaking = false;
    currentUtterance = null;
    if (options.onEnd) options.onEnd();
    setTimeout(() => processSpeechQueue(), 100); // Process next item with a small delay
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    isSpeaking = false;
    currentUtterance = null;
    if (options.onEnd) options.onEnd();
    setTimeout(() => processSpeechQueue(), 100);
  };
  
  // Speak the text
  ensureSpeechReset();
  window.speechSynthesis.speak(utterance);
  
  // Chrome and some browsers can pause synthesis - this keeps it active
  if (window.speechSynthesis && 'chrome' in window) {
    const resumeInterval = setInterval(() => {
      if (!isSpeaking) {
        clearInterval(resumeInterval);
        return;
      }
      
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 1000);
  }
};

// Speak multiple chunks in sequence
const speakMultipleChunks = (chunks: string[], options: any) => {
  let chunkIndex = 0;
  
  const speakNextChunk = () => {
    if (chunkIndex >= chunks.length) {
      // All chunks complete
      isSpeaking = false;
      currentUtterance = null;
      if (options.onEnd) options.onEnd();
      setTimeout(() => processSpeechQueue(), 100);
      return;
    }
    
    const chunk = chunks[chunkIndex];
    chunkIndex++;
    
    const utterance = new SpeechSynthesisUtterance(chunk);
    forceConsistentVoiceSettings(utterance);
    currentUtterance = utterance;
    
    // Apply custom options
    if (options.rate !== undefined) utterance.rate = options.rate;
    if (options.pitch !== undefined) utterance.pitch = options.pitch;
    if (options.volume !== undefined) utterance.volume = options.volume;
    
    // Only call onStart for the first chunk
    if (chunkIndex === 1 && options.onStart) {
      utterance.onstart = () => {
        options.onStart();
      };
    }
    
    utterance.onend = () => {
      // Small pause between chunks for natural speech
      setTimeout(speakNextChunk, 50);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error in chunk:', event);
      speakNextChunk(); // Continue to next chunk even on error
    };
    
    window.speechSynthesis.speak(utterance);
  };
  
  // Start speaking chunks
  speakNextChunk();
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
    if (options.onEnd) options.onEnd();
    return;
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
