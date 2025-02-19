
import React from 'react';
import { VitalsProvider } from '@/contexts/VitalsContext';
import { VitalsMonitor } from '@/components/vitals/VitalsMonitor';
import { ArrowLeft } from 'lucide-react';

interface IndexProps {
  onClose?: () => void;
}

const Index: React.FC<IndexProps> = ({ onClose }) => {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-3 left-3 z-50 p-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white/80 hover:bg-black/40 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <VitalsProvider>
        <VitalsMonitor />
      </VitalsProvider>
    </div>
  );
};

export default Index;
