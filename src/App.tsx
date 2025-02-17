
import React, { useState } from 'react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import Index from "./pages/Index";
import HeartRateMonitor from "./components/HeartRateMonitor";

const queryClient = new QueryClient();

const App = () => {
  const [showControls, setShowControls] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <div className="relative w-screen h-screen overflow-hidden">
            {/* Monitor de ritmo cardíaco (principal) */}
            <div className="fixed inset-0">
              <HeartRateMonitor onShowControls={() => setShowControls(true)} />
            </div>

            {/* Panel de controles (deslizable) */}
            <div 
              className={`fixed inset-0 transition-transform duration-500 ${showControls ? 'translate-x-0' : 'translate-x-full'}`}
            >
              {showControls && (
                <Index onClose={() => setShowControls(false)} />
              )}
            </div>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
