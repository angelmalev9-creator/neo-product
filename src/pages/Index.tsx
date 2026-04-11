import { useState, lazy, Suspense } from 'react';
import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import AnimatedBackground from '@/components/landing/AnimatedBackground';
import SectionGlow from '@/components/landing/SectionGlow';

// Lazy load below-fold sections
const ProblemSection = lazy(() => import('@/components/landing/ProblemSection'));
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
const FAQ = lazy(() => import('@/components/landing/FAQ'));
const Founder = lazy(() => import('@/components/landing/Founder'));
const EnterpriseContact = lazy(() => import('@/components/landing/EnterpriseContact'));
const FinalCTA = lazy(() => import('@/components/landing/FinalCTA'));
const Footer = lazy(() => import('@/components/landing/Footer'));

const Index = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleTrainingComplete = (id: string) => {
    setSessionId(id);
  };

  return (
    <div className="min-h-screen text-foreground relative flex flex-col items-center">
      <AnimatedBackground />

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(200_60%_92%)] via-[hsl(205_70%_72%)] to-[hsl(210_80%_45%)]" />
        <div className="absolute top-0 right-0 w-[60%] h-[50vh] bg-[radial-gradient(ellipse_70%_60%_at_80%_10%,hsl(195_80%_85%/0.6),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[40vh] bg-[radial-gradient(ellipse_80%_60%_at_10%_90%,hsl(215_75%_35%/0.4),transparent_60%)]" />
      </div>

      <div className="neo-scaled-content pt-14 sm:pt-16 lg:pt-20 pb-16 sm:pb-12 w-full">
        <Navigation />
        <main className="relative z-10">
          <Hero />
          <Suspense fallback={<div className="min-h-[40vh]" />}>
            <SectionGlow variant="blue" />
            <ProblemSection />
            <SectionGlow variant="cyan" />
            <HowItWorks />
            <SectionGlow variant="mixed" />
            <DemoSection onTrainingComplete={handleTrainingComplete} />
            <VoiceInterview key={sessionId || 'no-session'} sessionId={sessionId} />
            <SectionGlow variant="blue" />
            <FeaturesGrid />
            <SectionGlow variant="cyan" />
            <BusinessResults />
            <UseCases />
            <SectionGlow variant="mixed" />
            <RevenueCalculator />
            <SectionGlow variant="blue" />
            <Comparison />
            <SectionGlow variant="cyan" />
            <Testimonials />
            <SectionGlow variant="mixed" />
            <Pricing />
            <SectionGlow variant="blue" />
            <FAQ />
            <SectionGlow variant="cyan" />
            <Founder />
            <EnterpriseContact />
            <SectionGlow variant="mixed" />
            <FinalCTA />
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
