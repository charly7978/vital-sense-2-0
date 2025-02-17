
import React, { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import Index from "./pages/Index";
import HeartRateMonitor from "./components/HeartRateMonitor";

const queryClient = new QueryClient();

const App = () => {
  const [showMonitor, setShowMonitor] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <div className="relative w-screen h-screen overflow-hidden">
            {/* Contenido principal */}
            <div className={`transition-transform duration-500 ${showMonitor ? 'translate-x-full' : 'translate-x-0'}`}>
              <Index onOpenMonitor={() => setShowMonitor(true)} />
            </div>

            {/* Monitor de ritmo cardíaco */}
            <div 
              className={`fixed inset-0 transition-transform duration-500 ${showMonitor ? 'translate-x-0' : '-translate-x-full'}`}
            >
              {showMonitor && (
                <HeartRateMonitor onClose={() => setShowMonitor(false)} />
              )}
            </div>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
