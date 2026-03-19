import { Bot, Code, Key, Zap, ArrowLeft, Copy, Check, Terminal, Database, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

const ApiDocs = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/conversations',
      description: 'Създаване на нов разговор',
      params: ['message (string)', 'context (object, optional)']
    },
    {
      method: 'GET',
      path: '/api/v1/conversations/:id',
      description: 'Получаване на детайли за разговор',
      params: ['id (string)']
    },
    {
      method: 'POST',
      path: '/api/v1/knowledge',
      description: 'Добавяне на база знания',
      params: ['url (string)', 'content (string, optional)']
    },
    {
      method: 'GET',
      path: '/api/v1/analytics',
      description: 'Статистики и анализи',
      params: ['from (date)', 'to (date)']
    }
  ];

  const codeExamples = {
    curl: `curl -X POST https://api.neo-assistant.com/v1/conversations \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Какви са работните ви часове?",
    "context": {
      "user_id": "user_123",
      "language": "bg"
    }
  }'`,
    javascript: `const response = await fetch('https://api.neo-assistant.com/v1/conversations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Какви са работните ви часове?',
    context: {
      user_id: 'user_123',
      language: 'bg'
    }
  })
});

const data = await response.json();
console.log(data.response);`,
    python: `import requests

response = requests.post(
    'https://api.neo-assistant.com/v1/conversations',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'message': 'Какви са работните ви часове?',
        'context': {
            'user_id': 'user_123',
            'language': 'bg'
        }
    }
)

data = response.json()
print(data['response'])`
  };

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
              <span className="font-display font-bold text-foreground">NEO API Документация</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Code className="w-4 h-4" />
            REST API v1.0
          </div>
          <h1 className="text-4xl lg:text-5xl font-display font-black text-foreground mb-6">
            NEO API Документация
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Интегрирайте NEO в собствените си приложения с нашия мощен и лесен за използване API.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg">
              <Key className="w-4 h-4 mr-2" />
              Вземете API ключ
            </Button>
            <Button variant="outline" size="lg">
              <Terminal className="w-4 h-4 mr-2" />
              Тествайте в Playground
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8">Бърз старт</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">1. Вземете API ключ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Регистрирайте се за Business план и генерирайте API ключ от таблото за управление.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">2. Конфигурирайте</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Добавете база знания и персонализирайте отговорите на NEO за вашия бизнес.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">3. Интегрирайте</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Използвайте API-то във вашите приложения за автоматизиране на комуникацията.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Code Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Примерни заявки</CardTitle>
              <CardDescription>Изберете език за преглед на примерен код</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="curl">
                <TabsList>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                </TabsList>
                {Object.entries(codeExamples).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang}>
                    <div className="relative">
                      <pre className="bg-card border rounded-lg p-4 overflow-x-auto text-sm">
                        <code>{code}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyCode(code, lang)}
                      >
                        {copied === lang ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8">API Endpoints</h2>
          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start gap-4">
                    <span className={`px-3 py-1 rounded text-xs font-bold ${
                      endpoint.method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                    <p className="text-sm text-muted-foreground flex-1">{endpoint.description}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {endpoint.params.map((param, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                        {param}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-foreground mb-4">
            Сигурност
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Всички API заявки използват HTTPS криптиране. API ключовете ви трябва да се пазят сигурно и никога да не се споделят публично.
          </p>
          <Button variant="outline" asChild>
            <Link to="/gdpr">
              Прочетете за GDPR съответствието
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} NEO AI. Всички права запазени.</p>
        </div>
      </footer>
    </div>
  );
};

export default ApiDocs;
