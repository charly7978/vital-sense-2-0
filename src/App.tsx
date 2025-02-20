
import React, { useState } from 'react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import HeartRateMonitor from "./components/HeartRateMonitor";
import { VitalsProvider } from "./contexts/VitalsContext";

const queryClient = new QueryClient();

const App = () => {
  const [showControls, setShowControls] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <VitalsProvider>
        <TooltipProvider>
          <BrowserRouter>
            <div className="relative w-screen h-screen bg-black text-white overflow-hidden">
              <HeartRateMonitor onShowControls={() => setShowControls(true)} />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </VitalsProvider>
    </QueryClientProvider>
  );
};

export default App;
