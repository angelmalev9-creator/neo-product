import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, Crown, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import NeoLogo from '@/components/ui/NeoLogo';

const authSchema = z.object({
  email: z.string().email('Невалиден имейл адрес'),
  password: z.string().min(6, 'Паролата трябва да е поне 6 символа'),
  fullName: z.string().optional(),
});

const PLAN_NAMES: Record<string, string> = {
  starter: 'NEO Старт (25 €/мес)',
  growth: 'NEO Растеж (75 €/мес)',
  empire: 'NEO Империя (249 €/мес)',
};

const PLAN_PRICE_IDS: Record<string, string> = {
  starter: 'price_1ScXAJJnrCo2ucK9IOKPxALR',
  growth: 'price_1ScVIyJnrCo2ucK9hi8TBLSs',
  empire: 'price_1ScVJRJnrCo2ucK9sFBZRUPM',
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan');
  const mode = searchParams.get('mode'); // 'reset' for password reset
  
  // Registration only allowed with a plan, otherwise login only
  const [isLogin, setIsLogin] = useState(!selectedPlan);
  const [isForgotPassword, setIsForgotPassword] = useState(mode === 'reset');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && selectedPlan) {
      // Link demo session and redirect to checkout
      linkDemoSession().then(() => {
        // Redirect to pricing page to complete checkout through Stripe
        navigate(`/#pricing`);
        toast({
          title: 'Моля, завършете плащането',
          description: 'Изберете план за да активирате абонамента си',
        });
      });
    } else if (user) {
      navigate('/dashboard');
    }
  }, [user, selectedPlan, navigate]);

  const linkDemoSession = async () => {
    if (!user) return;
    
    try {
      // Find any demo session tokens in sessionStorage
      const keys = Object.keys(sessionStorage);
      for (const key of keys) {
        if (key.startsWith('neo_session_')) {
          const sessionId = key.replace('neo_session_', '');
          const sessionToken = sessionStorage.getItem(key);
          
          if (sessionId && sessionToken) {
            // Link this demo session to the user
            const { error } = await supabase
              .from('demo_sessions')
              .update({ user_id: user.id })
              .eq('id', sessionId)
              .eq('session_token', sessionToken);
            
            if (!error) {
              console.log('Demo session linked:', sessionId);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to link demo session:', err);
    }
  };

  const validateForm = () => {
    try {
      authSchema.parse({ email, password, fullName: isLogin ? undefined : fullName });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setErrors({ email: 'Моля въведете имейл' });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      
      if (error) {
        toast({
          title: 'Грешка',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setResetEmailSent(true);
        toast({
          title: 'Имейл изпратен!',
          description: 'Проверете имейла си за линк за възстановяване на паролата',
        });
      }
    } catch (err) {
      toast({
        title: 'Грешка',
        description: 'Нещо се обърка. Опитайте отново.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      setErrors({ password: 'Паролата трябва да е поне 6 символа' });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        toast({
          title: 'Грешка',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Паролата е променена!',
          description: 'Вече можете да влезете с новата си парола',
        });
        navigate('/dashboard');
      }
    } catch (err) {
      toast({
        title: 'Грешка',
        description: 'Нещо се обърка. Опитайте отново.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Грешка при вход',
              description: 'Невалиден имейл или парола',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Грешка',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          if (!selectedPlan) {
            toast({
              title: 'Добре дошли!',
              description: 'Успешен вход в системата',
            });
            navigate('/dashboard');
          }
          // If selectedPlan exists, useEffect will handle redirect to checkout
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Грешка при регистрация',
              description: 'Този имейл вече е регистриран. Влезте с паролата си.',
              variant: 'destructive',
            });
            setIsLogin(true);
          } else {
            toast({
              title: 'Грешка',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          if (!selectedPlan) {
            toast({
              title: 'Успешна регистрация!',
              description: 'Вече можете да влезете в акаунта си',
            });
            navigate('/dashboard');
          }
          // If selectedPlan exists, useEffect will handle redirect to checkout
        }
      }
    } catch (err) {
      toast({
        title: 'Грешка',
        description: 'Нещо се обърка. Опитайте отново.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      toast({
        title: 'Грешка',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-8 pb-12">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Обратно към сайта
        </button>

        {/* Auth card */}
        <div className="neo-glass neo-border-gradient rounded-xl sm:rounded-2xl p-5 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <NeoLogo size="lg" />
            </div>
            
            {/* Show selected plan if coming from pricing */}
            {selectedPlan && !isForgotPassword && mode !== 'reset' && (
              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-medium">{PLAN_NAMES[selectedPlan] || selectedPlan}</span>
                </div>
              </div>
            )}
            
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1.5 sm:mb-2">
              {mode === 'reset' 
                ? 'Нова парола'
                : isForgotPassword 
                  ? 'Забравена парола' 
                  : isLogin 
                    ? 'Добре дошли обратно' 
                    : selectedPlan 
                      ? 'Създайте акаунт' 
                      : 'Регистрация'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'reset'
                ? 'Въведете новата си парола'
                : isForgotPassword 
                  ? 'Въведете имейла си за възстановяване'
                  : isLogin 
                    ? 'Влезте в клиентския портал' 
                    : selectedPlan 
                      ? 'Регистрирайте се за да продължите към плащане' 
                      : 'Регистрирайте се за NEO'
              }
            </p>
          </div>

          {/* Form */}
          {mode === 'reset' ? (
            // Password Reset Form (after clicking email link)
            <form onSubmit={handleResetPassword} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="newPassword" className="text-sm">Нова парола</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`bg-background/50 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs sm:text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-5 sm:py-6 neo-glow text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? 'Зареждане...' : 'Запази новата парола'}
              </Button>
            </form>
          ) : isForgotPassword ? (
            // Forgot Password Form
            <form onSubmit={handleForgotPassword} className="space-y-3 sm:space-y-4">
              {resetEmailSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    Изпратихме имейл с линк за възстановяване на паролата.
                    Проверете входящата си поща.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="email" className="text-sm">Имейл</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`bg-background/50 ${errors.email ? 'border-destructive' : ''}`}
                    />
                    {errors.email && (
                      <p className="text-xs sm:text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-5 sm:py-6 neo-glow text-sm sm:text-base"
                    disabled={loading}
                  >
                    {loading ? 'Зареждане...' : 'Изпрати линк за възстановяване'}
                  </Button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetEmailSent(false);
                  setErrors({});
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                ← Обратно към вход
              </button>
            </form>
          ) : (
            // Regular Login/Register Form
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {!isLogin && (
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="fullName" className="text-sm">Име</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Вашето име"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              )}

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-sm">Имейл</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`bg-background/50 ${errors.email ? 'border-destructive' : ''}`}
                />
                {errors.email && (
                  <p className="text-xs sm:text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm">Парола</Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setErrors({});
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Забравена парола?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`bg-background/50 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs sm:text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-5 sm:py-6 neo-glow text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? 'Зареждане...' : isLogin ? 'Вход' : selectedPlan ? 'Регистрация и плащане' : 'Регистрация'}
              </Button>
            </form>
          )}

          {/* Toggle - only show when not in forgot password or reset mode */}
          {!isForgotPassword && mode !== 'reset' && (
            <div className="mt-4 sm:mt-6 text-center">
              {selectedPlan ? (
                <p className="text-sm text-muted-foreground">
                  {isLogin ? 'Нямате акаунт?' : 'Вече имате акаунт?'}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrors({});
                    }}
                    className="text-primary hover:underline ml-1 font-medium"
                  >
                    {isLogin ? 'Регистрирайте се' : 'Влезте'}
                  </button>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Нямате акаунт?{' '}
                  <button
                    onClick={() => navigate('/#pricing')}
                    className="text-primary hover:underline font-medium"
                  >
                    Изберете план
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
