import { useState, lazy, Suspense } from 'react';
import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import AnimatedBackground from '@/components/landing/AnimatedBackground';

// Lazy load below-fold sections for faster initial paint
const DemoSection = lazy(() => import('@/components/landing/DemoSection'));
const VoiceInterview = lazy(() => import('@/components/landing/VoiceInterview'));
const Comparison = lazy(() => import('@/components/landing/Comparison'));
const BusinessResults = lazy(() => import('@/components/landing/BusinessResults'));
const Testimonials = lazy(() => import('@/components/landing/Testimonials'));
const MarketingSkills = lazy(() => import('@/components/landing/MarketingSkills'));
const Founder = lazy(() => import('@/components/landing/Founder'));
const Pricing = lazy(() => import('@/components/landing/Pricing'));
const EnterpriseContact = lazy(() => import('@/components/landing/EnterpriseContact'));
const Footer = lazy(() => import('@/components/landing/Footer'));

const Index = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleTrainingComplete = (id: string) => {
    setSessionId(id);
  };

  return (
    <div className="min-h-screen text-foreground neo-grain relative flex flex-col items-center">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[80vh] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(355_100%_50%/0.3),transparent_70%)]" />
        <div className="absolute top-1/3 right-0 w-[60%] h-[60vh] bg-[radial-gradient(ellipse_80%_60%_at_100%_30%,hsl(280_90%_50%/0.12),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[50vh] bg-[radial-gradient(ellipse_80%_60%_at_0%_100%,hsl(355_80%_45%/0.14),transparent_60%)]" />
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[80%] h-[40vh] bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,hsl(280_80%_50%/0.06),transparent_70%)]" />
      </div>

      <AnimatedBackground />
      
      <div className="pt-14 sm:pt-16 lg:pt-20 pb-8 sm:pb-12 w-full">
        <Navigation />
        <main className="relative z-10">
          <Hero />
          <Suspense fallback={<div className="min-h-[50vh]" />}>
            <DemoSection onTrainingComplete={handleTrainingComplete} />
            <VoiceInterview key={sessionId || 'no-session'} sessionId={sessionId} />
            <Comparison />
            <BusinessResults />
            <Testimonials />
            <MarketingSkills />
            <Founder />
            <Pricing />
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
