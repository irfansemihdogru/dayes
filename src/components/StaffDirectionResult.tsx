
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRoundIcon } from 'lucide-react';

interface StaffDirectionResultProps {
  staffName: string;
  reason: string;
  onTimeout: () => void;
}

const StaffDirectionResult: React.FC<StaffDirectionResultProps> = ({ 
  staffName, 
  reason,
  onTimeout 
}) => {
  useEffect(() => {
    // Set timeout to return to main screen
    const timer = setTimeout(() => {
      onTimeout();
    }, 30000);
    
    return () => clearTimeout(timer);
  }, [onTimeout]);
  
  return (
    <Card className="w-full max-w-3xl bg-white/90 backdrop-blur-sm shadow-lg">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-2xl text-center">Yönlendirme</CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-center">
        <div className="mb-6">
          <div className="w-24 h-24 rounded-full bg-blue-100 mx-auto flex items-center justify-center">
            <UserRoundIcon size={48} className="text-blue-600" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-blue-800 mb-2">{staffName}</h2>
        <p className="text-lg text-gray-600 mb-6">Personeline yönlendiriliyorsunuz</p>
        
        <div className="p-4 bg-blue-50 rounded-lg mb-6">
          <p className="text-sm text-gray-600 mb-1">İşlem</p>
          <p className="text-xl font-medium text-blue-800">{reason}</p>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Bu ekran 30 saniye sonra otomatik olarak kapanacaktır.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffDirectionResult;
