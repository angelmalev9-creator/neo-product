import { useState, lazy, Suspense } from 'react';
import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import AnimatedBackground from '@/components/landing/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

// Lazy load below-fold sections
const DemoSection = lazy(() => import('@/components/landing/DemoSection'));
const ScrollStory = lazy(() => import('@/components/landing/ScrollStory'));
const SettingsCards = lazy(() => import('@/components/landing/SettingsCards'));
const VoiceInterview = lazy(() => import('@/components/landing/VoiceInterview'));
const BookingTimeline = lazy(() => import('@/components/landing/BookingTimeline'));
const UseCases = lazy(() => import('@/components/landing/UseCases'));
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
    <div className="min-h-screen text-foreground neo-grain relative flex flex-col items-center">
      <CustomCursor />
      
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[80vh] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(355_100%_50%/0.15),transparent_70%)]" />
        <div className="absolute top-1/3 right-0 w-[60%] h-[60vh] bg-[radial-gradient(ellipse_80%_60%_at_100%_30%,hsl(280_90%_50%/0.06),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[50vh] bg-[radial-gradient(ellipse_80%_60%_at_0%_100%,hsl(355_80%_45%/0.08),transparent_60%)]" />
      </div>

      <AnimatedBackground />
      
      <div className="pt-14 sm:pt-16 lg:pt-20 w-full">
        <Navigation />
        <main className="relative z-10">
          <Hero />
          <Suspense fallback={<div className="min-h-[50vh]" />}>
            <DemoSection onTrainingComplete={handleTrainingComplete} />
            <VoiceInterview key={sessionId || 'no-session'} sessionId={sessionId} />
            <ScrollStory />
            <SettingsCards />
            <BookingTimeline />
            <UseCases />
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
        className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-background/90 backdrop-blur-xl border-t border-border/10 px-4 py-2.5"
        style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
      >
        <Button
          className="neo-btn-primary w-full py-3 text-[13px] font-semibold rounded-full gap-2 whitespace-nowrap"
          onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Тествайте NEO
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Index;
