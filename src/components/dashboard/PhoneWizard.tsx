import { useState, useEffect, useCallback } from 'react';
import { Phone, ArrowRight, CheckCircle, Copy, ChevronLeft, AlertCircle, Loader2, PhoneForwarded, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  { id: 'pbx', label: 'Бизнес централа', subtitle: 'PBX / IP' },
  { id: 'other', label: 'Друг оператор', subtitle: '' },
] as const;

function formatPhoneDisplay(phone: string) {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('+359')) {
    const rest = cleaned.slice(4);
    if (rest.length >= 8) {
      return `+359 ${rest.slice(0, 1)} ${rest.slice(1, 4)} ${rest.slice(4)}`;
    }
    return `+359 ${rest}`;
  }
  return phone;
}

function getForwardCode(phone: string) {
  const cleaned = phone.replace(/\s/g, '');
  return `*62*${cleaned}#`;
}

const steps = [
  { icon: Phone, label: 'Вашият номер' },
  { icon: PhoneForwarded, label: 'Пренасочване' },
  { icon: CheckCircle, label: 'Тест' },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
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

  // Auto-buy on step 0
  const autoBuy = useCallback(async () => {
    if (hasPhone || buying || boughtPhone) return;
    setBuying(true);
    try {
      // First get an available number
      const { data: listData, error: listErr } = await supabase.functions.invoke('list-available-numbers');
      if (listErr) throw listErr;
      const numbers = listData?.numbers || [];
      if (!numbers.length) {
        toast({ title: 'Няма налични номера', description: 'Моля, опитайте по-късно.', variant: 'destructive' });
        return;
      }
      const chosen = numbers[0];
      // Buy it
      const { data, error } = await supabase.functions.invoke('buy-phone-number', {
        body: { phoneNumber: chosen.phoneNumber, sessionId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBoughtPhone(data.phone.phone_number);
      setBoughtPhoneId(data.phone.id);
      toast({ title: 'Номерът е готов!' });
    } catch (err: any) {
      toast({ title: 'Грешка', description: err.message || 'Не успяхме да генерираме номер.', variant: 'destructive' });
    } finally {
      setBuying(false);
    }
  }, [hasPhone, buying, boughtPhone, sessionId, toast]);

  useEffect(() => {
    if (step === 0 && !hasPhone && !boughtPhone) {
      autoBuy();
    }
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
      await supabase
        .from('phone_numbers')
        .update({ setup_completed: true } as any)
        .eq('id', boughtPhoneId);
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
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">В настройките на Вашата PBX/IP централа задайте:</p>
          <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">No Answer Forward</p>
            <p className="text-xl font-mono font-bold tracking-wider">{phoneNumber}</p>
          </div>
          <p className="text-sm text-muted-foreground">Или се свържете с Вашия IT администратор.</p>
          <Button variant="outline" size="sm" onClick={() => copyText(phoneNumber)}>
            <Copy className="w-3.5 h-3.5 mr-1.5" /> Копирай номера
          </Button>
        </div>
      );
    }

    if (operator === 'other') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Обадете се на Вашия оператор и поискайте:</p>
          <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Заявка</p>
            <p className="text-sm font-medium">
              „Пренасочване при неотговаряне към <span className="font-mono font-bold">{phoneNumber}</span>"
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => copyText(phoneNumber)}>
            <Copy className="w-3.5 h-3.5 mr-1.5" /> Копирай номера
          </Button>
        </div>
      );
    }

    // A1, Yettel, Vivacom — same USSD
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">От телефона си наберете:</p>
        <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-center">
          <p className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-primary">{forwardCode}</p>
        </div>
        <p className="text-sm text-muted-foreground">Натиснете бутона за обаждане. Ще чуете потвърждение.</p>
        <p className="text-xs text-muted-foreground/70">Това пренасочва обажданията когато не отговаряте.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => copyText(forwardCode, 'Кодът е копиран!')}>
            <Copy className="w-3.5 h-3.5 mr-1.5" /> Копирай кода
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground/50 mt-2">За да спрете пренасочването: наберете <span className="font-mono">##62#</span></p>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Стъпка {step + 1} от 3</span>
          <span className="text-xs text-muted-foreground">{Math.round(((step + 1) / 3) * 100)}% завършено</span>
        </div>
        <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={false}
            animate={{ width: `${((step + 1) / 3) * 100}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <div className="flex justify-between mt-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isDone = i < step;
            const isActive = i === step;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isDone ? 'bg-emerald-500/15 text-emerald-500' :
                  isActive ? 'bg-primary/15 text-primary ring-2 ring-primary/30' :
                  'bg-muted/20 text-muted-foreground/40'
                }`}>
                  {isDone ? <CheckCircle className="w-4.5 h-4.5" /> : <Icon className="w-4.5 h-4.5" />}
                </div>
                <span className={`text-[11px] ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground/60'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
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
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {step === 0 && (
            <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-8 pb-6 text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Вашият NEO номер</h2>
                  <p className="text-sm text-muted-foreground mt-1">Това е номерът на Вашия NEO рецепционист</p>
                </div>

                {buying ? (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Генерираме Вашия номер...</span>
                  </div>
                ) : phoneNumber ? (
                  <>
                    <div className="bg-muted/30 border border-border/50 rounded-xl p-4 flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground mb-0.5">Вашият NEO номер</p>
                        <p className="text-2xl sm:text-3xl font-mono font-bold tracking-wider">{formatPhoneDisplay(phoneNumber)}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => copyText(phoneNumber)}>
                        <Copy className="w-4 h-4 mr-1" /> Копирай
                      </Button>
                    </div>

                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-left">
                      <p className="text-sm font-semibold mb-1">Какво следва?</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Ще пренасочите обажданията от текущия си бизнес номер към този номер.
                        Когато клиент Ви се обади и Вие не отговорите — NEO ще поеме разговора автоматично.
                      </p>
                    </div>

                    <Button onClick={goNext} className="w-full gap-2">
                      Продължи към пренасочване <ArrowRight className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <div className="py-6">
                    <p className="text-sm text-muted-foreground">Не успяхме да генерираме номер.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={autoBuy}>Опитай отново</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-8 pb-6 space-y-5">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <PhoneForwarded className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Пренасочете бизнес номера си</h2>
                  <p className="text-sm text-muted-foreground mt-1">Изберете Вашия оператор за точни инструкции</p>
                </div>

                {/* Operator tabs */}
                <div className="flex flex-wrap gap-1.5">
                  {OPERATORS.map(op => (
                    <button
                      key={op.id}
                      onClick={() => setOperator(op.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        operator === op.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      {op.label}
                      {op.subtitle && <span className="text-[10px] opacity-70 ml-1">({op.subtitle})</span>}
                    </button>
                  ))}
                </div>

                {renderOperatorInstructions()}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={goBack} className="gap-1.5">
                    <ChevronLeft className="w-4 h-4" /> Назад
                  </Button>
                  <Button onClick={goNext} className="flex-1 gap-2">
                    Готово, настроих пренасочването <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-border/30 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-8 pb-6 text-center space-y-5">
                <div className="relative w-20 h-20 mx-auto">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/10"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full bg-primary/15"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  />
                  <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <PhoneCall className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold">Всичко е готово! Нека тестваме.</h2>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                    Обадете се на бизнес номера си от друг телефон. Не вдигайте.
                    NEO трябва да отговори след 4–5 позвънявания.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button onClick={completeSetup} disabled={completing} className="w-full gap-2">
                    {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    NEO отговори — работи!
                  </Button>
                  <Button variant="outline" onClick={() => setShowHelp(v => !v)} className="w-full gap-2">
                    <AlertCircle className="w-4 h-4" />
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
                      <div className="bg-muted/20 border border-border/30 rounded-xl p-4 text-left space-y-2 mt-2">
                        <p className="text-sm font-semibold">Проверете следното:</p>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                          <li className="flex gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            Проверете дали сте набрали правилния код за пренасочване
                          </li>
                          <li className="flex gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            Проверете дали NEO номерът е правилен: <span className="font-mono font-medium">{phoneNumber}</span>
                          </li>
                          <li className="flex gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            Изчакайте 5 минути и опитайте отново
                          </li>
                          <li className="flex gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            Свържете се с нас: <a href="mailto:support@neo-assistant.com" className="text-primary underline">support@neo-assistant.com</a>
                          </li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
                  <ChevronLeft className="w-4 h-4" /> Назад
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
