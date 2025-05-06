
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Index from "./pages/Index";
import MainMenu from "./pages/MainMenuPage";
import DevamsizlikPage from "./pages/DevamsizlikPage";
import StaffDirectionPage from "./pages/StaffDirectionPage";
import RegistrationContractPage from "./pages/RegistrationContractPage";
import RegistrationFormPage from "./pages/RegistrationFormPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/main" element={<MainMenu />} />
            <Route path="/devamsizlik" element={<DevamsizlikPage />} />
            <Route path="/staff-direction" element={<StaffDirectionPage />} />
            <Route path="/registration-contract" element={<RegistrationContractPage />} />
            <Route path="/registration-form" element={<RegistrationFormPage />} />
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
