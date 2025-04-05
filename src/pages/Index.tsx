
import React, { useEffect, useState, useRef } from 'react';
import FaceRecognition from '@/components/FaceRecognition';
import MainMenu from '@/components/MainMenu';
import GradeSelection from '@/components/GradeSelection';
import AttendanceForm from '@/components/AttendanceForm';
import AttendanceResult from '@/components/AttendanceResult';
import StaffDirectionResult from '@/components/StaffDirectionResult';
import VoiceRecognition from '@/components/VoiceRecognition';
import { processVoiceCommand } from '@/utils/geminiApi';
import { useToast } from '@/hooks/use-toast';
import { Volume2Icon, VolumeXIcon } from 'lucide-react';

type AppState = 
  | 'face-recognition'
  | 'main-menu'
  | 'grade-selection'
  | 'attendance-form'
  | 'attendance-result'
  | 'staff-direction';

interface StaffMapping {
  [key: string]: string;
}

// Room information mapping
interface StaffRoomInfo {
  name: string;
  floor: number;
  location: string;
  roomNumber: number;
}

const staffInfo: Record<string, StaffRoomInfo> = {
  'YENER HANCI': { name: 'YENER HANCI', floor: 2, location: 'sol', roomNumber: 24 },
  'ERDEM ÜÇER': { name: 'ERDEM ÜÇER', floor: 2, location: 'sağ', roomNumber: 15 },
  'FEHMİ OKŞAK': { name: 'FEHMİ OKŞAK', floor: 3, location: 'sol', roomNumber: 32 },
  'ÖZLEM KOTANOĞLU': { name: 'ÖZLEM KOTANOĞLU', floor: 1, location: 'koridor sonunda', roomNumber: 8 },
  'ASUMAN ÖZŞİMŞEKLER': { name: 'ASUMAN ÖZŞİMŞEKLER', floor: 2, location: 'merdiven karşısı', roomNumber: 22 },
  'OKAN KARAHAN': { name: 'OKAN KARAHAN', floor: 1, location: 'giriş kapısı yanında', roomNumber: 5 },
};

const gradeToStaff: StaffMapping = {
  '9': 'ERDEM ÜÇER',
  '10': 'FEHMİ OKŞAK',
  '11': 'ÖZLEM KOTANOĞLU',
  '12': 'ASUMAN ÖZŞİMŞEKLER',
};

const serviceToStaff: StaffMapping = {
  'mesem': 'YENER HANCI',
  'usta-ogreticilik-belgesi': 'YENER HANCI',
  'diploma': 'YENER HANCI',
  'disiplin': 'OKAN KARAHAN', // Direct all discipline issues to OKAN KARAHAN
  '9-sinif-kayit': 'ERDEM ÜÇER',
};

