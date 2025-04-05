
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Volume2Icon } from 'lucide-react';

interface AttendanceResultProps {
  studentName: string;
  grade: number;
  onTimeout: () => void;
}

interface AttendanceRecord {
  date: string;
  status: 'Özürlü' | 'Özürsüz';
  days: number;
}

// Mock data generator
const generateMockAttendanceData = (count: number): AttendanceRecord[] => {
  const statuses: ('Özürlü' | 'Özürsüz')[] = ['Özürlü', 'Özürsüz'];
  const result: AttendanceRecord[] = [];
  
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - Math.floor(Math.random() * 90)); // Random date within last 90 days
    
    result.push({
      date: date.toLocaleDateString('tr-TR'),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      days: Math.floor(Math.random() * 5) + 1, // 1-5 days
    });
  }
  
  // Sort by date (newest first)
  return result.sort((a, b) => {
    const dateA = new Date(a.date.split('.').reverse().join('-'));
    const dateB = new Date(b.date.split('.').reverse().join('-'));
    return dateB.getTime() - dateA.getTime();
  });
};

const AttendanceResult: React.FC<AttendanceResultProps> = ({ studentName, grade, onTimeout }) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [hasReadInfo, setHasReadInfo] = useState(false);
  const speakTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Generate mock data
    setAttendanceData(generateMockAttendanceData(8));
    
    // No timeout here - we'll return after speaking or manual interaction
    return () => {
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
      }
      
      // Make sure speech stops when component unmounts
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [onTimeout]);
  
  // Calculate totals
  const totalExcused = attendanceData.filter(record => record.status === 'Özürlü')
    .reduce((sum, record) => sum + record.days, 0);
    
  const totalUnexcused = attendanceData.filter(record => record.status === 'Özürsüz')
    .reduce((sum, record) => sum + record.days, 0);
  
  const speakAttendanceInfo = () => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel any previous speech
    window.speechSynthesis.cancel();
    
    // Prepare text to speak
    const textToSpeak = `${studentName}, ${grade}. sınıf öğrencisinin devamsızlık bilgileri: Toplam ${totalExcused} gün özürlü, ${totalUnexcused} gün özürsüz devamsızlık yapmıştır.`;
    
    const speech = new SpeechSynthesisUtterance(textToSpeak);
    speech.lang = 'tr-TR';
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;
    
    speech.onend = () => {
      setHasReadInfo(true);
      // Return to main screen after reading is complete
      speakTimeoutRef.current = setTimeout(() => {
        onTimeout();
      }, 3000); // Wait 3 seconds after speech ends before returning
    };
    
    // Estimate speech duration for fallback timer (if onend doesn't trigger)
    const estimatedDuration = textToSpeak.length * 70; // ~70ms per character in Turkish
    speakTimeoutRef.current = setTimeout(() => {
      setHasReadInfo(true);
      onTimeout();
    }, estimatedDuration + 5000); // Add extra buffer
    
    window.speechSynthesis.speak(speech);
  };
  
  // Auto-read information when component mounts
  useEffect(() => {
    if (attendanceData.length > 0 && !hasReadInfo) {
      // Small delay to ensure the component is rendered before speaking
      setTimeout(() => {
        speakAttendanceInfo();
      }, 500);
    }
  }, [attendanceData]);
  
  return (
    <Card className="w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-sm shadow-lg">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg text-center">
        <CardTitle className="text-2xl text-center">
          {studentName} - {grade}. Sınıf Devamsızlık Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="rounded-md border mb-4 overflow-x-auto" role="region" aria-label="Devamsızlık tablosu">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50">
                <TableHead className="w-[180px]">Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Gün Sayısı</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>
                    <span 
                      className={`px-2 py-1 rounded text-sm ${
                        record.status === 'Özürlü' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {record.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{record.days} gün</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-center p-3 bg-white rounded-md shadow-sm">
            <p className="text-sm text-gray-600">Toplam Özürlü</p>
            <p className="text-2xl font-bold text-blue-800">{totalExcused} gün</p>
          </div>
          <div className="text-center p-3 bg-white rounded-md shadow-sm">
            <p className="text-sm text-gray-600">Toplam Özürsüz</p>
            <p className="text-2xl font-bold text-red-600">{totalUnexcused} gün</p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button 
            onClick={speakAttendanceInfo}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform"
            aria-label="Devamsızlık bilgilerini sesli dinle"
          >
            <Volume2Icon size={20} />
            Bilgileri Sesli Dinle
          </button>
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600" aria-live="polite">
          <p>İşlem tamamlandıktan sonra otomatik olarak ana ekrana dönülecektir.</p>
          <p>Çıkmak için ESC tuşuna basabilirsiniz.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceResult;
