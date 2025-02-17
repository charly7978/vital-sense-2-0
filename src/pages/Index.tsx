
import React from 'react';
import HeartRateMonitor from '@/components/HeartRateMonitor';
import { VitalsProvider } from '@/contexts/VitalsContext';

const Index = () => {
  return (
    <VitalsProvider>
      <div className="h-screen w-screen overflow-hidden bg-black">
        <HeartRateMonitor />
      </div>
    </VitalsProvider>
  );
};

export default Index;
