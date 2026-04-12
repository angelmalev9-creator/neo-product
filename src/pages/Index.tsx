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

      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Deep navy base */}
        <div className="absolute inset-0 bg-[hsl(220_55%_8%)]" />
        {/* Glowing arc — sweeping light from top-right */}
        <div className="absolute -top-[30%] -right-[20%] w-[120%] h-[120%] rounded-[50%] bg-[radial-gradient(ellipse_60%_50%_at_70%_30%,hsl(200_80%_45%/0.35),hsl(210_70%_30%/0.12)_40%,transparent_70%)]" />
        {/* Secondary softer glow — bottom-left */}
        <div className="absolute -bottom-[20%] -left-[15%] w-[80%] h-[80%] rounded-[50%] bg-[radial-gradient(ellipse_70%_60%_at_30%_70%,hsl(210_65%_35%/0.18),transparent_65%)]" />
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_30%,hsl(220_55%_5%/0.5)_100%)]" />
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
