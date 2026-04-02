import { useRef, useState, useEffect } from 'react';
import { Globe, FileText, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    icon: Globe,
    title: 'NEO започва от сайта ви',
    description: 'Взима услуги, цени и информация автоматично.',
    mockup: 'website',
  },
  {
    icon: FileText,
    title: 'Добавяте още знания',
    description: 'PDF-и, документи, текстове, база данни.',
    mockup: 'documents',
  },
  {
    icon: MessageSquare,
    title: 'Започва да отговаря като вас',
    description: 'Не измисля. Говори по вашата информация.',
    mockup: 'chat',
  },
];

const MockupWebsite = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-3 h-3 rounded-full bg-red-400/60" />
      <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
      <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
      <div className="flex-1 h-6 rounded-full bg-foreground/5 mx-4" />
    </div>
    <div className="h-4 w-3/4 rounded bg-foreground/8" />
    <div className="h-3 w-full rounded bg-foreground/5" />
    <div className="h-3 w-5/6 rounded bg-foreground/5" />
    <div className="h-3 w-2/3 rounded bg-foreground/5" />
    <div className="mt-6 grid grid-cols-3 gap-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 rounded-xl bg-foreground/4 border border-border/10" />
      ))}
    </div>
    <div className="mt-4 flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
        <Globe className="w-3 h-3 text-primary" />
      </div>
      <div className="h-2.5 w-32 rounded bg-primary/10" />
      <span className="text-[10px] text-emerald-400 font-medium ml-auto">Сканиране...</span>
    </div>
  </div>
);

const MockupDocuments = () => (
  <div className="space-y-3">
    {['Ценова листа.pdf', 'Услуги.docx', 'FAQ база данни'].map((name, i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-foreground/3 border border-border/10">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{name}</p>
          <p className="text-[10px] text-foreground/30">{(i + 1) * 24} KB</p>
        </div>
        <span className="text-[10px] text-emerald-400 font-medium shrink-0">✓ Добавен</span>
      </div>
    ))}
    <div className="mt-4 p-3 rounded-xl border border-dashed border-border/20 text-center">
      <p className="text-xs text-foreground/30">+ Добави още файлове</p>
    </div>
  </div>
);

const MockupChat = () => (
  <div className="space-y-3">
    <div className="flex justify-end">
      <div className="bg-primary/10 text-foreground/70 text-sm px-4 py-2.5 rounded-2xl rounded-tr-md max-w-[220px]">
        Колко струва почистване на климатик?
      </div>
    </div>
    <div className="flex justify-start">
      <div className="bg-foreground/5 text-foreground/60 text-sm px-4 py-2.5 rounded-2xl rounded-tl-md max-w-[260px]">
        Почистването на климатик при нас е 89 лв. Включва дезинфекция и проверка на фреон. Искате ли да запишем час?
      </div>
    </div>
    <div className="flex justify-end">
      <div className="bg-primary/10 text-foreground/70 text-sm px-4 py-2.5 rounded-2xl rounded-tr-md">
        Да, утре сутринта.
      </div>
    </div>
    <div className="flex justify-start">
      <div className="bg-foreground/5 text-foreground/60 text-sm px-4 py-2.5 rounded-2xl rounded-tl-md max-w-[240px]">
        Записах ви за утре, 10:00. Ще получите потвърждение на имейла.
      </div>
    </div>
  </div>
);

const mockups: Record<string, React.FC> = {
  website: MockupWebsite,
  documents: MockupDocuments,
  chat: MockupChat,
};

const ScrollStory = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionH = sectionRef.current.offsetHeight;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / (sectionH - window.innerHeight)));
      const step = Math.min(2, Math.floor(progress * 3));
      setActiveStep(step);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const ActiveMockup = mockups[steps[activeStep].mockup];

  return (
    <section ref={sectionRef} className="relative" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Steps */}
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-medium">
                Как работи NEO
              </span>
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: activeStep === i ? 1 : 0.3 }}
                  transition={{ duration: 0.4 }}
                  className="flex gap-4 cursor-pointer"
                  onClick={() => setActiveStep(i)}
                >
                  <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                    activeStep === i ? 'bg-primary/15 text-primary' : 'bg-foreground/5 text-foreground/30'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-base mb-1">{step.title}</h3>
                    <p className="text-sm text-foreground/40 leading-relaxed max-w-[400px]">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right — Mockup */}
            <div className="relative">
              <div className="neo-glass-premium rounded-2xl p-6 sm:p-8 border border-border/10 min-h-[320px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                  >
                    <ActiveMockup />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="absolute -z-10 inset-0 blur-[60px] bg-gradient-to-br from-primary/6 via-transparent to-accent/4 rounded-3xl scale-110" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollStory;
