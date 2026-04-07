import { useEffect, useRef, useState } from "react";
import { Globe, CheckCircle, ArrowRight, Zap, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useTranslation } from "react-i18next";
import NeuralLoader from "./NeuralLoader";

interface DemoSectionProps {
  onTrainingComplete: (sessionId: string) => void;
}

type Status = "idle" | "scraping" | "processing" | "ready";

const POLL_INTERVAL_MS = 1200;
const MAX_POLL_ERRORS = 5;
const MAX_POLL_MS = 240000;

const countPagesFromScrapedContent = (scraped: unknown): number => {
  if (!scraped) return 0;
  if (Array.isArray(scraped)) return scraped.length;
  if (typeof scraped === "string") {
    try {
      const parsed = JSON.parse(scraped);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch { return 0; }
  }
  return 0;
};

const DemoSection = ({ onTrainingComplete }: DemoSectionProps) => {
  const { ref, isVisible } = useScrollAnimation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [pagesScraped, setPagesScraped] = useState(0);

  const pollTimerRef = useRef<number | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const statusRef = useRef<Status>("idle");

  useEffect(() => { statusRef.current = status; }, [status]);

  const stopAllTimers = () => {
    if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    pollTimerRef.current = null;
    progressTimerRef.current = null;
  };

  useEffect(() => () => stopAllTimers(), []);

  const normalizeUrl = (input: string) => {
    const u = input.trim();
    return u.startsWith("http") ? u : `https://${u}`;
  };

  const startFakeProgress = () => {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    setProgress(2);
    progressTimerRef.current = window.setInterval(() => {
      const currentStatus = statusRef.current;
      setProgress((prev) => {
        const baseIncrement = 0.15;
        if (currentStatus === "scraping" && prev < 70) return prev + baseIncrement;
        if (currentStatus === "processing" && prev < 92) return prev + baseIncrement * 0.8;
        return prev;
      });
    }, 150);
  };

  const pollSessionStatus = async (sessionId: string, _sessionToken: string) => {
    const start = Date.now();
    let consecutiveErrors = 0;
    if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);

    pollTimerRef.current = window.setInterval(async () => {
      try {
        if (Date.now() - start > MAX_POLL_MS) throw new Error("POLL_TIMEOUT");
        const { data: session, error } = await supabase
          .from("demo_sessions").select("status, scraped_content, error_message").eq("id", sessionId).single();
        if (error || !session) throw new Error("SESSION_UNREACHABLE");
        consecutiveErrors = 0;
        const st = String(session.status || "pending");
        if (session.scraped_content) setPagesScraped(countPagesFromScrapedContent(session.scraped_content));

        if (["pending", "queued", "scraping"].includes(st)) { setStatus("scraping"); startFakeProgress(); return; }
        if (["summarizing", "processing"].includes(st)) { setStatus("processing"); startFakeProgress(); return; }

        if (st === "ready") {
          stopAllTimers();
          const pagesCount = countPagesFromScrapedContent(session.scraped_content);
          setPagesScraped(pagesCount);
          setProgress(100);
          setStatus("ready");
          toast({ title: t("demo.trained"), description: t("demo.trainedPages", { pages: pagesCount }) });
          onTrainingComplete(sessionId);
          return;
        }
        if (st === "error") throw new Error(session.error_message || "SCRAPE_ERROR");
      } catch (err) {
        consecutiveErrors++;
        console.error("[DemoSection] Poll failure:", err);
        if (consecutiveErrors >= MAX_POLL_ERRORS) {
          stopAllTimers(); setStatus("idle"); setProgress(0);
          toast({ title: t("demo.error"), description: "Връзката със сървъра е прекъсната. Опитайте отново.", variant: "destructive" });
        }
      }
    }, POLL_INTERVAL_MS);
  };

  const startTraining = async (normalizedUrl: string, sessionId: string, sessionToken: string) => {
    try {
      const { error } = await supabase.functions.invoke("scrape-website", { body: { url: normalizedUrl, sessionId, sessionToken } });
      if (error) throw error;
    } catch (err) {
      console.error("[DemoSection] scrape-website failed:", err);
      stopAllTimers(); setStatus("idle"); setProgress(0);
      toast({ title: t("demo.error"), description: "Сканирането не можа да започне.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const normalizedUrl = normalizeUrl(url);
    stopAllTimers(); setStatus("scraping"); setProgress(0); setPagesScraped(0);

    try {
      const { data: session, error: sessionError } = await supabase
        .from("demo_sessions").insert({ url: normalizedUrl, status: "pending" }).select("id, session_token").single();
      if (sessionError) throw sessionError;
      if (!session?.id) throw new Error("Missing session id");
      currentSessionIdRef.current = session.id;
      sessionStorage.setItem(`neo_session_${session.id}`, session.session_token);
      startFakeProgress();
      await supabase.from("demo_sessions").select("id").eq("id", session.id).single();
      pollSessionStatus(session.id, session.session_token);
      startTraining(normalizedUrl, session.id, session.session_token);
    } catch (error) {
      console.error("Training error:", error);
      stopAllTimers(); setStatus("idle"); setProgress(0);
      toast({ title: t("demo.error"), description: error instanceof Error ? error.message : t("demo.tryAgain"), variant: "destructive" });
    }
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="demo"
      className={`neo-section-spacing relative overflow-hidden ${isVisible ? "neo-section-visible" : ""}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="neo-heading-section font-black text-foreground mb-3 font-mono">
            Чуйте как звучи <span className="text-primary">Вашият NEO</span>
          </h2>
          <p className="neo-subheading text-muted-foreground mb-6 max-w-lg mx-auto">
            Въведете адреса на сайта си и за секунди NEO ще научи всичко за бизнеса Ви — готов да говори с клиентите Ви.
          </p>

          {/* Input / Loading / Ready */}
          <div className="neo-glass-premium rounded-2xl p-1 shadow-[0_8px_40px_hsl(0_0%_0%/0.4)] max-w-xl mx-auto">
            {status === "idle" && (
              <form onSubmit={handleSubmit} className="flex items-center gap-2 p-1">
                <div className="relative flex-1">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t("demo.placeholder")}
                    className="w-full bg-background/60 border-0 rounded-xl py-3.5 pl-11 pr-4 text-[16px] sm:text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-medium"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-5 shrink-0 shadow-lg shadow-primary/25 font-bold text-sm gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span className="hidden sm:inline">Обучете NEO</span>
                  <ArrowRight className="w-4 h-4 sm:hidden" />
                </Button>
              </form>
            )}

            {(status === "scraping" || status === "processing") && (
              <NeuralLoader />
            )}

            {status === "ready" && (
              <div className="flex flex-col sm:flex-row items-center gap-4 p-5">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-neo-success/15 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-neo-success" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{pagesScraped} {t("demo.pagesLearned")}</p>
                    <p className="text-xs text-muted-foreground">{t("demo.ready")}</p>
                  </div>
                </div>
                <Button
                  className="neo-btn-primary rounded-xl font-bold w-full sm:w-auto text-sm gap-2"
                  onClick={() => document.getElementById("voice-interview")?.scrollIntoView({ behavior: "smooth" })}
                >
                  {t("demo.callNow")} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-xs text-muted-foreground/50">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-primary/50" /> Без код
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-primary/50" /> Без интеграции
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-primary/50" /> Без настройки
            </span>
          </div>

          {/* Demo disclaimer */}
          <div className="mt-6 max-w-lg mx-auto">
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-card/30 border border-border/10 text-left">
              <AlertTriangle className="w-3.5 h-3.5 text-primary/50 shrink-0 mt-0.5" />
              <p className="text-[10px] text-foreground/30 leading-relaxed">
                <span className="font-semibold text-foreground/40">Демо версия:</span>{' '}
                В демо режим NEO симулира записване на часове и резервации. За реални резервации, свържете календар от таблото за управление. 
                NEO може да изпраща запитвания чрез формите за контакт на Вашия сайт — моля, не злоупотребявайте с тази функция.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;
