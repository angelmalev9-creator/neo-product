import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CheckCircle, Sparkles, ArrowRight, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, checkSubscription, subscription } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Check subscription status after successful payment
    const verifyPayment = async () => {
      setChecking(true);
      await checkSubscription();
      setChecking(false);
    };

    if (user) {
      verifyPayment();
    } else {
      setChecking(false);
    }
  }, [user]);

  const copyEmbedCode = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const embedCode = `<script src="${supabaseUrl}/functions/v1/widget-script?userId=${user?.id}"></script>`;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Копирано!',
      description: 'Кодът е копиран в клипборда',
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-8 pb-12">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neo-success/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative text-center">
        {/* Success animation */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neo-success/20 mb-6 animate-pulse">
          <CheckCircle className="w-10 h-10 text-neo-success" />
        </div>

        <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-4">
          Плащането е успешно! 🎉
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Благодарим ви, че избрахте NEO. Вашият AI асистент е готов за работа.
        </p>

        {checking ? (
          <div className="neo-glass neo-border-gradient rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-5 h-5 text-primary animate-spin" />
              <span className="text-foreground">Активиране на абонамента...</span>
            </div>
          </div>
        ) : subscription.subscribed ? (
          <div className="neo-glass neo-border-gradient rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Следваща стъпка: Интегрирайте NEO
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              Добавете този код към вашия уебсайт преди затварящия &lt;/body&gt; таг:
            </p>

            <div className="bg-background/50 rounded-lg p-4 font-mono text-xs border border-border/30 relative mb-4">
              <code className="text-muted-foreground break-all">
                {`<script src="https://neo-ai.com/widget.js" data-company="Your Company"></script>`}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyEmbedCode}
                className="absolute top-2 right-2"
              >
                {copied ? <Check className="w-4 h-4 text-neo-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Или влезте в таблото за да конфигурирате вашия AI асистент
            </p>
          </div>
        ) : (
          <div className="neo-glass rounded-2xl p-6 mb-8 border border-border/30">
            <p className="text-muted-foreground">
              Ако вече не сте влезли, моля влезте в акаунта си за да активирате абонамента.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-primary hover:bg-primary/90 neo-glow gap-2"
          >
            Към таблото
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            Обратно към сайта
          </Button>
        </div>

        {sessionId && (
          <p className="text-xs text-muted-foreground mt-8">
            Референция на плащане: {sessionId.substring(0, 20)}...
          </p>
        )}
      </div>
    </div>
  );
};

export default Success;
