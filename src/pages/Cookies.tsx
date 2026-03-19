import { Bot, ArrowLeft, Cookie } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const Cookies = () => {
  const cookieTypes = [
    {
      name: 'Необходими бисквитки',
      description: 'Тези бисквитки са задължителни за функционирането на уебсайта. Те позволяват основни функции като навигация и достъп до защитени зони.',
      examples: ['Сесийни бисквитки', 'Бисквитки за автентикация', 'Бисквитки за сигурност'],
      canDisable: false
    },
    {
      name: 'Функционални бисквитки',
      description: 'Тези бисквитки запомнят вашите предпочитания и персонализират вашето изживяване.',
      examples: ['Езикови настройки', 'Тема (светла/тъмна)', 'Запомнени форми'],
      canDisable: true
    },
    {
      name: 'Аналитични бисквитки',
      description: 'Използваме тези бисквитки за разбиране как посетителите използват нашия сайт.',
      examples: ['Google Analytics', 'Статистики за посещения', 'Анализ на поведение'],
      canDisable: true
    },
    {
      name: 'Маркетингови бисквитки',
      description: 'Тези бисквитки се използват за показване на релевантни реклами.',
      examples: ['Рекламни партньори', 'Ремаркетинг', 'Социални мрежи'],
      canDisable: true
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

      {/* Content */}
      <main className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Cookie className="w-10 h-10 text-primary" />
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Политика за бисквитки</h1>
                <p className="text-muted-foreground">Последна актуализация: 20 декември 2024</p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">Какво са бисквитки?</h2>
                <p className="text-muted-foreground">
                  Бисквитките са малки текстови файлове, които се съхраняват на вашето устройство (компютър, телефон, таблет), когато посещавате уебсайт. Те помагат на сайта да запомни информация за вашето посещение, което може да направи следващото ви посещение по-лесно и сайта по-полезен за вас.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">Как NEO AI използва бисквитки</h2>
                <p className="text-muted-foreground mb-6">
                  Използваме бисквитки за различни цели, включително подобряване на функционалността на сайта, анализ на трафика и персонализиране на съдържанието.
                </p>
                
                <div className="space-y-4">
                  {cookieTypes.map((type, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-foreground">{type.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${type.canDisable ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                            {type.canDisable ? 'Незадължителни' : 'Задължителни'}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">{type.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {type.examples.map((example, i) => (
                            <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                              {example}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">Бисквитки от трети страни</h2>
                <p className="text-muted-foreground mb-4">
                  Някои бисквитки се поставят от трети страни, които предоставят услуги на нашия уебсайт:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Supabase:</strong> За автентикация и сесии</li>
                  <li><strong>Stripe:</strong> За обработка на плащания</li>
                  <li><strong>Google:</strong> За анализ и AI услуги</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">Управление на бисквитки</h2>
                <p className="text-muted-foreground mb-4">
                  Можете да контролирате и/или изтривате бисквитки по ваше желание. Можете да изтриете всички бисквитки, които вече са на вашия компютър, и можете да настроите повечето браузъри да ги блокират.
                </p>
                <p className="text-muted-foreground">
                  Ако изберете да блокирате бисквитките, може да не можете да използвате всички функции на нашия сайт. Задължителните бисквитки са необходими за правилното функциониране на платформата.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">Как да управлявате бисквитки в браузъра</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li><strong>Chrome:</strong> Настройки → Поверителност и сигурност → Бисквитки</li>
                  <li><strong>Firefox:</strong> Настройки → Поверителност и сигурност → Бисквитки</li>
                  <li><strong>Safari:</strong> Предпочитания → Поверителност → Бисквитки</li>
                  <li><strong>Edge:</strong> Настройки → Бисквитки и разрешения за сайтове</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">Промени в политиката</h2>
                <p className="text-muted-foreground">
                  Можем да актуализираме тази политика за бисквитки периодично. Промените ще бъдат публикувани на тази страница с актуализирана дата.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">Контакт</h2>
                <p className="text-muted-foreground">
                  За въпроси относно нашата политика за бисквитки, свържете се с нас на: <a href="mailto:angelmalev9@gmail.com" className="text-primary hover:underline">angelmalev9@gmail.com</a>
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

export default Cookies;
