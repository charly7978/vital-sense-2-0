
import React from 'react';
import HeartRateMonitor from '@/components/HeartRateMonitor';
import { VitalsProvider } from '@/contexts/VitalsContext';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1A2C]">
      <div className="container mx-auto px-4 py-4">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            Vital Signs Monitor
          </h1>
          <p className="text-sm text-gray-400">
            Real-time health monitoring using PPG analysis
          </p>
        </header>

        <div className="bg-black/20 backdrop-blur-lg rounded-2xl shadow-xl p-4 w-full max-w-6xl mx-auto">
          <VitalsProvider>
            <HeartRateMonitor />
          </VitalsProvider>
        </div>
      </div>
    </div>
  );
};

export default Index;
