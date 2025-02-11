
import React from 'react';
import HeartRateMonitor from '@/components/HeartRateMonitor';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F2C] to-[#2C1A2C]">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">
            Vital Signs Monitor
          </h1>
          <p className="text-gray-400">
            Real-time health monitoring using advanced PPG algorithms
          </p>
        </header>

        <div className="max-w-2xl mx-auto">
          <HeartRateMonitor />
        </div>
      </div>
    </div>
  );
};

export default Index;
