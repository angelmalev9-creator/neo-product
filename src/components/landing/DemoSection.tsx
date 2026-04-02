import { useEffect, useRef, useState } from "react";
import { Globe, Loader2, CheckCircle, ArrowRight, Sparkles, Brain, Zap, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useTranslation } from "react-i18next";

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
    try { const parsed = JSON.parse(scraped); return Array.isArray(parsed) ? parsed.length : 0; } catch { return 0; }
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

  const stopAllTimers = () => {
    if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    pollTimerRef.current = null;
    progressTimerRef.current = null;
  };

  useEffect(() => { return () => stopAllTimers(); }, []);

  const normalizeUrl = (input: string) => {
    const u = input.trim();
    return u.startsWith("http") ? u : `https://${u}`;
  };

  const statusRef = useRef<Status>("idle");
  useEffect(() => { statusRef.current = status; }, [status]);

  const startFakeProgress = () => {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    setProgress(2);
    progressTimerRef.current = window.setInterval(() => {
      const currentStatus = statusRef.current;
      setProgress((prev) => {
        const inc = 0.15;
        if (currentStatus === "scraping") return prev < 70 ? prev + inc : prev;
        if (currentStatus === "processing") return prev < 92 ? prev + inc * 0.8 : prev;
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
        const { data: session, error } = await supabase.from("demo_sessions").select("status, scraped_content, error_message").eq("id", sessionId).single();
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
      toast({ title: t("demo.error"), description: "Сканирането не можа да започне. Проверете връзката и опитайте отново.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const normalizedUrl = normalizeUrl(url);
    stopAllTimers();
    setStatus("scraping"); setProgress(0); setPagesScraped(0);
    try {
      const { data: session, error: sessionError } = await supabase.from("demo_sessions").insert({ url: normalizedUrl, status: "pending" }).select("id, session_token").single();
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

  const getStepState = (step: "scan" | "learn") => {
    if (status === "idle") return "waiting";
    if (status === "scraping") return step === "scan" ? "active" : "waiting";
    if (status === "processing") return step === "scan" ? "done" : "active";
    if (status === "ready") return "done";
    return "waiting";
  };

  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="demo" className="py-24 sm:py-32 lg:py-40 relative overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-5 leading-[1.1] tracking-tight">
              {t("demo.title1")}{" "}
              <span className="neo-gradient-text">{t("demo.title2")}</span>
            </h2>
            <p className="text-base lg:text-lg text-muted-foreground mb-3 max-w-lg leading-relaxed">{t("demo.description")}</p>
            <p className="text-base text-muted-foreground mb-8 max-w-lg">
              <span className="text-foreground font-medium">{t("demo.testAsClient")}</span> {t("demo.testDetails")}
            </p>

            {/* Steps */}
            <div className="neo-glass-subtle border border-border/15 rounded-2xl p-5 mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 font-semibold">{t("demo.howItWorks")}</p>
              <div className="space-y-3">
                {[t("demo.step1"), t("demo.step2"), t("demo.step3")].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-sm text-muted-foreground leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />{t("demo.noRegistration")}</span>
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />{t("demo.free")}</span>
            </div>

            {/* URL Input */}
            <div className="rounded-2xl border border-border/20 bg-card/50 p-2">
              {status === "idle" && (
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                    <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("demo.placeholder")}
                      className="w-full bg-transparent border-0 rounded-xl py-4 pl-11 pr-4 text-[16px] sm:text-base text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-all font-medium" />
                  </div>
                  <Button type="submit" size="lg" className="neo-btn-primary rounded-xl h-12 w-12 p-0 shrink-0">
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </form>
              )}
              {(status === "scraping" || status === "processing") && (
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                    <p className="text-base text-foreground font-medium">{status === "scraping" ? t("demo.scanning") : t("demo.processing")}</p>
                  </div>
                  <div className="relative h-2 rounded-full overflow-hidden bg-muted/30">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-right">{Math.round(progress)}%</p>
                </div>
              )}
              {status === "ready" && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <CheckCircle className="w-5 h-5 text-neo-success shrink-0" />
                    <div>
                      <span className="text-base text-foreground font-medium block">{pagesScraped} {t("demo.pagesLearned")}</span>
                      <span className="text-sm text-muted-foreground">{t("demo.ready")}</span>
                    </div>
                  </div>
                  <Button size="lg" className="neo-btn-primary rounded-full font-semibold w-full sm:w-auto text-base h-12 px-6"
                    onClick={() => document.getElementById("voice-interview")?.scrollIntoView({ behavior: "smooth" })}>
                    {t("demo.callNow")} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground/60">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>Демонстрацията включва гласово взаимодействие. Изпробвайте Neo в спокойна среда.</p>
            </div>
          </div>

          {/* Right side - Step cards */}
          <div className="space-y-4 hidden lg:block">
            <StepCard icon={<Sparkles className="w-5 h-5" />} title={t("demo.stepScan")} description={t("demo.stepScanDesc")} state={getStepState("scan")} />
            <StepCard icon={<Brain className="w-5 h-5" />} title={t("demo.stepLearn")} description={t("demo.stepLearnDesc")} state={getStepState("learn")} />
          </div>
        </div>
      </div>
    </section>
  );
};

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  state: "waiting" | "active" | "done";
}

const StepCard = ({ icon, title, description, state }: StepCardProps) => {
  const isActive = state === "active";
  const isDone = state === "done";

  return (
    <div className={`relative p-6 rounded-2xl border transition-all duration-300 ${
      isActive ? "neo-glass border-primary/30" : isDone ? "neo-glass-subtle border-neo-success/25" : "neo-glass-subtle border-border/10"
    }`}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
          isActive ? "bg-primary/15 text-primary" : isDone ? "bg-neo-success/15 text-neo-success" : "bg-muted/30 text-muted-foreground"
        }`}>
          {isDone ? <CheckCircle className="w-5 h-5" /> : icon}
        </div>
        <div>
          <h4 className={`text-base font-semibold mb-1 ${isActive ? "text-foreground" : isDone ? "text-neo-success" : "text-muted-foreground"}`}>{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          {isActive && <div className="mt-3 flex items-center gap-2"><div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-xs text-primary font-medium">Обработва се...</span></div>}
        </div>
      </div>
    </div>
  );
};

export default DemoSection;
