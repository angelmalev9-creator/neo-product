import { Bot, ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Terms = () => {
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
              <FileText className="w-10 h-10 text-primary" />
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Условия за ползване</h1>
                <p className="text-muted-foreground">Последна актуализация: 20 декември 2024</p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">1. Общи положения</h2>
                <p className="text-muted-foreground">
                  Тези Условия за ползване уреждат отношенията между NEO AI („Услугата", „ние", „нас") и потребителите („Вие", „Потребител") на нашата AI гласова асистентска платформа. Използвайки нашата услуга, Вие се съгласявате с тези условия.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">2. Описание на услугата</h2>
                <p className="text-muted-foreground">
                  NEO AI предоставя AI-базиран гласов асистент, който:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>Отговаря на обаждания и съобщения от името на вашия бизнес</li>
                  <li>Предоставя информация за вашите продукти и услуги</li>
                  <li>Събира контактни данни от потенциални клиенти</li>
                  <li>Интегрира се с календарни и CRM системи (при определени планове)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">3. Регистрация и акаунт</h2>
                <p className="text-muted-foreground">
                  За да използвате услугата, трябва да създадете акаунт с валиден имейл адрес. Вие сте отговорни за поддържането на сигурността на вашия акаунт и парола. Не споделяйте вашите идентификационни данни с трети страни.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">4. Планове и плащания</h2>
                <p className="text-muted-foreground">
                  NEO AI предлага различни абонаментни планове. Цените и включените функции са описани на нашата страница с ценообразуване. Плащанията се обработват чрез Stripe и се таксуват на месечна база.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">5. Ограничения на употребата</h2>
                <p className="text-muted-foreground">
                  Вие се съгласявате да НЕ използвате услугата за:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>Незаконни дейности или измами</li>
                  <li>Спам или нежелана комуникация</li>
                  <li>Нарушаване на права на трети страни</li>
                  <li>Разпространение на зловреден софтуер</li>
                  <li>Обратен инженеринг на платформата</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">6. Интелектуална собственост</h2>
                <p className="text-muted-foreground">
                  Всички права върху платформата NEO AI, включително софтуер, дизайн, търговски марки и съдържание, принадлежат на нас. Вие получавате ограничен лиценз за използване на услугата съгласно тези условия.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">7. Отказ от отговорност</h2>
                <p className="text-muted-foreground">
                  NEO AI се предоставя „както е". Не гарантираме непрекъсната работа или пълна точност на отговорите. AI асистентът може да допуска грешки и не замества професионална консултация.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">8. Прекратяване</h2>
                <p className="text-muted-foreground">
                  Можете да прекратите абонамента си по всяко време от таблото за управление. Запазваме си правото да прекратим акаунти, които нарушават тези условия.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">9. Промени в условията</h2>
                <p className="text-muted-foreground">
                  Можем да актуализираме тези условия. При съществени промени ще ви уведомим по имейл. Продължаващата употреба на услугата след промените означава приемане на новите условия.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-4">10. Контакт</h2>
                <p className="text-muted-foreground">
                  За въпроси относно тези условия, свържете се с нас на: <a href="mailto:angelmalev9@gmail.com" className="text-primary hover:underline">angelmalev9@gmail.com</a>
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

export default Terms;
