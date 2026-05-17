import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import GrammarArena from "./pages/arena/GrammarArena";
import GrammarSession from "./pages/arena/GrammarSession";
import VocabularyArena from "./pages/arena/VocabularyArena";
import VocabularySession from "./pages/arena/VocabularySession";
import ComprehensionArena from "./pages/arena/ComprehensionArena";
import ComprehensionSession from "./pages/arena/ComprehensionSession";
import PastPapersArena from "./pages/arena/PastPapersArena";
import PastPaperSession from "./pages/arena/PastPaperSession";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute><Index /></ProtectedRoute>
              } />
              <Route path="/arena/grammar" element={
                <ProtectedRoute><GrammarArena /></ProtectedRoute>
              } />
              <Route path="/arena/grammar/:topicId" element={
                <ProtectedRoute><GrammarSession /></ProtectedRoute>
              } />
              <Route path="/arena/vocabulary" element={
                <ProtectedRoute><VocabularyArena /></ProtectedRoute>
              } />
              <Route path="/arena/vocabulary/:topicId" element={
                <ProtectedRoute><VocabularySession /></ProtectedRoute>
              } />
              <Route path="/arena/comprehension" element={
                <ProtectedRoute><ComprehensionArena /></ProtectedRoute>
              } />
              <Route path="/arena/comprehension/:passageId" element={
                <ProtectedRoute><ComprehensionSession /></ProtectedRoute>
              } />
              <Route path="/arena/pastpapers" element={
                <ProtectedRoute><PastPapersArena /></ProtectedRoute>
              } />
              <Route path="/arena/pastpapers/:paperId" element={
                <ProtectedRoute><PastPaperSession /></ProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

