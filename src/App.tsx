
import React from 'react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import HeartRateMonitor from "./components/HeartRateMonitor";
import { VitalsProvider } from "./contexts/VitalsContext";

const queryClient = new QueryClient();

const App = () => {
  return (
    <div className="fixed inset-0 bg-black">
      <QueryClientProvider client={queryClient}>
        <VitalsProvider>
          <TooltipProvider>
            <BrowserRouter>
              <div className="w-full h-full">
                <HeartRateMonitor onShowControls={() => {}} />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </VitalsProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;
