import React from 'react';
import HeartRateMonitor from '@/components/HeartRateMonitor';
import { VitalsProvider } from '@/contexts/VitalsContext';

interface IndexProps {
  onOpenMonitor: () => void;
}

const Index: React.FC<IndexProps> = ({ onOpenMonitor }) => {
  return (
    <VitalsProvider>
      <div className="h-screen w-screen overflow-hidden bg-black">
        <button 
          onClick={onOpenMonitor}
          className="bg-primary text-white px-4 py-2 rounded-lg"
        >
          Abrir Monitor
        </button>
      </div>
    </VitalsProvider>
  );
};

export default Index;
