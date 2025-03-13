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
            <div className="h-screen flex flex-col bg-background text-foreground">
              {/* Área de conteúdo principal com rolagem */}
              <div className="flex-1 overflow-y-auto pb-[120px]">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/karaoke" element={<KaraokePage />} />
                  <Route path="/equalizer" element={<EqualizerPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              
              {/* Controles fixos na parte inferior */}
              <div className="fixed bottom-0 left-0 right-0 z-30">
                <div className="flex flex-col">
                  <NowPlaying 
                    expanded={playerExpanded} 
                    onToggleExpand={togglePlayerExpanded} 
                  />
                  <NavigationBar />
                </div>
              </div>
            </div>
          </BrowserRouter>
        </AudioPlayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
