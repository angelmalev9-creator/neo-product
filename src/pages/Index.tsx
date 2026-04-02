import { useState, lazy, Suspense } from 'react';
import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const DemoSection = lazy(() => import('@/components/landing/DemoSection'));
const VoiceInterview = lazy(() => import('@/components/landing/VoiceInterview'));
const Comparison = lazy(() => import('@/components/landing/Comparison'));
const BusinessResults = lazy(() => import('@/components/landing/BusinessResults'));
const Testimonials = lazy(() => import('@/components/landing/Testimonials'));
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
    <div className="min-h-screen text-foreground neo-grain relative flex flex-col items-center bg-background">
      <div className="w-full">
        <Navigation />
        <main className="relative z-10">
          <Hero />
          <Suspense fallback={<div className="min-h-[40vh]" />}>
            <DemoSection onTrainingComplete={handleTrainingComplete} />
            <VoiceInterview key={sessionId || 'no-session'} sessionId={sessionId} />
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

      {/* Sticky mobile CTA */}
      <div 
        className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-background/90 backdrop-blur-xl border-t border-border/10 px-4 py-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          className="neo-btn-primary w-full py-3 text-base font-semibold rounded-full gap-2"
          onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Опитайте NEO безплатно
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
