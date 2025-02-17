
import React from 'react';
import HeartRateMonitor from '@/components/HeartRateMonitor';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1A2C]">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <header className="text-center mb-6 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            Monitor de Signos Vitales
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Monitoreo en tiempo real usando análisis PPG
          </p>
        </header>

        <div className="max-w-7xl mx-auto">
          <HeartRateMonitor />
        </div>
      </div>
    </div>
  );
};

export default Index;
