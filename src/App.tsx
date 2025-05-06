
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import StartScreen from "./pages/StartScreen";
import FaceRecognition from "./pages/FaceRecognition";
import MainMenu from "./pages/MainMenu";
import GradeSelectionPage from "./pages/GradeSelectionPage";
import StaffDirectionPage from "./pages/StaffDirectionPage";
import AttendanceFormPage from "./pages/AttendanceFormPage";
import AttendanceTablePage from "./pages/AttendanceTablePage";
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
            <Route path="/" element={<StartScreen />} />
            <Route path="/face-recognition" element={<FaceRecognition />} />
            <Route path="/main-menu" element={<MainMenu />} />
            <Route path="/grade-selection" element={<GradeSelectionPage />} />
            <Route path="/staff-direction/:staffName/:reason" element={<StaffDirectionPage />} />
            <Route path="/attendance-form" element={<AttendanceFormPage />} />
            <Route path="/attendance-table/:name/:surname" element={<AttendanceTablePage />} />
            <Route path="/registration-contract" element={<RegistrationContractPage />} />
            <Route path="/registration-form" element={<RegistrationFormPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
