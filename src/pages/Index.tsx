import { useState } from 'react';
import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import DemoSection from '@/components/landing/DemoSection';
import VoiceInterview from '@/components/landing/VoiceInterview';
import Comparison from '@/components/landing/Comparison';

import Testimonials from '@/components/landing/Testimonials';
import MarketingSkills from '@/components/landing/MarketingSkills';
import BusinessResults from '@/components/landing/BusinessResults';
import Founder from '@/components/landing/Founder';
import Pricing from '@/components/landing/Pricing';
import EnterpriseContact from '@/components/landing/EnterpriseContact';
import Footer from '@/components/landing/Footer';
import AnimatedBackground from '@/components/landing/AnimatedBackground';

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
        <div className="absolute top-1/3 right-0 w-[60%] h-[60vh] bg-[radial-gradient(ellipse_80%_60%_at_100%_30%,hsl(320_100%_40%/0.15),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 w-[60%] h-[50vh] bg-[radial-gradient(ellipse_80%_60%_at_0%_100%,hsl(355_80%_45%/0.14),transparent_60%)]" />
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[80%] h-[40vh] bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,hsl(280_80%_50%/0.06),transparent_70%)]" />
      </div>

      <AnimatedBackground />
      
      <div className="pt-14 sm:pt-16 lg:pt-20 pb-8 sm:pb-12 w-full">
        <Navigation />
        <main className="relative z-10">
          <Hero />
          <DemoSection onTrainingComplete={handleTrainingComplete} />
          <VoiceInterview key={sessionId || 'no-session'} sessionId={sessionId} />
          <Comparison />
          
          <BusinessResults />
          <Testimonials />
          <MarketingSkills />
          <Founder />
          <Pricing />
          <EnterpriseContact />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
