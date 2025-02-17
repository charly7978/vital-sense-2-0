
import React from 'react';
import HeartRateMonitor from '@/components/HeartRateMonitor';
import { VitalsProvider } from '@/contexts/VitalsContext';

const Index = () => {
  return (
    <VitalsProvider>
      <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1A2C] overflow-x-hidden">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <header className="text-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
              Vital Signs Monitor
            </h1>
            <p className="text-sm text-gray-400">
              Real-time health monitoring using PPG analysis
            </p>
          </header>

          <div className="relative min-h-[calc(100vh-12rem)]">
            <HeartRateMonitor />
          </div>
        </div>
      </div>
    </VitalsProvider>
  );
};

export default Index;
