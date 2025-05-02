
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTheme } from '@/context/ThemeContext';
import { speakText } from '@/utils/speechUtils';

interface AbsenceItem {
  date: string;
  type: 'Özürlü' | 'Özürsüz';
  reason?: string;
}

interface DevamsizlikTableProps {
  name: string;
  surname: string;
  onTimeout: () => void;
}

// Generate random dates within the current school year
const generateRandomDates = (count: number): string[] => {
  const dates: string[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const schoolStartMonth = 8; // September
  
  let year = currentDate.getMonth() >= schoolStartMonth ? currentYear : currentYear - 1;
  
  for (let i = 0; i < count; i++) {
    const month = Math.floor(Math.random() * 9) + schoolStartMonth;
    const adjustedMonth = month > 12 ? month - 12 : month;
    const adjustedYear = month > 12 ? year + 1 : year;
    
    // Generate day between 1-28 to avoid invalid dates
    const day = Math.floor(Math.random() * 28) + 1;
    
    const formattedMonth = adjustedMonth.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    
    dates.push(`${formattedDay}.${formattedMonth}.${adjustedYear}`);
  }
  
  // Sort dates chronologically
  return dates.sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('.').map(Number);
    const [dayB, monthB, yearB] = b.split('.').map(Number);
    
    if (yearA !== yearB) return yearA - yearB;
    if (monthA !== monthB) return monthA - monthB;
    return dayA - dayB;
  });
};

// Generate random absence reasons
const generateRandomReason = (): string => {
  const reasons = [
    'Sağlık raporu',
    'Aile izni',
    'Sportif faaliyet',
    'Okul gezisi',
    'Hastalık',
    'Veli izni',
    'Sağlık kontrolü'
  ];
  
  return reasons[Math.floor(Math.random() * reasons.length)];
};

const DevamsizlikTable: React.FC<DevamsizlikTableProps> = ({ name, surname, onTimeout }) => {
  const [absenceData, setAbsenceData] = useState<AbsenceItem[]>([]);
  const [excusedCount, setExcusedCount] = useState(0);
  const [unexcusedCount, setUnexcusedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const { isDarkMode } = useTheme();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Generate random absence data
    const excusedCount = Math.floor(Math.random() * 10) + 3; // 3-12 excused absences
    const unexcusedCount = Math.floor(Math.random() * 12); // 0-11 unexcused absences
    
    // Generate dates for both types
    const excusedDates = generateRandomDates(excusedCount);
    const unexcusedDates = generateRandomDates(unexcusedCount);
    
    // Create absence items
    const excusedItems: AbsenceItem[] = excusedDates.map(date => ({
      date,
      type: 'Özürlü',
      reason: generateRandomReason()
    }));
    
    const unexcusedItems: AbsenceItem[] = unexcusedDates.map(date => ({
      date,
      type: 'Özürsüz'
    }));
    
    // Combine and set data
    setAbsenceData([...excusedItems, ...unexcusedItems].sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('.').map(Number);
      const [dayB, monthB, yearB] = b.date.split('.').map(Number);
      
      if (yearA !== yearB) return yearA - yearB;
      if (monthA !== monthB) return monthA - monthB;
      return dayA - dayB;
    }));
    
    setExcusedCount(excusedCount);
    setUnexcusedCount(unexcusedCount);
    
    // Read the absence information out loud
    setTimeout(() => {
      const message = `${name} ${surname} öğrencisinin ${excusedCount} gün özürlü, ${unexcusedCount} gün özürsüz devamsızlığı bulunmaktadır.`;
      speakText(message);
    }, 1000);
    
    // Set timeout to return to main menu after 30 seconds
    timerRef.current = setTimeout(() => {
      onTimeout();
    }, 30000);
    
    // Start the countdown
    countdownRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [name, surname, onTimeout]);
  
  return (
    <Card className={`w-full mx-auto max-w-4xl ${isDarkMode ? 'bg-gray-800/90 dark:border-gray-700' : 'bg-white/90'} backdrop-blur-sm shadow-lg`}>
      <CardHeader className={`${isDarkMode ? 'bg-blue-800 border-blue-700' : 'bg-blue-600'} text-white rounded-t-lg`}>
        <CardTitle className="text-2xl text-center">{name} {surname} - Devamsızlık Bilgileri</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className={`p-4 ${isDarkMode ? 'bg-blue-900/40 text-blue-100' : 'bg-blue-50 text-blue-800'}`}>
              <p className="text-lg font-semibold">Özürlü Devamsızlık: <span className="text-xl">{excusedCount} gün</span></p>
            </Card>
            <Card className={`p-4 ${isDarkMode ? 'bg-red-900/40 text-red-100' : 'bg-red-50 text-red-800'}`}>
              <p className="text-lg font-semibold">Özürsüz Devamsızlık: <span className="text-xl">{unexcusedCount} gün</span></p>
            </Card>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Açıklama</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absenceData.map((item, index) => (
                  <TableRow key={index} className={item.type === 'Özürlü' 
                    ? `${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50/50'}` 
                    : `${isDarkMode ? 'bg-red-900/20' : 'bg-red-50/50'}`
                  }>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.reason || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 text-center">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Bu ekran {timeLeft} saniye sonra ana menüye geri dönecektir.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DevamsizlikTable;
