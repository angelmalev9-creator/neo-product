import { useState, useRef } from 'react';
import { Globe, Loader2, CheckCircle, RefreshCw, FileText, Calendar, Edit3, Save, X, Upload, File, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeBaseEditorProps {
  userId: string;
  currentSession: {
    id: string;
    url: string;
    summary: string | null;
    language: string | null;
    status: string | null;
    created_at?: string;
    company_name?: string | null;
  } | null;
  onSessionUpdate: (session: {
    id: string;
    url: string;
    summary: string | null;
    language: string | null;
    status: string | null;
    company_name?: string | null;
  }) => void;
  onCompanyNameExtracted?: (name: string) => void;
}

const KnowledgeBaseEditor = ({ userId, currentSession, onSessionUpdate, onCompanyNameExtracted }: KnowledgeBaseEditorProps) => {
  const [url, setUrl] = useState(currentSession?.url || '');
  const [status, setStatus] = useState<'idle' | 'scraping' | 'processing' | 'ready'>('idle');
  const [progress, setProgress] = useState(0);
  const [pagesScraped, setPagesScraped] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({ title: "Грешка", description: "Въведете URL", variant: "destructive" });
      return;
    }

    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      toast({ title: "Невалиден URL", description: "Въведете валиден адрес", variant: "destructive" });
      return;
    }

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    setStatus('scraping');
    setProgress(0);

    try {
      // Create new session with user_id
      const { data: session, error: sessionError } = await supabase
        .from('demo_sessions')
        .insert({ url: normalizedUrl, status: 'pending', user_id: userId })
        .select('id, session_token')
        .single();

      if (sessionError) throw sessionError;
      sessionStorage.setItem(`neo_session_${session.id}`, session.session_token);

      // Start the crawl (fire-and-forget — the edge function does everything)
      supabase.functions.invoke('scrape-website', {
        body: { url: normalizedUrl, sessionId: session.id, sessionToken: session.session_token },
      }).catch(err => console.error('scrape-website invoke error:', err));

      // Poll demo_sessions table for status updates
      let attempts = 0;
      const maxAttempts = 150;

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;

        const { data: row, error: pollErr } = await supabase
          .from('demo_sessions')
          .select('id, url, summary, language, status, company_name, scraped_content')
          .eq('id', session.id)
          .single();

        if (pollErr || !row) continue;

        // Estimate progress from status
        if (row.status === 'scraping') {
          setProgress(Math.min(30 + attempts, 60));
        } else if (row.status === 'processing') {
          setProgress(80);
          setStatus('processing');
        }

        // Count pages from scraped_content
        if (row.scraped_content && Array.isArray(row.scraped_content)) {
          setPagesScraped(row.scraped_content.length);
        }

        if (row.status === 'ready') {
          const pageCount = Array.isArray(row.scraped_content) ? row.scraped_content.length : 0;
          setProgress(100);
          setPagesScraped(pageCount);
          setStatus('processing');
          await new Promise(resolve => setTimeout(resolve, 500));
          setStatus('ready');

          onSessionUpdate({
            id: row.id,
            url: row.url,
            summary: row.summary,
            language: row.language,
            status: row.status,
            company_name: row.company_name,
          });
          if (row.company_name && onCompanyNameExtracted) {
            onCompanyNameExtracted(row.company_name);
          }

          toast({ title: "База знания обновена!", description: `Обучен с ${pageCount} страници` });
          return;
        }

        if (row.status === 'error') {
          throw new Error('Грешка при обхождане на сайта');
        }
      }

      throw new Error('Времето за обхождане изтече');
    } catch (error) {
      console.error('Training error:', error);
      setStatus('idle');
      setProgress(0);
      toast({ title: "Грешка", description: error instanceof Error ? error.message : 'Опитайте отново', variant: "destructive" });
    }
  };

  const handleEditStart = () => {
    setEditedSummary(currentSession?.summary || '');
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedSummary('');
  };

  const handleEditSave = async () => {
    if (!currentSession) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('demo_sessions')
        .update({ summary: editedSummary })
        .eq('id', currentSession.id);

      if (error) throw error;

      onSessionUpdate({
        ...currentSession,
        summary: editedSummary,
      });
      
      setIsEditing(false);
      toast({ title: "Запазено!", description: "Базата знания е актуализирана" });
    } catch (error) {
      toast({ title: "Грешка", description: "Неуспешно запазване", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Scraping Form */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          URL на уебсайта
        </h4>
        
        <div className="neo-glass-subtle border border-border/30 rounded-xl p-1.5">
          {status === 'idle' && (
            <form onSubmit={handleScrape} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="vashiyat-biznes.com"
                  className="w-full bg-background/50 border-0 rounded-lg py-3 pl-10 lg:pl-12 pr-3 lg:pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-sm px-6 py-3 rounded-lg font-bold gap-2">
                <RefreshCw className="w-4 h-4" />
                СКРЕЙПНИ
              </Button>
            </form>
          )}

          {(status === 'scraping' || status === 'processing') && (
            <div className="flex items-center gap-3 lg:gap-4 p-3">
              <Loader2 className="w-6 h-6 lg:w-8 lg:h-8 text-primary animate-spin shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{status === 'scraping' ? 'Чета сайта...' : 'Обработвам...'}</p>
                <div className="w-full bg-background/30 rounded-full h-2 mt-2">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3">
              <div className="flex items-center gap-2 flex-1">
                <CheckCircle className="w-6 h-6 text-neo-success shrink-0" />
                <span className="text-sm text-foreground">{pagesScraped} страници обучени</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setStatus('idle')}
              >
                Скрейпни друг
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Current Knowledge Base Display */}
      {currentSession && currentSession.status === 'ready' && (
        <div className="neo-glass-subtle border border-primary/20 rounded-xl p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-foreground mb-1">
                Текуща база знания
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {currentSession.url}
              </p>
              {currentSession.created_at && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  Обновена: {new Date(currentSession.created_at).toLocaleDateString('bg-BG')}
                </p>
              )}
            </div>
          </div>
          
          {currentSession.summary && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-medium text-foreground">Резюме:</h5>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditStart}
                    className="text-xs gap-1 h-7 px-2"
                  >
                    <Edit3 className="w-3 h-3" />
                    Редактирай
                  </Button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedSummary}
                    onChange={(e) => setEditedSummary(e.target.value)}
                    className="min-h-[200px] text-xs bg-background/50"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditCancel}
                      disabled={saving}
                      className="text-xs gap-1 h-7"
                    >
                      <X className="w-3 h-3" />
                      Откажи
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleEditSave}
                      disabled={saving}
                      className="text-xs gap-1 h-7 bg-primary"
                    >
                      <Save className="w-3 h-3" />
                      {saving ? 'Запазване...' : 'Запази'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-background/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {currentSession.summary.slice(0, 1500)}
                    {currentSession.summary.length > 1500 && '...'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No session message */}
      {!currentSession && status === 'idle' && (
        <div className="text-center py-6 text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Въведете URL, за да заредите база знания</p>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseEditor;
