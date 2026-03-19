import { Link } from 'react-router-dom';
import { ArrowLeft, Handshake, Mail, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';

const Partners = () => {
  return (
    <>
      <Helmet>
        <title>Партньорска програма | NEO AI</title>
        <meta name="description" content="Станете партньор на NEO AI и печелете комисионни, като препоръчвате нашия AI гласов асистент на клиентите си." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Обратно към началото</span>
          </Link>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 py-8 lg:py-16">
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center gap-2 neo-badge mb-4 py-1.5 px-4">
              <Handshake className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium text-sm">ПАРТНЬОРСКА ПРОГРАМА</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-black text-foreground mb-4">
              Печелете като <span className="neo-gradient-text">партньор</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Препоръчвайте NEO на клиентите си и получавайте комисионна за всяка успешна продажба
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            <div className="neo-glass-subtle rounded-xl p-6 border border-border/20 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">30% комисионна</h3>
              <p className="text-sm text-muted-foreground">
                Получавайте 30% от всеки абонамент, който доведете — завинаги, докато клиентът е активен
              </p>
            </div>

            <div className="neo-glass-subtle rounded-xl p-6 border border-border/20 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Лесно проследяване</h3>
              <p className="text-sm text-muted-foreground">
                Персонален линк и таблo за проследяване на всички препоръки и печалби в реално време
              </p>
            </div>

            <div className="neo-glass-subtle rounded-xl p-6 border border-border/20 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Маркетинг материали</h3>
              <p className="text-sm text-muted-foreground">
                Получавате готови банери, текстове и демо акаунт за показване на потенциални клиенти
              </p>
            </div>
          </div>

          {/* Who is it for */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-foreground text-center mb-8">За кого е подходящо?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: '🌐', title: 'Уеб агенции', desc: 'Добавете стойност към клиентските проекти' },
                { icon: '📱', title: 'Маркетинг агенции', desc: 'Предложете AI решение на бизнесите' },
                { icon: '💼', title: 'Бизнес консултанти', desc: 'Помогнете на клиентите да автоматизират' },
                { icon: '🔧', title: 'IT компании', desc: 'Интегрирайте NEO в решенията си' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 neo-glass-subtle rounded-lg border border-border/20">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="max-w-xl mx-auto text-center neo-glass-subtle rounded-2xl p-8 lg:p-12 border border-primary/20">
            <Building2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Готови ли сте да станете партньор?</h2>
            <p className="text-muted-foreground mb-6">
              Свържете се с нас и ще ви изпратим всички детайли за партньорската програма
            </p>
            <Button className="neo-glow gap-2" size="lg" asChild>
              <Link to="/#contact">
                <Mail className="w-4 h-4" />
                Свържете се с нас
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Партньорската програма стартира скоро. Регистрирайте интерес сега!
            </p>
          </div>
        </main>
      </div>
    </>
  );
};

export default Partners;
