
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import NotFound from "./pages/NotFound";
import NavigationBar from "./components/NavigationBar";
import NowPlaying from "./components/NowPlaying";

const queryClient = new QueryClient();

const App = () => {
  const [playerExpanded, setPlayerExpanded] = useState(false);
  
  const togglePlayerExpanded = () => {
    setPlayerExpanded(!playerExpanded);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen relative">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <NavigationBar />
            <NowPlaying 
              expanded={playerExpanded} 
              onToggleExpand={togglePlayerExpanded} 
            />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
