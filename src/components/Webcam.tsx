
import React from 'react';

export const Webcam: React.FC = () => {
  // This is a placeholder component for the webcam feed
  // In a real implementation, this would use a library like react-webcam
  
  return (
    <div className="w-full h-full bg-gradient-to-r from-blue-200 to-blue-300 flex items-center justify-center">
      <div className="text-blue-900 text-opacity-50 text-lg">
        Kamera Görüntüsü
      </div>
    </div>
  );
};
