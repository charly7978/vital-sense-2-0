
import React from 'react';
import HeartRateMonitor from '@/components/HeartRateMonitor';
import { VitalsProvider } from '@/contexts/VitalsContext';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] via-[#2C1A2C] to-[#1A1F2C] relative overflow-hidden">
      {/* Efecto tornasolado con overlay gradiente */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-blue-500/5 to-pink-500/5 animate-gradient" />
      
      <div className="container mx-auto px-2 py-2 relative z-10">
        <header className="text-center mb-3">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80 tracking-tight">
            Vital Signs Monitor
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time health monitoring using PPG analysis
          </p>
        </header>

        <div className="bg-black/30 backdrop-blur-lg rounded-xl shadow-xl border border-white/5">
          <VitalsProvider>
            <HeartRateMonitor />
          </VitalsProvider>
        </div>
      </div>
    </div>
  );
};

export default Index;
