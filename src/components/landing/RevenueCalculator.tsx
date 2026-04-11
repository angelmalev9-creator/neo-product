import { useState, useMemo } from 'react';
import { Calculator, TrendingDown, ArrowRight, Phone, DollarSign, Clock } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const RevenueCalculator = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [missedCalls, setMissedCalls] = useState(5);
  const [avgDealValue, setAvgDealValue] = useState(100);
  const [conversionRate, setConversionRate] = useState(30);

  const results = useMemo(() => {
    const dailyLost = missedCalls * (conversionRate / 100) * avgDealValue;
    const monthlyLost = dailyLost * 22;
    const yearlyLost = monthlyLost * 12;
    const roi = Math.round((monthlyLost / 25) * 100) / 100;
    return { dailyLost, monthlyLost, yearlyLost, roi };
  }, [missedCalls, avgDealValue, conversionRate]);

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="calculator" className="neo-section-spacing">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold mb-5 uppercase tracking-[0.15em]">
            <Calculator className="w-3.5 h-3.5" /> Калкулатор
          </span>
          <h2 className="neo-heading-section font-black text-foreground mb-3 font-mono">
            Колко губите от <span className="text-primary">пропуснати обаждания?</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            Преместете плъзгачите. Вижте колко струва мълчанието Ви.
          </p>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Sliders */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            className="space-y-5"
          >
            <SliderRow icon={Phone} color="text-primary" label="Пропуснати обаждания/ден" value={missedCalls} min={1} max={30} step={1} onChange={setMissedCalls} />
            <SliderRow icon={DollarSign} color="text-emerald-400" label="Средна стойност (EUR)" value={avgDealValue} min={10} max={500} step={10} onChange={setAvgDealValue} />
            <SliderRow icon={Clock} color="text-amber-400" label="Конверсия (%)" value={conversionRate} min={5} max={80} step={5} onChange={setConversionRate} suffix="%" />
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border/15 bg-card/30 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/10 bg-card/40 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-wider">Губите в момента</span>
              </div>
              <div className="p-5 space-y-3">
                <ResultRow label="Дневно" value={`-${results.dailyLost.toFixed(0)} EUR`} size="sm" />
                <ResultRow label="Месечно" value={`-${results.monthlyLost.toFixed(0)} EUR`} size="md" />
                <div className="rounded-xl bg-red-500/8 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Годишно</span>
                  <span className="text-2xl font-black text-red-400 tabular-nums">-{results.yearlyLost.toFixed(0)} EUR</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
              <p className="text-xs text-foreground/80 mb-1">С NEO това става:</p>
              <p className="text-xl font-black text-emerald-400">Спасявате {results.monthlyLost.toFixed(0)} EUR всеки месец</p>
              <p className="text-[10px] text-foreground/70 mt-1">NEO се изплаща {results.roi.toFixed(0)} пъти.</p>
            </div>

            <Button
              className="neo-btn-primary w-full text-xs px-6 py-3 h-auto font-bold rounded-full gap-2"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Спрете загубите днес <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const SliderRow = ({ icon: Icon, color, label, value, min, max, step, onChange, suffix }: {
  icon: React.ElementType; color: string; accent?: string; label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <Icon className={`w-3.5 h-3.5 ${color}`} /> {label}
      </label>
      <span className={`text-base font-black ${color} tabular-nums`}>{value}{suffix}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(+e.target.value)}
      className="w-full h-1.5 bg-border/30 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg"
    />
  </div>
);

const ResultRow = ({ label, value, size }: { label: string; value: string; size: 'sm' | 'md' }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/8">
    <span className="text-sm text-foreground/80">{label}</span>
    <span className={`font-black text-red-400 tabular-nums ${size === 'md' ? 'text-lg' : 'text-base'}`}>{value}</span>
  </div>
);

export default RevenueCalculator;
