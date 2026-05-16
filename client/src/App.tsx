import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import GrammarArena from "./pages/arena/GrammarArena.tsx";
import GrammarSession from "./pages/arena/GrammarSession.tsx";
import VocabularyArena from "./pages/arena/VocabularyArena.tsx";
import VocabularySession from "./pages/arena/VocabularySession.tsx";
import ComprehensionArena from "./pages/arena/ComprehensionArena.tsx";
import ComprehensionSession from "./pages/arena/ComprehensionSession.tsx";
import PastPapersArena from "./pages/arena/PastPapersArena.tsx";
import PastPaperSession from "./pages/arena/PastPaperSession.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/arena/grammar" element={<GrammarArena />} />
          <Route path="/arena/grammar/:topicId" element={<GrammarSession />} />
          <Route path="/arena/vocabulary" element={<VocabularyArena />} />
          <Route path="/arena/vocabulary/:topicId" element={<VocabularySession />} />
          <Route path="/arena/comprehension" element={<ComprehensionArena />} />
          <Route path="/arena/comprehension/:passageId" element={<ComprehensionSession />} />
          <Route path="/arena/pastpapers" element={<PastPapersArena />} />
          <Route path="/arena/pastpapers/:paperId" element={<PastPaperSession />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
