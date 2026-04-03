import { useState, lazy, Suspense } from 'react';
import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import AnimatedBackground from '@/components/landing/AnimatedBackground';

// Lazy load below-fold sections
const HowItWorks = lazy(() => import('@/components/landing/HowItWorks'));
const DemoSection = lazy(() => import('@/components/landing/DemoSection'));
const VoiceInterview = lazy(() => import('@/components/landing/VoiceInterview'));
const FeaturesGrid = lazy(() => import('@/components/landing/FeaturesGrid'));
const UseCases = lazy(() => import('@/components/landing/UseCases'));
const RevenueCalculator = lazy(() => import('@/components/landing/RevenueCalculator'));
const BusinessResults = lazy(() => import('@/components/landing/BusinessResults'));
const Comparison = lazy(() => import('@/components/landing/Comparison'));
const Testimonials = lazy(() => import('@/components/landing/Testimonials'));
const Pricing = lazy(() => import('@/components/landing/Pricing'));
const EnterpriseContact = lazy(() => import('@/components/landing/EnterpriseContact'));
const Footer = lazy(() => import('@/components/landing/Footer'));

const Index = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleTrainingComplete = (id: string) => {
    setSessionId(id);
  };

  return (
    <div className="min-h-screen text-foreground relative flex flex-col items-center">
      {/* Interactive dot grid background with mouse repulsion */}
      <AnimatedBackground />

      {/* Ambient gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[60vh] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(355_65%_52%/0.06),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[40vh] bg-[radial-gradient(ellipse_80%_60%_at_0%_100%,hsl(350_55%_48%/0.03),transparent_60%)]" />
      </div>

      <div className="neo-scaled-content pt-14 sm:pt-16 lg:pt-20 pb-16 sm:pb-12 w-full">
        <Navigation />
        <main className="relative z-10">
          <Hero />
          <Suspense fallback={<div className="min-h-[40vh]" />}>
            <HowItWorks />
            <DemoSection onTrainingComplete={handleTrainingComplete} />
            <VoiceInterview key={sessionId || 'no-session'} sessionId={sessionId} />
            <FeaturesGrid />
            <UseCases />
            <RevenueCalculator />
            <BusinessResults />
            <Comparison />
            <Testimonials />
            <Pricing />
            <Founder />
            <EnterpriseContact />
          </Suspense>
        </main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>

    </div>
  );
};

export default Index;
