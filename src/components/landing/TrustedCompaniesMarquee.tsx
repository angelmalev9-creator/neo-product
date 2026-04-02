import { motion } from 'framer-motion';

const trustedCompanies = [
  { name: 'Dental Studio Sofia', metric: '−40% пропуснати часове' },
  { name: 'Auto Prime Service', metric: '0 пропуснати обаждания' },
  { name: 'MediCare Clinic', metric: '3× по-бърз прием' },
  { name: 'Beauty Lab', metric: '100% автоматични часове' },
  { name: 'Legal Partners BG', metric: '+60% повече лидове' },
  { name: 'Home Vision', metric: '2× по-висока конверсия' },
  { name: 'FitCore Studio', metric: 'Без рецепционист' },
  { name: 'Smile Center', metric: '€1200/мес спестени' },
];

const TrustedTrack = ({ reverse = false }: { reverse?: boolean }) => {
  const items = [...trustedCompanies, ...trustedCompanies];

  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex w-max gap-3"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration: reverse ? 28 : 32, repeat: Infinity, ease: 'linear' }}
      >
        {items.map((company, index) => (
          <div
            key={`${company.name}-${index}`}
            className="flex items-center gap-3 rounded-full border border-border/20 bg-card/60 px-4 py-2 backdrop-blur-xl"
          >
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs text-foreground/90">{company.name}</span>
            <span className="text-[10px] text-muted-foreground">{company.metric}</span>
          </div>
        ))}
      </motion.div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
};

const TrustedCompaniesMarquee = () => {
  return (
    <div className="mx-auto mt-8 max-w-6xl rounded-[2rem] border border-border/20 bg-card/40 p-4 backdrop-blur-2xl sm:mt-10 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Компании, които спестиха рецепционист с NEO
        </p>
        <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] text-primary">
          Автоматизиран процес 24/7
        </div>
      </div>

      <div className="space-y-3">
        <TrustedTrack />
        <TrustedTrack reverse />
      </div>
    </div>
  );
};

export default TrustedCompaniesMarquee;
