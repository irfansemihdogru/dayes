
import React, { useEffect, useState } from 'react';
import FaceRecognition from '@/components/FaceRecognition';
import MainMenu from '@/components/MainMenu';
import GradeSelection from '@/components/GradeSelection';
import AttendanceForm from '@/components/AttendanceForm';
import AttendanceResult from '@/components/AttendanceResult';
import StaffDirectionResult from '@/components/StaffDirectionResult';
import VoiceRecognition from '@/components/VoiceRecognition';
import { processVoiceCommand } from '@/utils/geminiApi';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
  // Handle face detection to start app
  const handleFaceDetected = () => {
    if (appState === 'face-recognition') {
      setTimeout(() => {
        setAppState('main-menu');
        setIsListening(true);
        setVoicePrompt('Yapmak istediğiniz işlemi söyleyiniz');
      }, 1500);
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
      case 'main-menu':
        setVoicePrompt('Yapmak istediğiniz işlemi söyleyiniz');
        setIsListening(true);
        break;
      case 'grade-selection':
        setVoicePrompt('Öğrenciniz kaçıncı sınıf?');
        setIsListening(true);
        break;
      case 'attendance-form':
        // Voice recognition handled in the form
        setIsListening(false);
        break;
      case 'attendance-result':
      case 'staff-direction':
        setIsListening(false);
        break;
    }
  }, [appState]);
  
  const resetApp = () => {
    setAppState('face-recognition');
    setSelectedService('');
    setSelectedGrade(null);
    setStudentName('');
    setDirectedStaff('');
    setIsListening(false);
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
      const result = await processVoiceCommand(text);
      
      toast({
        title: "Ses komutu algılandı",
        description: text,
        duration: 3000
      });
      
      console.log("Gemini API result:", result);
      
      if (appState === 'main-menu') {
        // Handle service selection based on voice
        if (result.intent) {
          if (['mesem', 'usta-ogreticilik-belgesi', 'diploma', 'disiplin', 'ogrenci-alma-izni', '9-sinif-kayit', 'devamsizlik'].includes(result.intent)) {
            handleServiceSelection(result.intent);
          }
        }
      } else if (appState === 'grade-selection' && result.grade) {
        // Handle grade selection
        const grade = parseInt(result.grade);
        if ([9, 10, 11, 12].includes(grade)) {
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
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-4xl mb-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-blue-800">Okul Veli Yönlendirme Sistemi</h1>
        </div>
        
        <div className="transition-all duration-500 fade-in">
          {appState === 'face-recognition' && (
            <FaceRecognition onDetected={handleFaceDetected} />
          )}
          
          {appState === 'main-menu' && (
            <>
              <MainMenu onSelection={handleServiceSelection} />
              {isListening && (
                <VoiceRecognition 
                  isListening={isListening} 
                  onResult={handleVoiceResult}
                  prompt={voicePrompt}
                />
              )}
            </>
          )}
          
          {appState === 'grade-selection' && (
            <>
              <GradeSelection onSelection={handleGradeSelection} />
              {isListening && (
                <VoiceRecognition 
                  isListening={isListening} 
                  onResult={handleVoiceResult}
                  prompt={voicePrompt}
                />
              )}
            </>
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
      </div>
      
      <p className="text-gray-600 text-sm mt-4">
        ESC tuşuna basarak sistemi sıfırlayabilirsiniz
      </p>
    </div>
  );
};

export default Index;
