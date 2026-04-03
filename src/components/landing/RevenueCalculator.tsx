import { useState, useMemo } from 'react';
import { Calculator, TrendingDown, ArrowRight, Phone, Clock, DollarSign } from 'lucide-react';
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
    const monthlyLost = dailyLost * 22; // work days
    const yearlyLost = monthlyLost * 12;
    const neoPrice = 25; // starter plan
    const roi = Math.round((monthlyLost / neoPrice) * 100) / 100;
    return { dailyLost, monthlyLost, yearlyLost, roi };
  }, [missedCalls, avgDealValue, conversionRate]);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="calculator"
      className={`py-20 sm:py-28 relative neo-section-hidden ${isVisible ? 'neo-section-visible' : ''}`}
    >
      <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-[10px] font-semibold mb-4 uppercase tracking-[0.15em]">
            <Calculator className="w-3 h-3" />
            Калкулатор
          </span>
          <h2 className="text-lg sm:text-xl md:text-2xl font-display font-black text-foreground leading-[1.08] tracking-tight mb-3">
            Колко губите от{' '}
            <span className="text-primary">пропуснати обаждания?</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Изчислете реалната цена на всяко пропуснато обаждане за Вашия бизнес.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
          {/* Sliders */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Missed calls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Phone className="w-4 h-4 text-primary" />
                  Пропуснати обаждания на ден
                </label>
                <span className="text-lg font-black text-primary tabular-nums">{missedCalls}</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={missedCalls}
                onChange={e => setMissedCalls(+e.target.value)}
                className="w-full h-1.5 bg-border/30 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary/30"
              />
              <div className="flex justify-between text-[10px] text-foreground/20">
                <span>1</span>
                <span>30</span>
              </div>
            </div>

            {/* Average deal value */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Средна стойност на поръчка (EUR)
                </label>
                <span className="text-lg font-black text-emerald-400 tabular-nums">{avgDealValue}</span>
              </div>
              <input
                type="range"
                min={10}
                max={500}
                step={10}
                value={avgDealValue}
                onChange={e => setAvgDealValue(+e.target.value)}
                className="w-full h-1.5 bg-border/30 rounded-full appearance-none cursor-pointer accent-emerald-400 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-400/30"
              />
              <div className="flex justify-between text-[10px] text-foreground/20">
                <span>10 EUR</span>
                <span>500 EUR</span>
              </div>
            </div>

            {/* Conversion rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Конверсия от обаждане в клиент (%)
                </label>
                <span className="text-lg font-black text-amber-400 tabular-nums">{conversionRate}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={80}
                step={5}
                value={conversionRate}
                onChange={e => setConversionRate(+e.target.value)}
                className="w-full h-1.5 bg-border/30 rounded-full appearance-none cursor-pointer accent-amber-400 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-400/30"
              />
              <div className="flex justify-between text-[10px] text-foreground/20">
                <span>5%</span>
                <span>80%</span>
              </div>
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border/15 bg-card/30 backdrop-blur-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/10 bg-card/40">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Загуби без NEO</span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between py-2.5 border-b border-border/8">
                  <span className="text-sm text-foreground/60">На ден</span>
                  <span className="text-lg font-black text-red-400 tabular-nums">
                    -{results.dailyLost.toFixed(0)} EUR
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-border/8">
                  <span className="text-sm text-foreground/60">На месец</span>
                  <span className="text-xl font-black text-red-400 tabular-nums">
                    -{results.monthlyLost.toFixed(0)} EUR
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 rounded-xl bg-red-500/8 px-4 -mx-1">
                  <span className="text-sm font-semibold text-foreground">На година</span>
                  <span className="text-2xl font-black text-red-400 tabular-nums">
                    -{results.yearlyLost.toFixed(0)} EUR
                  </span>
                </div>
              </div>
            </div>

            {/* ROI comparison */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
              <p className="text-xs text-foreground/50 mb-1">С NEO (от 25 EUR/мес) спасявате:</p>
              <p className="text-xl font-black text-emerald-400 tabular-nums">
                {results.monthlyLost.toFixed(0)} EUR / месец
              </p>
              <p className="text-[10px] text-foreground/30 mt-1">
                Възвръщаемост: {results.roi.toFixed(0)}x на инвестицията
              </p>
            </div>

            <Button
              className="neo-btn-primary w-full text-xs px-6 py-3 h-auto font-bold rounded-full group gap-2"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Спрете загубите — пробвайте NEO безплатно
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RevenueCalculator;