const Index = () => {
  const [appState, setAppState] = useState<AppState>('face-recognition');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [studentName, setStudentName] = useState<string>('');
  const [directedStaff, setDirectedStaff] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [welcomeMessagePlaying, setWelcomeMessagePlaying] = useState(false);
  const { toast } = useToast();
  const appInitialized = useRef(false);
  const isSpeakingRef = useRef(false);
  
  // Helper function to check if speech synthesis is speaking
  const isSpeaking = () => {
    return window.speechSynthesis && window.speechSynthesis.speaking;
  };
  
  // Welcome message when app loads
  useEffect(() => {
    if (!appInitialized.current) {
      appInitialized.current = true;
      // Small delay to ensure the app has rendered
      setTimeout(() => {
        if (audioEnabled) {
          setWelcomeMessagePlaying(true);
          speakWelcomeMessage();
        }
      }, 1000);
    }
  }, [audioEnabled]);
  
  const speakWelcomeMessage = () => {
    if (!('speechSynthesis' in window)) {
      setWelcomeMessagePlaying(false);
      return;
    }
    
    // Cancel any previous speech
    window.speechSynthesis.cancel();
    
    const welcomeText = "Yıldırım Mesleki ve Teknik Anadolu Lisesi Veli Yönlendirme Sistemine hoş geldiniz. Lütfen kameraya bakarak yüzünüzün algılanmasını bekleyiniz.";
    const speech = new SpeechSynthesisUtterance(welcomeText);
    speech.lang = 'tr-TR';
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;
    
    // Set speaking state
    isSpeakingRef.current = true;
    
    // When speech ends, mark welcome message as complete
    speech.onend = () => {
      console.log('Welcome message finished playing');
      setWelcomeMessagePlaying(false);
      isSpeakingRef.current = false;
    };
    
    // Fallback in case onend doesn't trigger
    speech.onerror = () => {
      console.log('Welcome message error or interrupted');
      setWelcomeMessagePlaying(false);
      isSpeakingRef.current = false;
    };
    
    // Estimate speech duration for fallback timer
    const estimatedDuration = welcomeText.length * 50; // ~50ms per character
    setTimeout(() => {
      setWelcomeMessagePlaying(false);
      isSpeakingRef.current = false;
    }, estimatedDuration + 1000);
    
    window.speechSynthesis.speak(speech);
  };
  
  const speakText = (text: string) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    
    // Disable microphone while speaking
    setIsListening(false);
    isSpeakingRef.current = true;
    
    // Cancel any previous speech
    window.speechSynthesis.cancel();
    
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'tr-TR';
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;
    
    // Re-enable microphone when speech ends
    speech.onend = () => {
      isSpeakingRef.current = false;
      if (appState === 'main-menu' || appState === 'grade-selection') {
        setTimeout(() => setIsListening(true), 300);
      }
    };
    
    speech.onerror = () => {
      isSpeakingRef.current = false;
      if (appState === 'main-menu' || appState === 'grade-selection') {
        setTimeout(() => setIsListening(true), 300);
      }
    };
    
    // Fallback in case onend doesn't trigger
    const estimatedDuration = text.length * 50; // ~50ms per character
    setTimeout(() => {
      isSpeakingRef.current = false;
      if (appState === 'main-menu' || appState === 'grade-selection') {
        setIsListening(true);
      }
    }, estimatedDuration + 1000); // Add a small buffer
    
    window.speechSynthesis.speak(speech);
  };
  
  // Handle face detection to start app
  const handleFaceDetected = () => {
    if (appState === 'face-recognition') {
      setTimeout(() => {
        setAppState('main-menu');
        
        // Only start listening if not currently speaking
        if (!isSpeaking()) {
          setIsListening(true);
        }
        
        const prompt = 'Yapmak istediğiniz işlemi söyleyiniz';
        setVoicePrompt(prompt);
        speakText(prompt);
      }, 1000);
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        resetApp();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Set appropriate voice prompts based on app state
  useEffect(() => {
    // Don't update voice prompts during transitions
    const transitionDelay = setTimeout(() => {
      switch (appState) {
        case 'face-recognition':
          setVoicePrompt('');
          setIsListening(false);
          break;
        case 'main-menu': {
          const prompt = 'Yapmak istediğiniz işlemi söyleyiniz';
          setVoicePrompt(prompt);
          // Only start listening if not speaking
          if (!isSpeaking()) {
            setTimeout(() => setIsListening(true), 300);
          }
          if (audioEnabled) speakText(prompt);
          break;
        }
        case 'grade-selection': {
          const prompt = 'Öğrenciniz kaçıncı sınıf?';
          setVoicePrompt(prompt);
          // Only start listening if not speaking
          if (!isSpeaking()) {
            setTimeout(() => setIsListening(true), 300);
          }
          if (audioEnabled) speakText(prompt);
          break;
        }
        case 'attendance-form':
          // Voice recognition handled in the form
          setIsListening(false);
          break;
        case 'attendance-result':
        case 'staff-direction':
          setIsListening(false);
          break;
      }
    }, 300); // Small delay to allow for transitions
    
    return () => clearTimeout(transitionDelay);
  }, [appState, audioEnabled]);
  
  const resetApp = () => {
    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
    
    setAppState('face-recognition');
    setSelectedService('');
    setSelectedGrade(null);
    setStudentName('');
    setDirectedStaff('');
    setIsListening(false);
    
    // Speak reset message
    if (audioEnabled) {
      speakText('Sistem sıfırlandı. Yüz tanıma başlatılıyor.');
    }
  };
  
  const handleServiceSelection = (service: string) => {
    setSelectedService(service);
    
    if (service === 'devamsizlik') {
      setAppState('attendance-form');
      return;
    }
    
    // Direct discipline issues to OKAN KARAHAN without asking for grade
    if (service === 'disiplin') {
      setDirectedStaff('OKAN KARAHAN');
      setAppState('staff-direction');
      return;
    }
    
    if (serviceToStaff[service]) {
      setDirectedStaff(serviceToStaff[service]);
      setAppState('staff-direction');
      return;
    }
    
    setAppState('grade-selection');
  };
  
  const handleGradeSelection = (grade: number) => {
    setSelectedGrade(grade);
    
    const staff = gradeToStaff[grade.toString()];
    if (staff) {
      setDirectedStaff(staff);
      setAppState('staff-direction');
    }
  };
  
  const handleAttendanceFormSubmit = (name: string, grade: number) => {
    setStudentName(name);
    setSelectedGrade(grade);
    setAppState('attendance-result');
  };
  
  const handleVoiceResult = async (text: string) => {
    try {
      // Visual feedback that voice is being processed
      toast({
        title: "Ses komutu işleniyor",
        description: text,
        duration: 2000
      });
      
      const result = await processVoiceCommand(text);
      
      console.log("Gemini API result:", result);
      
      if (appState === 'main-menu') {
        // Handle service selection based on voice
        if (result.intent) {
          if (['mesem', 'usta-ogreticilik-belgesi', 'diploma', 'disiplin', 'ogrenci-alma-izni', '9-sinif-kayit', 'devamsizlik'].includes(result.intent)) {
            toast({
              title: "Seçim algılandı",
              description: `İşlem: ${result.intent}`,
              duration: 2000
            });
            handleServiceSelection(result.intent);
          }
        }
      } else if (appState === 'grade-selection' && result.grade) {
        // Handle grade selection
        const grade = parseInt(result.grade);
        if ([9, 10, 11, 12].includes(grade)) {
          toast({
            title: "Sınıf algılandı",
            description: `${grade}. Sınıf`,
            duration: 2000
          });
          handleGradeSelection(grade);
        }
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      toast({
        title: "Hata",
        description: "Ses komutunuz işlenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };
  
  const getServiceDisplayName = () => {
    const serviceMap: Record<string, string> = {
      'mesem': 'Mesem',
      'usta-ogreticilik-belgesi': 'Usta Öğreticilik Belgesi',
      'diploma': 'Diploma',
      'disiplin': 'Disiplin',
      'ogrenci-alma-izni': 'Öğrenciyi Okuldan Alma İzni',
      '9-sinif-kayit': '9.sınıf Kayıt Yönlendirme',
      'devamsizlik': 'Devamsızlık',
    };
    
    return serviceMap[selectedService] || selectedService;
  };
  
  const toggleAudio = () => {
    // Stop any ongoing speech when turning off audio
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
    }
    
    setAudioEnabled(!audioEnabled);
    
    // Notify user about audio state change
    if (!audioEnabled) { // Turning on
      setTimeout(() => {
        speakText('Sesli yönlendirme etkinleştirildi.');
      }, 300);
    }
  };
  
  const getStaffRoomInfo = (staffName: string): StaffRoomInfo => {
    return staffInfo[staffName] || { 
      name: staffName, 
      floor: 1, 
      location: 'karşıda', 
      roomNumber: 1
    };
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-5xl mb-8">
        <div className="text-center mb-4 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-blue-800">Yıldırım Mesleki ve Teknik Anadolu Lisesi</h1>
          <button
            onClick={toggleAudio}
            className="ml-3 p-2 bg-white rounded-full shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={audioEnabled ? "Sesli yönlendirmeyi kapat" : "Sesli yönlendirmeyi aç"}
          >
            {audioEnabled ? 
              <Volume2Icon size={20} className="text-blue-700" /> :
              <VolumeXIcon size={20} className="text-gray-500" />
            }
          </button>
        </div>
        
        <div className="transition-all duration-500 fade-in">
          {appState === 'face-recognition' && (
            <FaceRecognition 
              onDetected={handleFaceDetected}
              isWelcomeMessagePlaying={welcomeMessagePlaying}
            />
          )}
          
          {appState === 'main-menu' && (
            <MainMenu onSelection={handleServiceSelection} />
          )}
          
          {appState === 'grade-selection' && (
            <GradeSelection onSelection={handleGradeSelection} />
          )}
          
          {appState === 'attendance-form' && (
            <AttendanceForm onSubmit={handleAttendanceFormSubmit} />
          )}
          
          {appState === 'attendance-result' && studentName && selectedGrade && (
            <AttendanceResult 
              studentName={studentName}
              grade={selectedGrade}
              onTimeout={resetApp}
            />
          )}
          
          {appState === 'staff-direction' && (
            <StaffDirectionResult 
              staffName={directedStaff}
              staffRoomInfo={getStaffRoomInfo(directedStaff)}
              reason={getServiceDisplayName()}
              onTimeout={resetApp}
            />
          )}
        </div>
        
        {/* Show voice recognition UI in states that need it */}
        {(appState === 'main-menu' || appState === 'grade-selection') && (
          <div className="mt-4">
            <VoiceRecognition 
              isListening={isListening} 
              onResult={handleVoiceResult}
              prompt={voicePrompt}
            />
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-gray-600 text-sm" role="note">
          ESC tuşuna basarak sistemi sıfırlayabilirsiniz
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Bu sistem görme ve işitme engelli kullanıcılar için erişilebilirlik desteklerine sahiptir
        </p>
      </div>
      
      {/* Konuşma/Dinleme Durumu Göstergesi */}
      {isSpeakingRef.current && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg animate-pulse flex items-center">
          <Volume2Icon size={16} className="mr-2" />
          <span>Sistem konuşuyor...</span>
        </div>
      )}
      
      {isListening && !isSpeakingRef.current && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></div>
          <span>Dinleniyor...</span>
        </div>
      )}
    </div>
  );
};

export default Index;
