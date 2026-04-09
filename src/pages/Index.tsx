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
const FAQ = lazy(() => import('@/components/landing/FAQ'));
const EnterpriseContact = lazy(() => import('@/components/landing/EnterpriseContact'));
const FinalCTA = lazy(() => import('@/components/landing/FinalCTA'));
const Footer = lazy(() => import('@/components/landing/Footer'));

const Index = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleTrainingComplete = (id: string) => {
    setSessionId(id);
  };

  return (
    <div className="min-h-screen text-foreground relative flex flex-col items-center" style={{ background: '#030014' }}>
      <AnimatedBackground />

      <div className="neo-scaled-content pt-14 sm:pt-16 lg:pt-20 pb-16 sm:pb-12 w-full">
        <Navigation />
        <main className="relative z-10">
          <Hero />
          <Suspense fallback={<div className="min-h-[40vh]" />}>
            <HowItWorks />
            <DemoSection onTrainingComplete={handleTrainingComplete} />
            <VoiceInterview key={sessionId || 'no-session'} sessionId={sessionId} />
            <FeaturesGrid />
            <BusinessResults />
            <UseCases />
            <RevenueCalculator />
            <Comparison />
            <Testimonials />
            <Pricing />
            <FAQ />
            <EnterpriseContact />
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
