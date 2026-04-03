import { useState, lazy, Suspense } from 'react';
import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

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
const Founder = lazy(() => import('@/components/landing/Founder'));
const EnterpriseContact = lazy(() => import('@/components/landing/EnterpriseContact'));
const Footer = lazy(() => import('@/components/landing/Footer'));

const Index = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleTrainingComplete = (id: string) => {
    setSessionId(id);
  };

  return (
    <div className="min-h-screen text-foreground relative flex flex-col items-center neo-snap-container">
      {/* Ambient background — minimal gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[60vh] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(355_100%_50%/0.15),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[40vh] bg-[radial-gradient(ellipse_80%_60%_at_0%_100%,hsl(355_80%_45%/0.08),transparent_60%)]" />
      </div>

      <div className="neo-scaled-content pt-14 sm:pt-16 lg:pt-20 pb-16 sm:pb-12 w-full">
        <Navigation />
        <main className="relative z-10">
          <section className="neo-snap-section"><Hero /></section>
          <Suspense fallback={<div className="min-h-[40vh]" />}>
            <section className="neo-snap-section"><HowItWorks /></section>
            <section className="neo-snap-section"><DemoSection onTrainingComplete={handleTrainingComplete} /></section>
            <section className="neo-snap-section"><VoiceInterview key={sessionId || 'no-session'} sessionId={sessionId} /></section>
            <section className="neo-snap-section"><FeaturesGrid /></section>
            <UseCases />
            <section className="neo-snap-section"><RevenueCalculator /></section>
            <section className="neo-snap-section"><BusinessResults /></section>
            <section className="neo-snap-section"><Comparison /></section>
            <section className="neo-snap-section"><Testimonials /></section>
            <section className="neo-snap-section"><Pricing /></section>
            <section className="neo-snap-section"><Founder /></section>
            <section className="neo-snap-section"><EnterpriseContact /></section>
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
