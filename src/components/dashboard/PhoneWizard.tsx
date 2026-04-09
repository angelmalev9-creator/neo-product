import { useState, useEffect, useCallback } from 'react';
import { Phone, ArrowRight, CheckCircle, Copy, ChevronLeft, AlertCircle, Loader2, PhoneForwarded, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PhoneWizardProps {
  userId: string;
  sessionId?: string;
  activePhone: {
    id: string;
    phone_number: string;
    setup_completed?: boolean;
  } | null;
  onComplete: () => void;
}

const OPERATORS = [
  { id: 'a1', label: 'A1', subtitle: 'бивш Мтел' },
  { id: 'yettel', label: 'Yettel', subtitle: 'бивш Теленор' },
  { id: 'vivacom', label: 'Vivacom', subtitle: '' },
  { id: 'pbx', label: 'PBX', subtitle: '' },
  { id: 'other', label: 'Друг', subtitle: '' },
] as const;

function formatPhoneDisplay(phone: string) {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('+359')) {
    const rest = cleaned.slice(4);
    if (rest.length >= 8) return `+359 ${rest.slice(0, 1)} ${rest.slice(1, 4)} ${rest.slice(4)}`;
    return `+359 ${rest}`;
  }
  return phone;
}

function getForwardCode(phone: string) {
  return `*62*${phone.replace(/\s/g, '')}#`;
}

const STEPS = [
  { icon: Phone, label: 'Номер' },
  { icon: PhoneForwarded, label: 'Пренасочване' },
  { icon: CheckCircle, label: 'Тест' },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 120 : -120, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -120 : 120, opacity: 0 }),
};

