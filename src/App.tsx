import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import NotFound from "./pages/NotFound";
import KaraokePage from "./pages/KaraokePage";
import EqualizerPage from "./pages/EqualizerPage";
import NavigationBar from "./components/NavigationBar";
import NowPlaying from "./components/NowPlaying";
import { AudioPlayerProvider } from "./services/AudioPlayerService";

const queryClient = new QueryClient();

const App = () => {
  const [playerExpanded, setPlayerExpanded] = useState(false);
  
  const togglePlayerExpanded = () => {
    setPlayerExpanded(!playerExpanded);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AudioPlayerProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
              <div className="flex-1 pb-20 overflow-auto">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/karaoke" element={<KaraokePage />} />
                  <Route path="/equalizer" element={<EqualizerPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              
              <div className="fixed bottom-0 left-0 right-0 z-10">
                <NowPlaying 
                  expanded={playerExpanded} 
                  onToggleExpand={togglePlayerExpanded} 
                />
              </div>
              
              <NavigationBar />
            </div>
          </BrowserRouter>
        </AudioPlayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
