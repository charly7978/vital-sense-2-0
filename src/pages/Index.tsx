
import React from 'react';
import HeartRateMonitor from '@/components/HeartRateMonitor';
import { VitalsProvider } from '@/contexts/VitalsContext';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1A2C]">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <header className="text-center mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            Vital Signs Monitor
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Real-time health monitoring using PPG analysis
          </p>
        </header>

        <VitalsProvider>
          <div className="bg-black/20 backdrop-blur-lg rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-4xl mx-auto">
            <HeartRateMonitor />
          </div>
        </VitalsProvider>
      </div>
    </div>
  );
};

export default Index;
