
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
  const { toast } = useToast();
  const appInitialized = useRef(false);
  
  // Welcome message when app loads
  useEffect(() => {
    if (!appInitialized.current) {
      appInitialized.current = true;
      // Small delay to ensure the app has rendered
      setTimeout(() => {
        if (audioEnabled) {
          speakWelcomeMessage();
        }
      }, 1000);
    }
  }, []);
  
  const speakWelcomeMessage = () => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any previous speech
    window.speechSynthesis.cancel();
    
    const welcomeText = "Okul Veli Yönlendirme Sistemine hoş geldiniz. Lütfen kameraya bakarak yüzünüzün algılanmasını bekleyiniz.";
    const speech = new SpeechSynthesisUtterance(welcomeText);
    speech.lang = 'tr-TR';
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;
    
    window.speechSynthesis.speak(speech);
  };
  
  const speakText = (text: string) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return;
    
    // Cancel any previous speech
    window.speechSynthesis.cancel();
    
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'tr-TR';
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;
    
    window.speechSynthesis.speak(speech);
  };
  
  // Handle face detection to start app
  const handleFaceDetected = () => {
    if (appState === 'face-recognition') {
      setTimeout(() => {
        setAppState('main-menu');
        setIsListening(true);
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
    switch (appState) {
      case 'face-recognition':
        setVoicePrompt('');
        setIsListening(false);
        break;
      case 'main-menu': {
        const prompt = 'Yapmak istediğiniz işlemi söyleyiniz';
        setVoicePrompt(prompt);
        setIsListening(true);
        if (audioEnabled) speakText(prompt);
        break;
      }
      case 'grade-selection': {
        const prompt = 'Öğrenciniz kaçıncı sınıf?';
        setVoicePrompt(prompt);
        setIsListening(true);
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
  }, [appState, audioEnabled]);
  
  const resetApp = () => {
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
    setAudioEnabled(!audioEnabled);
    
    // Notify user about audio state change
    if (!audioEnabled) { // Turning on
      setTimeout(() => {
        speakText('Sesli yönlendirme etkinleştirildi.');
      }, 100);
    } else { // Turning off
      window.speechSynthesis.cancel(); // Stop any ongoing speech
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-4xl mb-8">
        <div className="text-center mb-4 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-blue-800">Okul Veli Yönlendirme Sistemi</h1>
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
            <FaceRecognition onDetected={handleFaceDetected} />
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
              reason={getServiceDisplayName()}
              onTimeout={resetApp}
            />
          )}
        </div>
        
        {/* Show voice recognition UI in states that need it */}
        {(appState === 'main-menu' || appState === 'grade-selection') && isListening && (
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
    </div>
  );
};

export default Index;
