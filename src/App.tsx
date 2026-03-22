import { useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load all non-landing routes
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Success = lazy(() => import("./pages/Success"));
const Widget = lazy(() => import("./pages/Widget"));
const NotFound = lazy(() => import("./pages/NotFound"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const Blog = lazy(() => import("./pages/Blog"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const GDPR = lazy(() => import("./pages/GDPR"));
const Cookies = lazy(() => import("./pages/Cookies"));

const VoiceAssistantEvolution = lazy(() => import("./pages/blog/VoiceAssistantEvolution"));
const SmallBusinessSales = lazy(() => import("./pages/blog/SmallBusinessSales"));
const DentalClinicAI = lazy(() => import("./pages/blog/DentalClinicAI"));
const MissedCalls = lazy(() => import("./pages/blog/MissedCalls"));
const AIReceptionFuture = lazy(() => import("./pages/blog/AIReceptionFuture"));
const MedicalReceptionAI = lazy(() => import("./pages/blog/MedicalReceptionAI"));
const AutoServiceReception = lazy(() => import("./pages/blog/AutoServiceReception"));
const BeautySalonReception = lazy(() => import("./pages/blog/BeautySalonReception"));

const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/success" element={<Success />} />
                <Route path="/widget" element={<Widget />} />
                <Route path="/help" element={<HelpCenter />} />
                <Route path="/api-docs" element={<ApiDocs />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/voice-assistant-evolution" element={<VoiceAssistantEvolution />} />
                <Route path="/blog/small-business-sales" element={<SmallBusinessSales />} />
                <Route path="/blog/dental-clinic-ai" element={<DentalClinicAI />} />
                <Route path="/blog/missed-calls" element={<MissedCalls />} />
                <Route path="/blog/ai-reception-future" element={<AIReceptionFuture />} />
                <Route path="/blog/medical-reception-ai" element={<MedicalReceptionAI />} />
                <Route path="/blog/auto-service-reception" element={<AutoServiceReception />} />
                <Route path="/blog/beauty-salon-reception" element={<BeautySalonReception />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/gdpr" element={<GDPR />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="/partners" element={<Partners />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
