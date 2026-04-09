import { useState, useRef } from 'react';
import { Globe, Loader2, CheckCircle, RefreshCw, FileText, Calendar, Edit3, Save, X, Upload, File, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

interface UploadedFile {
  name: string;
  content: string;
  size: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['.txt', '.md', '.csv', '.json', '.pdf'];

const KnowledgeBaseEditor = ({ userId, currentSession, onSessionUpdate, onCompanyNameExtracted }: KnowledgeBaseEditorProps) => {
  const [url, setUrl] = useState(currentSession?.url || '');
  const [status, setStatus] = useState<'idle' | 'scraping' | 'processing' | 'ready'>('idle');
  const [progress, setProgress] = useState(0);
  const [pagesScraped, setPagesScraped] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      const { data: session, error: sessionError } = await supabase
        .from('demo_sessions')
        .insert({ url: normalizedUrl, status: 'pending', user_id: userId })
        .select('id, session_token')
        .single();
      if (sessionError) throw sessionError;
      sessionStorage.setItem(`neo_session_${session.id}`, session.session_token);
      supabase.functions.invoke('scrape-website', {
        body: { url: normalizedUrl, sessionId: session.id, sessionToken: session.session_token },
      }).catch(err => console.error('scrape-website invoke error:', err));
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
        if (row.status === 'scraping') setProgress(Math.min(30 + attempts, 60));
        else if (row.status === 'processing') { setProgress(80); setStatus('processing'); }
        if (row.scraped_content && Array.isArray(row.scraped_content)) setPagesScraped(row.scraped_content.length);
        if (row.status === 'ready') {
          const pageCount = Array.isArray(row.scraped_content) ? row.scraped_content.length : 0;
          setProgress(100); setPagesScraped(pageCount); setStatus('processing');
          await new Promise(resolve => setTimeout(resolve, 500));
          setStatus('ready');
          onSessionUpdate({ id: row.id, url: row.url, summary: row.summary, language: row.language, status: row.status, company_name: row.company_name });
          if (row.company_name && onCompanyNameExtracted) onCompanyNameExtracted(row.company_name);
          toast({ title: "База знания обновена!", description: `Обучен с ${pageCount} страници` });
          return;
        }
        if (row.status === 'error') throw new Error('Грешка при обхождане на сайта');
      }
      throw new Error('Времето за обхождане изтече');
    } catch (error) {
      console.error('Training error:', error);
      setStatus('idle'); setProgress(0);
      toast({ title: "Грешка", description: error instanceof Error ? error.message : 'Опитайте отново', variant: "destructive" });
    }
  };

  const handleEditStart = () => {
    setEditedSummary(currentSession?.summary || '');
    setIsEditing(true);
  };

  const handleEditCancel = () => { setIsEditing(false); setEditedSummary(''); };

  const handleEditSave = async () => {
    if (!currentSession) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('demo_sessions').update({ summary: editedSummary }).eq('id', currentSession.id);
      if (error) throw error;
      onSessionUpdate({ ...currentSession, summary: editedSummary });
      setIsEditing(false);
      toast({ title: "Запазено!", description: "Базата знания е актуализирана" });
    } catch {
      toast({ title: "Грешка", description: "Неуспешно запазване", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const readFileContent = (file: globalThis.File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.onerror = () => reject(new Error('Грешка при четене на файл'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newFiles: UploadedFile[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'Твърде голям файл', description: `${file.name} надвишава 5MB`, variant: 'destructive' });
        continue;
      }
      try {
        const content = await readFileContent(file);
        if (content.trim().length === 0) {
          toast({ title: 'Празен файл', description: `${file.name} не съдържа текст`, variant: 'destructive' });
          continue;
        }
        newFiles.push({ name: file.name, content: content.trim(), size: file.size });
      } catch {
        toast({ title: 'Грешка', description: `Не може да се прочете ${file.name}`, variant: 'destructive' });
      }
    }
    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast({ title: `${newFiles.length} файл(а) добавен(и)`, description: 'Натиснете „Запази към базата" за да обновите знанията' });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== index));

  const saveFilesToKnowledge = async () => {
    if (!currentSession || uploadedFiles.length === 0) return;
    setSaving(true);
    try {
      const extraKnowledge = uploadedFiles.map(f => `\n\n--- ДОПЪЛНИТЕЛЕН ДОКУМЕНТ: ${f.name} ---\n${f.content}`).join('');
      const updatedSummary = (currentSession.summary || '') + extraKnowledge;
      const { error } = await supabase.from('demo_sessions').update({ summary: updatedSummary }).eq('id', currentSession.id);
      if (error) throw error;
      onSessionUpdate({ ...currentSession, summary: updatedSummary });
      setUploadedFiles([]);
      toast({ title: 'Знанията са обновени!', description: `${uploadedFiles.length} документ(а) добавен(и) към базата` });
    } catch {
      toast({ title: 'Грешка', description: 'Неуспешно запазване', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
                <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="vashiyat-biznes.com"
                  className="w-full bg-background/50 border-0 rounded-lg py-3 pl-10 lg:pl-12 pr-3 lg:pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all" />
              </div>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-sm px-6 py-3 rounded-lg font-bold gap-2">
                <RefreshCw className="w-4 h-4" /> СКРЕЙПНИ
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
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setStatus('idle')}>Скрейпни друг</Button>
            </div>
          )}
        </div>
      </div>

      {/* File Upload */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" /> Допълнителни документи
        </h4>
        <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.json" multiple onChange={handleFileUpload} className="hidden" />
        <div onClick={() => fileInputRef.current?.click()} className="neo-glass-subtle border border-dashed border-border/40 hover:border-primary/40 rounded-xl p-4 cursor-pointer transition-all group">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
              {uploading ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <Plus className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">Качете файлове с инструкции</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">.txt, .md, .csv, .json • до 5MB на файл</p>
            </div>
          </div>
        </div>
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            {uploadedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-background/40 border border-border/15">
                <File className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatSize(file.size)} • {file.content.length.toLocaleString()} символа</p>
                </div>
                <button onClick={() => removeFile(i)} className="p-1 rounded-md hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
            <Button onClick={saveFilesToKnowledge} disabled={saving || !currentSession} className="w-full bg-primary hover:bg-primary/90 text-xs font-bold gap-2 h-9">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Запазване...' : `Запази ${uploadedFiles.length} файл(а) към базата`}
            </Button>
            {!currentSession && (
              <p className="text-[10px] text-muted-foreground text-center">Първо скрейпнете уебсайт, за да добавите допълнителни документи</p>
            )}
          </div>
        )}
      </div>

      {/* Current Knowledge Base Display */}
      {currentSession && currentSession.status === 'ready' && (
        <div className="neo-glass-subtle border border-primary/20 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-foreground mb-0.5">Текуща база знания</h4>
              <p className="text-xs text-muted-foreground truncate">{currentSession.url}</p>
              {currentSession.created_at && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  Обновена: {new Date(currentSession.created_at).toLocaleDateString('bg-BG')}
                </p>
              )}
            </div>
            <Button variant="default" size="sm" onClick={handleEditStart} className="text-xs gap-1.5 h-8 px-3 bg-primary hover:bg-primary/90 shrink-0">
              <Edit3 className="w-3.5 h-3.5" /> Редактирай
            </Button>
          </div>

          {currentSession.summary && !isEditing && (
            <div className="bg-background/50 rounded-lg p-3 max-h-48 overflow-y-auto">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed break-words">
                {currentSession.summary}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => { if (!open) handleEditCancel(); }}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border/20 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-sm font-bold text-foreground">Редактиране на база знания</DialogTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{currentSession?.url}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {editedSummary.length.toLocaleString()} символа • {editedSummary.split('\n').length} реда
                </span>
                <Button variant="ghost" size="sm" onClick={handleEditCancel} disabled={saving} className="text-xs gap-1.5 h-8">
                  <X className="w-3.5 h-3.5" /> Откажи
                </Button>
                <Button size="sm" onClick={handleEditSave} disabled={saving} className="text-xs gap-1.5 h-8 bg-primary hover:bg-primary/90">
                  <Save className="w-3.5 h-3.5" /> {saving ? 'Запазване...' : 'Запази промените'}
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 p-2 sm:p-4">
            <Textarea
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              className="w-full h-full resize-none text-[13px] sm:text-sm bg-background/50 border-border/20 font-mono leading-[1.7] tracking-wide p-4"
              placeholder="Въведете или редактирайте базата знания..."
              style={{ tabSize: 2 }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* No session */}
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
