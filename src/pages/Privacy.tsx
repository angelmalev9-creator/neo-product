import { Bot, ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Privacy = () => {
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

      {/* Content */}
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Shield className="w-10 h-10 text-primary" />
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Политика за поверителност</h1>
                <p className="text-muted-foreground">Последна актуализация: 20 декември 2024</p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">1. Въведение</h2>
                <p className="text-muted-foreground">
                  NEO AI („ние", „нас", „наш") уважава поверителността на вашите данни. Тази политика обяснява как събираме, използваме и защитаваме вашата информация при използването на нашата AI гласова асистентска платформа.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">2. Какви данни събираме</h2>
                <p className="text-muted-foreground mb-4">Събираме следните видове информация:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Информация за акаунта:</strong> Имейл адрес, парола (криптирана), име на компания</li>
                  <li><strong>Бизнес информация:</strong> URL на уебсайт, съдържание извлечено от вашия сайт</li>
                  <li><strong>Данни за разговори:</strong> Транскрипции на разговори между NEO и вашите клиенти</li>
                  <li><strong>Данни за контакти:</strong> Информация събрана от потенциални клиенти чрез NEO</li>
                  <li><strong>Технически данни:</strong> IP адрес, тип браузър, устройство</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">3. Как използваме вашите данни</h2>
                <p className="text-muted-foreground mb-4">Използваме събраната информация за:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Предоставяне и подобряване на услугата NEO AI</li>
                  <li>Персонализиране на отговорите на AI асистента</li>
                  <li>Обработка на плащания и управление на абонаменти</li>
                  <li>Изпращане на технически известия и актуализации</li>
                  <li>Анализ на употребата за подобряване на платформата</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">4. Съхранение на данни</h2>
                <p className="text-muted-foreground">
                  Данните ви се съхраняват на сигурни сървъри в Европейския съюз. Използваме криптиране при пренос (TLS) и в покой. Достъпът до данните е ограничен до оторизиран персонал.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">5. Споделяне на данни</h2>
                <p className="text-muted-foreground mb-4">НЕ продаваме вашите данни. Можем да споделяме информация с:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Доставчици на услуги:</strong> Stripe (плащания), Supabase (хостинг), Google (AI модели)</li>
                  <li><strong>Правни органи:</strong> При законово изискване</li>
                  <li><strong>Бизнес прехвърляния:</strong> При сливане или придобиване</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">6. Вашите права</h2>
                <p className="text-muted-foreground mb-4">Съгласно GDPR имате право да:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Достъпвате до вашите данни</li>
                  <li>Коригирате неточна информация</li>
                  <li>Изтриете вашите данни („правото да бъдеш забравен")</li>
                  <li>Ограничите обработката на данни</li>
                  <li>Преносите вашите данни</li>
                  <li>Възразите срещу обработката</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">7. Бисквитки</h2>
                <p className="text-muted-foreground">
                  Използваме бисквитки за поддържане на сесии и анализ на трафика. Вижте нашата <Link to="/cookies" className="text-primary hover:underline">Политика за бисквитки</Link> за повече информация.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">8. Сигурност</h2>
                <p className="text-muted-foreground">
                  Прилагаме индустриално стандартни мерки за сигурност, включително криптиране, контрол на достъпа и редовни одити. Въпреки това, никоя система не е 100% сигурна.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">9. Промени в политиката</h2>
                <p className="text-muted-foreground">
                  Можем да актуализираме тази политика. При съществени промени ще публикуваме известие на платформата и ще актуализираме датата в горната част.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">10. Контакт</h2>
                <p className="text-muted-foreground">
                  За въпроси относно поверителността на данните, свържете се с нас на: <a href="mailto:angelmalev9@gmail.com" className="text-primary hover:underline">angelmalev9@gmail.com</a>
                </p>
              </section>
            </div>
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

export default Privacy;
