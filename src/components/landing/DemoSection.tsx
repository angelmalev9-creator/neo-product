import { useEffect, useRef, useState } from "react";
import { Globe, Loader2, CheckCircle, ArrowRight, Sparkles, Brain, Zap, Shield, AlertTriangle, Scan, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

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

  const statusRef = useRef<Status>("idle");

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const startFakeProgress = () => {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    setProgress(2);

    progressTimerRef.current = window.setInterval(() => {
      const currentStatus = statusRef.current;
      setProgress((prev) => {
        const baseIncrement = 0.15;
        if (currentStatus === "scraping") {
          if (prev < 70) return prev + baseIncrement;
          return prev;
        }
        if (currentStatus === "processing") {
          if (prev < 92) return prev + baseIncrement * 0.8;
          return prev;
        }
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
          .from("demo_sessions")
          .select("status, scraped_content, error_message")
          .eq("id", sessionId)
          .single();

        if (error || !session) throw new Error("SESSION_UNREACHABLE");
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
        if (st === "error") throw new Error(session.error_message || "SCRAPE_ERROR");
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
      const { data: session, error: sessionError } = await supabase
        .from("demo_sessions")
        .insert({ url: normalizedUrl, status: "pending" })
        .select("id, session_token")
        .single();

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
      className={`py-16 sm:py-20 lg:py-28 relative overflow-hidden ${
        isVisible ? "neo-section-visible" : ""
      }`}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header - centered */}
          <motion.div
            className="text-center mb-12 lg:mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl sm:text-2xl md:text-[1.75rem] font-display font-black text-foreground mb-3 leading-[1.1] tracking-tight">
              {t("demo.title1")}{" "}
              <span className="neo-gradient-text">{t("demo.title2")}</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              {t("demo.description")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
            {/* Left: Input + steps — 3 cols */}
            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, x: -20 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Main input card */}
              <div className="rounded-2xl border border-border/10 bg-card/40 backdrop-blur-sm p-5 sm:p-6 shadow-[0_4px_24px_hsl(0_0%_0%/0.2)]">
                <p className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
                  <span className="text-foreground font-medium">{t("demo.testAsClient")}</span>
                  {t("demo.testDetails")}
                </p>

                {/* Steps mini-timeline */}
                <div className="flex items-center gap-3 mb-5 text-xs text-muted-foreground">
                  {[t("demo.step1"), t("demo.step2"), t("demo.step3")].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="hidden sm:inline truncate max-w-[140px]">{step}</span>
                      {i < 2 && <span className="text-border/40 hidden sm:inline">→</span>}
                    </div>
                  ))}
                </div>

                {/* Input / Progress / Ready states */}
                <AnimatePresence mode="wait">
                  {status === "idle" && (
                    <motion.form
                      key="idle"
                      onSubmit={handleSubmit}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="relative flex-1">
                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder={t("demo.placeholder")}
                          className="w-full bg-background/50 border border-border/10 rounded-xl py-3 pl-10 pr-4 text-[16px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/20 transition-all"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="bg-primary hover:bg-primary/90 rounded-xl h-[46px] w-[46px] p-0 shrink-0 shadow-lg shadow-primary/20"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </motion.form>
                  )}

                  {(status === "scraping" || status === "processing") && (
                    <motion.div
                      key="progress"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        </div>
                        <div>
                          <p className="text-sm text-foreground font-medium">
                            {status === "scraping" ? t("demo.scanning") : t("demo.processing")}
                          </p>
                          <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
                        </div>
                      </div>

                      <div className="relative h-1.5 rounded-full overflow-hidden bg-muted/30">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-primary to-accent"
                          style={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {status === "ready" && (
                    <motion.div
                      key="ready"
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-sm text-foreground font-medium block">
                            {pagesScraped} {t("demo.pagesLearned")}
                          </span>
                          <span className="text-xs text-muted-foreground">{t("demo.ready")}</span>
                        </div>
                      </div>
                      <Button
                        className="bg-primary rounded-xl text-sm w-full sm:w-auto"
                        onClick={() => document.getElementById("voice-interview")?.scrollIntoView({ behavior: "smooth" })}
                      >
                        {t("demo.callNow")} <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Badges */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/5">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                    <Zap className="w-3 h-3" />
                    {t("demo.noRegistration")}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                    <Shield className="w-3 h-3" />
                    {t("demo.free")}
                  </span>
                </div>
              </div>

              {/* Disclaimer — minimal */}
              <div className="flex items-center gap-2 mt-3 px-1">
                <AlertTriangle className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
                  Демонстрацията включва гласово взаимодействие. Изпробвайте в спокойна среда.
                </p>
              </div>
            </motion.div>

            {/* Right: Live status cards — 2 cols */}
            <motion.div
              className="lg:col-span-2 hidden lg:flex flex-col gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <LiveStepCard
                icon={<Scan className="w-4 h-4" />}
                title={t("demo.stepScan")}
                description={t("demo.stepScanDesc")}
                state={getStepState("scan")}
                step={1}
              />
              <LiveStepCard
                icon={<GraduationCap className="w-4 h-4" />}
                title={t("demo.stepLearn")}
                description={t("demo.stepLearnDesc")}
                state={getStepState("learn")}
                step={2}
              />

              {/* Visual connector line */}
              <div className="flex justify-center -my-1">
                <div className="w-px h-6 bg-gradient-to-b from-border/20 to-transparent" />
              </div>

              {/* Result preview placeholder */}
              <div className="rounded-xl border border-border/5 bg-card/20 p-4 text-center">
                <p className="text-xs text-muted-foreground/40">
                  {status === "ready"
                    ? "✓ NEO е готов за разговор"
                    : status === "idle"
                      ? "Въведете адрес, за да започнете"
                      : "Обработка..."}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface LiveStepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  state: "waiting" | "active" | "done";
  step: number;
}

const LiveStepCard = ({ icon, title, description, state, step }: LiveStepCardProps) => {
  const isActive = state === "active";
  const isDone = state === "done";

  return (
    <motion.div
      className={`relative rounded-xl border p-4 transition-all duration-500 ${
        isActive
          ? "border-primary/20 bg-primary/[0.03]"
          : isDone
            ? "border-neo-success/15 bg-neo-success/[0.02]"
            : "border-border/5 bg-card/20"
      }`}
      animate={isActive ? { scale: [1, 1.01, 1] } : {}}
      transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500 ${
            isActive
              ? "bg-primary/10 text-primary"
              : isDone
                ? "bg-neo-success/10 text-neo-success"
                : "bg-muted/20 text-muted-foreground/30"
          }`}
        >
          {isDone ? <CheckCircle className="w-4 h-4" /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              className={`text-sm font-medium transition-colors duration-300 ${
                isActive || isDone ? "text-foreground" : "text-muted-foreground/50"
              }`}
            >
              {title}
            </h4>
            {isActive && (
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-primary"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </div>
          <p className={`text-xs mt-0.5 transition-colors duration-300 ${
            isActive || isDone ? "text-muted-foreground" : "text-muted-foreground/30"
          }`}>
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default DemoSection;
