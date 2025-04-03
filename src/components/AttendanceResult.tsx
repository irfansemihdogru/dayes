
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AttendanceResultProps {
  studentName: string;
  grade: number;
  onTimeout: () => void;
}

interface AttendanceRecord {
  date: string;
  status: 'Özürlü' | 'Özürsüz';
  hours: number;
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
      hours: Math.floor(Math.random() * 8) + 1, // 1-8 hours
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
  
  useEffect(() => {
    // Generate mock data
    setAttendanceData(generateMockAttendanceData(8));
    
    // Set timeout to return to main screen
    const timer = setTimeout(() => {
      onTimeout();
    }, 30000);
    
    return () => clearTimeout(timer);
  }, [onTimeout]);
  
  // Calculate totals
  const totalExcused = attendanceData.filter(record => record.status === 'Özürlü')
    .reduce((sum, record) => sum + record.hours, 0);
    
  const totalUnexcused = attendanceData.filter(record => record.status === 'Özürsüz')
    .reduce((sum, record) => sum + record.hours, 0);
  
  return (
    <Card className="w-full max-w-4xl bg-white/90 backdrop-blur-sm shadow-lg">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-2xl text-center">
          {studentName} - {grade}. Sınıf Devamsızlık Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="rounded-md border mb-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50">
                <TableHead className="w-[180px]">Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Saat</TableHead>
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
                  <TableCell className="text-right">{record.hours} saat</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-center p-3 bg-white rounded-md shadow-sm">
            <p className="text-sm text-gray-600">Toplam Özürlü</p>
            <p className="text-2xl font-bold text-blue-800">{totalExcused} saat</p>
          </div>
          <div className="text-center p-3 bg-white rounded-md shadow-sm">
            <p className="text-sm text-gray-600">Toplam Özürsüz</p>
            <p className="text-2xl font-bold text-red-600">{totalUnexcused} saat</p>
          </div>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Bu ekran 30 saniye sonra otomatik olarak kapanacaktır.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceResult;