export default function PhoneWizard({ userId, sessionId, activePhone, onComplete }: PhoneWizardProps) {
  const { toast } = useToast();
  const hasPhone = !!activePhone;
  const [step, setStep] = useState(hasPhone ? 1 : 0);
  const [direction, setDirection] = useState(1);
  const [buying, setBuying] = useState(false);
  const [boughtPhone, setBoughtPhone] = useState(activePhone?.phone_number || '');
  const [boughtPhoneId, setBoughtPhoneId] = useState(activePhone?.id || '');
  const [operator, setOperator] = useState('a1');
  const [showHelp, setShowHelp] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const autoBuy = useCallback(async () => {
    if (hasPhone || buying || boughtPhone) return;
    setBuying(true);
    setBuyError(null);
    try {
      const { data: listData, error: listErr } = await supabase.functions.invoke('list-available-numbers');
      if (listErr) throw listErr;
      const numbers = listData?.numbers || [];
      if (!numbers.length) {
        setBuyError('Няма налични номера в момента. Моля, опитайте по-късно.');
        return;
      }
      const { data, error } = await supabase.functions.invoke('buy-phone-number', {
        body: { phoneNumber: numbers[0].phoneNumber, sessionId },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.upgrade_required) {
          setUpgradeRequired(true);
          setBuyError('Телефонната услуга все още не е активирана. Моля, свържете се с екипа на NEO за активиране.');
        } else {
          setBuyError(data.error);
        }
        return;
      }
      setBoughtPhone(data.phone.phone_number);
      setBoughtPhoneId(data.phone.id);
      toast({ title: 'Номерът е готов!' });
    } catch (err: any) {
      setBuyError(err.message || 'Не успяхме да генерираме номер.');
    } finally {
      setBuying(false);
    }
  }, [hasPhone, buying, boughtPhone, sessionId, toast]);

  useEffect(() => {
    if (step === 0 && !hasPhone && !boughtPhone) autoBuy();
  }, [step, hasPhone, boughtPhone, autoBuy]);

  useEffect(() => {
    if (hasPhone && activePhone) {
      setBoughtPhone(activePhone.phone_number);
      setBoughtPhoneId(activePhone.id);
    }
  }, [hasPhone, activePhone]);

  const phoneNumber = boughtPhone;
  const forwardCode = getForwardCode(phoneNumber);

  const goNext = () => { setDirection(1); setStep(s => Math.min(s + 1, 2)); };
  const goBack = () => { setDirection(-1); setStep(s => Math.max(s - 1, 0)); };

  const copyText = (text: string, label = 'Копирано!') => {
    navigator.clipboard.writeText(text);
    toast({ title: label });
  };

  const completeSetup = async () => {
    setCompleting(true);
    try {
      await supabase.from('phone_numbers').update({ setup_completed: true } as any).eq('id', boughtPhoneId);
      toast({ title: 'Готово!', description: 'Телефонната линия е активна.' });
      onComplete();
    } catch {
      toast({ title: 'Грешка', variant: 'destructive' });
    } finally {
      setCompleting(false);
    }
  };

  const renderOperatorInstructions = () => {
    if (operator === 'pbx') {
      return (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">В настройките на PBX/IP централа:</p>
          <div className="bg-muted/20 border border-border/40 rounded-lg p-2.5">
            <p className="text-[10px] text-muted-foreground mb-0.5">No Answer Forward</p>
            <p className="text-base font-mono font-bold tracking-wider">{phoneNumber}</p>
          </div>
          <p className="text-xs text-muted-foreground">Или се свържете с IT администратор.</p>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copyText(phoneNumber)}>
            <Copy className="w-3 h-3 mr-1" /> Копирай
          </Button>
        </div>
      );
    }

    if (operator === 'other') {
      return (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Обадете се на оператора и поискайте:</p>
          <div className="bg-muted/20 border border-border/40 rounded-lg p-2.5">
            <p className="text-xs">„Пренасочване при неотговаряне към <span className="font-mono font-bold">{phoneNumber}</span>"</p>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copyText(phoneNumber)}>
            <Copy className="w-3 h-3 mr-1" /> Копирай
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">От телефона си наберете:</p>
        <div className="bg-muted/20 border border-border/40 rounded-lg p-3 text-center">
          <p className="text-lg sm:text-xl font-mono font-bold tracking-widest text-primary">{forwardCode}</p>
        </div>
        <p className="text-xs text-muted-foreground">Натиснете обаждане. Ще чуете потвърждение.</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => copyText(forwardCode, 'Кодът е копиран!')}>
            <Copy className="w-3 h-3 mr-1" /> Копирай кода
          </Button>
          <span className="text-[10px] text-muted-foreground/50">Спиране: <span className="font-mono">##62#</span></span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4">
      <div className="max-w-lg mx-auto space-y-3">
        {/* Compact progress */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = i < step;
            const isActive = i === step;
            return (
              <div key={i} className="flex items-center gap-1.5 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isDone ? 'bg-emerald-500/15 text-emerald-500' :
                  isActive ? 'bg-primary/15 text-primary ring-1.5 ring-primary/30' :
                  'bg-muted/20 text-muted-foreground/40'
                }`}>
                  {isDone ? <CheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                </div>
                <span className={`text-[10px] hidden sm:inline ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground/50'}`}>
                  {s.label}
                </span>
                {i < 2 && <div className={`flex-1 h-px ${isDone ? 'bg-emerald-500/30' : 'bg-border/30'}`} />}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            {/* Step 0 — Number */}
            {step === 0 && (
              <div className="bg-card/50 border border-border/30 backdrop-blur-sm rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Вашият NEO номер</h3>
                    <p className="text-[11px] text-muted-foreground">Номерът на Вашия NEO рецепционист</p>
                  </div>
                </div>

                {buying ? (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Генерираме номер...</span>
                  </div>
                ) : phoneNumber ? (
                  <>
                    <div className="bg-muted/20 border border-border/40 rounded-lg p-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">NEO номер</p>
                        <p className="text-lg font-mono font-bold tracking-wider">{formatPhoneDisplay(phoneNumber)}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => copyText(phoneNumber)}>
                        <Copy className="w-3 h-3 mr-1" /> Копирай
                      </Button>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                      <p className="text-xs font-semibold mb-0.5">Какво следва?</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Пренасочвате обажданията от бизнес номера си. Когато не отговорите — NEO поема автоматично.
                      </p>
                    </div>

                    <Button onClick={goNext} size="sm" className="w-full gap-1.5 h-8 text-xs">
                      Продължи <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-3 space-y-2">
                    <AlertCircle className="w-5 h-5 text-destructive mx-auto" />
                    <p className="text-xs text-muted-foreground">{buyError || 'Не успяхме да генерираме номер.'}</p>
                    {!upgradeRequired && (
                      <Button variant="outline" size="sm" className="mt-1 h-7 text-xs" onClick={autoBuy}>Опитай отново</Button>
                    )}
                    {upgradeRequired && (
                      <a href="mailto:support@neo-assistant.com" className="text-xs text-primary underline">Свържете се с нас</a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 1 — Forwarding */}
            {step === 1 && (
              <div className="bg-card/50 border border-border/30 backdrop-blur-sm rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <PhoneForwarded className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Пренасочете бизнес номера си</h3>
                    <p className="text-[11px] text-muted-foreground">Изберете оператор за инструкции</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {OPERATORS.map(op => (
                    <button
                      key={op.id}
                      onClick={() => setOperator(op.id)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        operator === op.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/20 text-muted-foreground hover:bg-muted/30'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>

                {renderOperatorInstructions()}

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={goBack} className="h-8 text-xs gap-1">
                    <ChevronLeft className="w-3.5 h-3.5" /> Назад
                  </Button>
                  <Button size="sm" onClick={goNext} className="flex-1 h-8 text-xs gap-1">
                    Готово <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2 — Test */}
            {step === 2 && (
              <div className="bg-card/50 border border-border/30 backdrop-blur-sm rounded-xl p-4 space-y-3 text-center">
                <div className="relative w-14 h-14 mx-auto">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/10"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-1 rounded-full bg-primary/15"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  />
                  <div className="absolute inset-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <PhoneCall className="w-6 h-6 text-primary" />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold">Нека тестваме!</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed max-w-xs mx-auto">
                    Обадете се на бизнес номера от друг телефон. Не вдигайте — NEO отговаря след 4–5 позвънявания.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Button size="sm" onClick={completeSetup} disabled={completing} className="w-full h-8 text-xs gap-1.5">
                    {completing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    NEO отговори — работи!
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowHelp(v => !v)} className="w-full h-8 text-xs gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    NEO не отговори — помощ
                  </Button>
                </div>

                <AnimatePresence>
                  {showHelp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-muted/20 border border-border/30 rounded-lg p-3 text-left space-y-1">
                        <p className="text-xs font-semibold">Проверете:</p>
                        <ul className="space-y-1 text-[11px] text-muted-foreground">
                          <li className="flex gap-1.5"><span className="text-primary">•</span>Правилен код за пренасочване</li>
                          <li className="flex gap-1.5"><span className="text-primary">•</span>NEO номер: <span className="font-mono">{phoneNumber}</span></li>
                          <li className="flex gap-1.5"><span className="text-primary">•</span>Изчакайте 5 мин. и опитайте пак</li>
                          <li className="flex gap-1.5"><span className="text-primary">•</span><a href="mailto:support@neo-assistant.com" className="text-primary underline">support@neo-assistant.com</a></li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button variant="ghost" size="sm" onClick={goBack} className="h-7 text-xs gap-1">
                  <ChevronLeft className="w-3 h-3" /> Назад
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
