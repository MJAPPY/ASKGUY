import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import LeaderboardPage from "./pages/LeaderboardPage";
import Guidelines from "./pages/Guidelines";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { WalletProvider } from "./hooks/use-wallet";
import { RequestsProvider } from "./hooks/use-requests";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WalletProvider>
        <RequestsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userAddress" element={<Profile />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/guidelines" element={<Guidelines />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </RequestsProvider>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;