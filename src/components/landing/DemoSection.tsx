import { useEffect, useRef, useState } from "react";
import { Globe, Loader2, CheckCircle, ArrowRight, Sparkles, Brain, Zap, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { PencilUnderline } from "@/components/ui/PencilUnderline";
import { useTranslation } from "react-i18next";

interface DemoSectionProps {
  onTrainingComplete: (sessionId: string) => void;
}

type Status = "idle" | "scraping" | "processing" | "ready";

const POLL_INTERVAL_MS = 1200;
const MAX_POLL_ERRORS = 5;
const MAX_POLL_MS = 240000; // ✅ 4 minutes (crawler can take time on bigger sites)

const countPagesFromScrapedContent = (scraped: unknown): number => {
  if (!scraped) return 0;
  if (Array.isArray(scraped)) return scraped.length;

  if (typeof scraped === "string") {
    try {
      const parsed = JSON.parse(scraped);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
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

  useEffect(() => {
    return () => stopAllTimers();
  }, []);

  const normalizeUrl = (input: string) => {
    const u = input.trim();
    return u.startsWith("http") ? u : `https://${u}`;
  };

  // ✅ CRITICAL FIX: Use ref to track current status for interval callback
  const statusRef = useRef<Status>("idle");

  // Keep statusRef in sync with status
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const startFakeProgress = () => {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);

    // ✅ IMMEDIATE START: Jump to 2% instantly for visual feedback
    setProgress(2);

    // ✅ SMOOTH RIGHT-ONLY PROGRESS: Only increases, never decreases
    // Uses statusRef.current instead of status to avoid stale closure
    progressTimerRef.current = window.setInterval(() => {
      const currentStatus = statusRef.current;

      setProgress((prev) => {
        // CRITICAL: Progress ONLY goes up, never down
        // Small consistent increment for smooth slow growth
        const baseIncrement = 0.15;

        // During scraping: slow steady growth to 70%
        if (currentStatus === "scraping") {
          if (prev < 70) {
            return prev + baseIncrement;
          }
          return prev; // Stay at 70% max during scraping
        }

        // During processing: continue slowly toward 92%
        if (currentStatus === "processing") {
          if (prev < 92) {
            return prev + baseIncrement * 0.8;
          }
          return prev; // Stay at 92% max during processing
        }

        // Keep current value in other states (never go back)
        return prev;
      });
    }, 150); // Slower interval (150ms) for gradual smooth growth
  };

  const pollSessionStatus = async (sessionId: string, _sessionToken: string) => {
    const start = Date.now();
    let consecutiveErrors = 0;

    if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);

    pollTimerRef.current = window.setInterval(async () => {
      try {
        if (Date.now() - start > MAX_POLL_MS) {
          throw new Error("POLL_TIMEOUT");
        }

        const { data: session, error } = await supabase
          .from("demo_sessions")
          .select("status, scraped_content, error_message")
          .eq("id", sessionId)
          .single();

        if (error || !session) {
          throw new Error("SESSION_UNREACHABLE");
        }

        consecutiveErrors = 0;

        const st = String(session.status || "pending");

        if (session.scraped_content) {
          setPagesScraped(countPagesFromScrapedContent(session.scraped_content));
        }

        if (["pending", "queued", "scraping"].includes(st)) {
          setStatus("scraping");
          startFakeProgress();
          return;
        }

        if (["summarizing", "processing"].includes(st)) {
          setStatus("processing");
          startFakeProgress();
          return;
        }

        if (st === "ready") {
          stopAllTimers();
          const pagesCount = countPagesFromScrapedContent(session.scraped_content);
          setPagesScraped(pagesCount);
          setProgress(100);
          setStatus("ready");

          toast({
            title: t("demo.trained"),
            description: t("demo.trainedPages", { pages: pagesCount }),
          });

          onTrainingComplete(sessionId);
          return;
        }

        if (st === "error") {
          throw new Error(session.error_message || "SCRAPE_ERROR");
        }
      } catch (err) {
        consecutiveErrors++;

        console.error("[DemoSection] Poll failure:", err);

        if (consecutiveErrors >= MAX_POLL_ERRORS) {
          stopAllTimers();
          setStatus("idle");
          setProgress(0);

          toast({
            title: t("demo.error"),
            description: "Връзката със сървъра е прекъсната. Опитайте отново.",
            variant: "destructive",
          });
        }
      }
    }, POLL_INTERVAL_MS);
  };
  const startTraining = async (normalizedUrl: string, sessionId: string, sessionToken: string) => {
    try {
      const { error } = await supabase.functions.invoke("scrape-website", {
        body: { url: normalizedUrl, sessionId, sessionToken },
      });

      if (error) throw error;
    } catch (err) {
      console.error("[DemoSection] scrape-website failed:", err);

      stopAllTimers();
      setStatus("idle");
      setProgress(0);

      toast({
        title: t("demo.error"),
        description: "Сканирането не можа да започне. Проверете връзката и опитайте отново.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const normalizedUrl = normalizeUrl(url);

    stopAllTimers();

    setStatus("scraping");
    setProgress(0);
    setPagesScraped(0);

    try {
      // 1) create session
      const { data: session, error: sessionError } = await supabase
        .from("demo_sessions")
        .insert({ url: normalizedUrl, status: "pending" })
        .select("id, session_token")
        .single();

      if (sessionError) throw sessionError;
      if (!session?.id) throw new Error("Missing session id");

      currentSessionIdRef.current = session.id;
      sessionStorage.setItem(`neo_session_${session.id}`, session.session_token);

      // 2) progress UI
      startFakeProgress();

      // 🔒 CRITICAL: ensure session row is visible before starting scrape
      await supabase.from("demo_sessions").select("id").eq("id", session.id).single();

      // 3) poll status
      pollSessionStatus(session.id, session.session_token);

      // 4) start async training
      startTraining(normalizedUrl, session.id, session.session_token);
    } catch (error) {
      console.error("Training error:", error);
      stopAllTimers();
      setStatus("idle");
      setProgress(0);

      toast({
        title: t("demo.error"),
        description: error instanceof Error ? error.message : t("demo.tryAgain"),
        variant: "destructive",
      });
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
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="demo"
      className={`py-10 sm:py-16 lg:py-24 relative overflow-hidden neo-section-flip-left ${
        isVisible ? "neo-section-visible" : ""
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-6xl mx-auto">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-display font-black text-foreground mb-2 lg:mb-3 leading-[1.1] tracking-tight">
              <PencilUnderline>{t("demo.title1")}</PencilUnderline>{" "}
              <span className="neo-gradient-text whitespace-nowrap">{t("demo.title2")}</span>
            </h2>

            <p className="text-sm lg:text-base text-muted-foreground mb-2 lg:mb-3 max-w-md leading-relaxed">{t("demo.description")}</p>
            <p className="text-xs lg:text-sm text-muted-foreground mb-4 lg:mb-5 max-w-md">
              <span className="text-foreground font-medium">{t("demo.testAsClient")}</span> {t("demo.testDetails")}
            </p>

            <div className="neo-glass-subtle border border-border/15 rounded-lg p-3 mb-4 lg:mb-5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{t("demo.howItWorks")}</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center shrink-0 font-bold">1</span>
                  <span className="text-muted-foreground">{t("demo.step1")}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center shrink-0 font-bold">2</span>
                  <span className="text-muted-foreground">{t("demo.step2")}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center shrink-0 font-bold">3</span>
                  <span className="text-muted-foreground">{t("demo.step3")}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4 lg:mb-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-primary" />
                {t("demo.noRegistration")}
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-primary" />
                {t("demo.free")}
              </span>
            </div>

            <div className="neo-glass-subtle border border-border/30 rounded-2xl p-2.5 sm:p-2 shadow-[0_8px_32px_hsl(0_0%_0%/0.3)]">
              {status === "idle" && (
                <form onSubmit={handleSubmit} className="flex items-center gap-2.5 sm:gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-5 sm:h-5 text-muted-foreground/35" />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={t("demo.placeholder")}
                      className="w-full bg-background/60 border-0 rounded-xl py-3 sm:py-4 pl-10 sm:pl-12 pr-3 sm:pr-4 text-[16px] sm:text-base text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-medium"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-primary hover:bg-primary/90 rounded-xl h-12 w-12 sm:h-14 sm:w-14 p-0 shrink-0 shadow-lg shadow-primary/20"
                  >
                    <ArrowRight className="w-5 h-5 sm:w-5 sm:h-5" />
                  </Button>
                </form>
              )}

              {(status === "scraping" || status === "processing") && (
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-spin shrink-0" />
                    <p className="text-sm sm:text-base text-foreground font-medium">
                      {status === "scraping" ? t("demo.scanning") : t("demo.processing")}
                    </p>
                  </div>

                  <div className="relative h-3 sm:h-4 rounded-full overflow-hidden bg-muted/50">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground mt-3 text-right">{Math.round(progress)}%</p>

                  <p className="text-[11px] sm:text-xs text-muted-foreground/70 mt-2">
                    * На мобилни устройства сканирането може да отнеме повече време.
                  </p>
                </div>
              )}

              {status === "ready" && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-neo-success shrink-0" />
                    <div>
                      <span className="text-sm sm:text-base text-foreground font-medium block">
                        {pagesScraped} {t("demo.pagesLearned")}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">{t("demo.ready")}</span>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="bg-primary rounded-xl font-bold w-full sm:w-auto text-sm sm:text-base"
                    onClick={() => document.getElementById("voice-interview")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    {t("demo.callNow")} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                </div>
              )}
            </div>

            {/* Safety Disclaimer */}
            <div className="mt-4 bg-muted/30 border border-border/20 rounded-xl px-4 py-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Демонстрацията включва гласово взаимодействие. Изпробвайте Neo в спокойна и безопасна среда. Не
                  използвайте демото по време на шофиране или дейности, изискващи концентрация.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 hidden lg:block">
            <StepCard
              icon={<Sparkles className="w-5 h-5" />}
              title={t("demo.stepScan")}
              description={t("demo.stepScanDesc")}
              state={getStepState("scan")}
            />
            <StepCard
              icon={<Brain className="w-5 h-5" />}
              title={t("demo.stepLearn")}
              description={t("demo.stepLearnDesc")}
              state={getStepState("learn")}
            />
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
    <div
      className={`relative p-5 rounded-xl border transition-all duration-300 ${
        isActive
          ? "neo-glass border-primary/40"
          : isDone
            ? "neo-glass-subtle border-neo-success/30"
            : "neo-glass-subtle border-border/20"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
            isActive
              ? "bg-primary/20 text-primary"
              : isDone
                ? "bg-neo-success/20 text-neo-success"
                : "bg-muted/50 text-muted-foreground"
          }`}
        >
          {isDone ? <CheckCircle className="w-5 h-5" /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className={`text-base font-bold mb-1 transition-colors duration-300 ${
              isActive ? "text-foreground" : isDone ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {title}
          </h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {isActive && (
          <div className="shrink-0">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoSection;
