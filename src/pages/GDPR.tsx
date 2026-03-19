import { Bot, ArrowLeft, Shield, CheckCircle, FileText, Users, Lock, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const GDPR = () => {
  const rights = [
    {
      icon: FileText,
      title: 'Право на достъп',
      description: 'Можете да поискате копие на всички лични данни, които съхраняваме за вас.'
    },
    {
      icon: CheckCircle,
      title: 'Право на корекция',
      description: 'Имате право да поискате коригиране на неточни или непълни данни.'
    },
    {
      icon: Trash2,
      title: 'Право на изтриване',
      description: 'Можете да поискате изтриване на вашите данни („правото да бъдеш забравен").'
    },
    {
      icon: Lock,
      title: 'Право на ограничаване',
      description: 'Можете да ограничите обработката на вашите данни при определени обстоятелства.'
    },
    {
      icon: Users,
      title: 'Право на преносимост',
      description: 'Можете да получите вашите данни в машинно четим формат.'
    },
    {
      icon: Shield,
      title: 'Право на възражение',
      description: 'Можете да възразите срещу обработката на данни за директен маркетинг.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Към началната страница</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-foreground">NEO AI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            GDPR Съответствие
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-black text-foreground mb-6">
            NEO AI и GDPR
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ангажирани сме със защитата на вашите лични данни в съответствие с Общия регламент относно защитата на данните (GDPR).
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* What is GDPR */}
            <section className="mb-16">
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">Какво е GDPR?</h2>
              <p className="text-muted-foreground mb-4">
                Общият регламент относно защитата на данните (GDPR) е регламент на Европейския съюз, който влезе в сила на 25 май 2018 г. Той има за цел да даде на гражданите контрол върху личните им данни и да опрости регулаторната среда за международния бизнес.
              </p>
              <p className="text-muted-foreground">
                NEO AI е напълно съобразен с изискванията на GDPR, като осигурява прозрачност, сигурност и контрол върху вашите данни.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-16">
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">Вашите права по GDPR</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rights.map((right, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <right.icon className="w-5 h-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{right.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{right.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* How We Comply */}
            <section className="mb-16">
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">Как NEO AI спазва GDPR</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-primary pl-6">
                  <h3 className="font-bold text-foreground mb-2">Законна основа за обработка</h3>
                  <p className="text-muted-foreground">Обработваме данни само на законно основание - съгласие, договорно задължение или легитимен интерес.</p>
                </div>
                <div className="border-l-4 border-primary pl-6">
                  <h3 className="font-bold text-foreground mb-2">Минимизиране на данните</h3>
                  <p className="text-muted-foreground">Събираме само данни, необходими за предоставяне на услугата.</p>
                </div>
                <div className="border-l-4 border-primary pl-6">
                  <h3 className="font-bold text-foreground mb-2">Криптиране и сигурност</h3>
                  <p className="text-muted-foreground">Всички данни се криптират при пренос (TLS) и в покой. Използваме сигурни сървъри в ЕС.</p>
                </div>
                <div className="border-l-4 border-primary pl-6">
                  <h3 className="font-bold text-foreground mb-2">Ограничено съхранение</h3>
                  <p className="text-muted-foreground">Съхраняваме данни само докато са необходими за целта, за която са събрани.</p>
                </div>
                <div className="border-l-4 border-primary pl-6">
                  <h3 className="font-bold text-foreground mb-2">Доставчици с DPA</h3>
                  <p className="text-muted-foreground">Работим само с доставчици, които имат подписани Споразумения за обработка на данни (DPA).</p>
                </div>
              </div>
            </section>

            {/* Data Processing */}
            <section className="mb-16">
              <h2 className="text-2xl font-display font-bold text-foreground mb-6">Обработка на данни от NEO</h2>
              <Card>
                <CardContent className="p-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 text-foreground">Тип данни</th>
                        <th className="text-left py-3 text-foreground">Цел</th>
                        <th className="text-left py-3 text-foreground">Период на съхранение</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b">
                        <td className="py-3">Имейл адрес</td>
                        <td className="py-3">Акаунт и комуникация</td>
                        <td className="py-3">До изтриване на акаунта</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3">Бизнес информация</td>
                        <td className="py-3">Персонализация на NEO</td>
                        <td className="py-3">До изтриване на акаунта</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3">Разговори</td>
                        <td className="py-3">Предоставяне на услугата</td>
                        <td className="py-3">90 дни</td>
                      </tr>
                      <tr>
                        <td className="py-3">Аналитични данни</td>
                        <td className="py-3">Подобряване на услугата</td>
                        <td className="py-3">12 месеца (анонимизирани)</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </section>

            {/* Contact */}
            <section className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">Имате въпроси?</h2>
              <p className="text-muted-foreground mb-6">
                За упражняване на вашите права или въпроси относно GDPR, свържете се с нас:
              </p>
              <Button asChild size="lg">
                <a href="mailto:angelmalev9@gmail.com">
                  Свържете се с нас
                </a>
              </Button>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} NEO AI. Всички права запазени.</p>
        </div>
      </footer>
    </div>
  );
};

export default GDPR;
