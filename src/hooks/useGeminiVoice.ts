import { useState, useRef, useCallback, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UseGeminiVoiceProps {
  onMessage?: (message: Message) => void;
  onError?: (error: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  onListeningChange?: (listening: boolean) => void;
  onTranscript?: (transcript: string, isFinal: boolean, role: "user" | "assistant") => void;
}

type SessionData = {
  apiKey: string;
  model: string;
  systemInstruction: string;
};

interface DgSTTState {
  ws: WebSocket | null;
  isReady: boolean;
}

type SensitiveInputMode = "general" | "name" | "phone" | "email" | "contact";

type PendingSensitiveCapture = {
  mode: SensitiveInputMode;
  raw: string;
  normalized: string;
  ts: number;
};

type SensitiveContactFields = {
  name?: string;
  email?: string;
  phone?: string;
};

type CapturedSensitiveContact = SensitiveContactFields & {
  ts: number;
};

const MAX_SYSTEM_INSTRUCTION_CHARS = 200000;
const AUDIO_SAMPLE_RATE_OUT = 24000;
const AUDIO_SAMPLE_RATE_IN = 16000;

const ECHO_GUARD_MS = 80;
const ANTI_BARGE_IN_MS = 500;
const MIN_BARGE_IN_CHARS = 2;
const MIN_BARGE_IN_WORDS = 2;
const BARGE_IN_COMMANDS = ["стоп", "спри", "изчакай", "чакай", "момент", "секунда", "стига", "почакай"];
const UTTERANCE_DEBOUNCE_MS = 350;
const SPEECH_FINAL_MIN_MS = 280;
const SPEECH_FINAL_MAX_MS = 4500;
const UTTERANCE_END_MIN_MS = 240;
const UTTERANCE_END_MAX_MS = 3400;
const CONTINUATION_EXTRA_MS = 900;
const LOW_CONF_SHORT_TEXT_MAX_CHARS = 8;
const LOW_CONF_SHORT_TEXT_MAX_WORDS = 2;
const LOW_CONF_HOLD_MS = 1700;
const LOW_CONF_MIN_COMMIT_CHARS = 8;
const LOW_CONF_MIN_COMMIT_WORDS = 2;
const SENSITIVE_CAPTURE_WINDOW_MS = 12000;
const SENSITIVE_INCOMPLETE_HOLD_MS = 4200;
const MIN_AGGREGATION_WINDOW_MS = 200;
const SENSITIVE_MODE_EXTRA_WAIT_MS: Record<SensitiveInputMode, number> = {
  general: 0,
  name: 650,
  phone: 2200,
  email: 2400,
  contact: 2800,
};
// VAD-based barge-in: keep it conservative and only interrupt on sustained real speech.
const VAD_BARGE_IN_FRAMES_REQUIRED = 10;

// VAD (client-side) is only a fallback safety layer.
// Server-final tokens should end the turn first.
const VAD_SILENCE_MS = 3000;
const VAD_NOISE_PROFILE_MS = 2500;
const VAD_MIN_SPEECH_THRESHOLD = 0.009;
const VAD_MAX_SPEECH_THRESHOLD = 0.036;
const VAD_THRESHOLD_MULTIPLIER = 4.2;
const NOISE_GATE_FLOOR = 0.005;
const TRANSIENT_CLICK_RMS_MAX = 0.014;
const TRANSIENT_CLICK_PEAK_MIN = 0.16;
const TRANSIENT_CLICK_CREST_MIN = 14;
const VAD_SPEECH_FRAMES_REQUIRED = 5;

const clampInstruction = (text: string, maxChars: number) => {
  const t = String(text || "").trim();
  if (t.length <= maxChars) return t;
  const head = t.slice(0, Math.floor(maxChars * 0.7));
  const tail = t.slice(-Math.floor(maxChars * 0.25));
  return `${head}\n\n[...СЪКРАТЕНО...]\n\n${tail}`;
};

function resampleTo16k(inputData: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === AUDIO_SAMPLE_RATE_IN) return new Float32Array(inputData);
  const ratio = inputSampleRate / AUDIO_SAMPLE_RATE_IN;
  const outputLength = Math.floor(inputData.length / ratio);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
    const fraction = srcIndex - srcIndexFloor;
    output[i] = inputData[srcIndexFloor] * (1 - fraction) + inputData[srcIndexCeil] * fraction;
  }
  return output;
}

function float32ToInt16Buffer(float32Array: Float32Array): ArrayBuffer {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array.buffer;
}

function normalizeBgText(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s@._+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildDeepgramKeyterms(companyName: string, reservationState: any): string[] {
  const rooms = Array.isArray(reservationState?.available_rooms) ? reservationState.available_rooms : [];

  const raw = [
    companyName,
    "НЕО",
    "neo",
    "webvision",
    "webvision bg",
    "сайт",
    "уебсайт",
    "уеб сайт",
    "website",
    "web site",
    "онлайн магазин",
    "електронен магазин",
    "магазин",
    "бизнес",
    "клиенти",
    "лого",
    "оферта",
    "цена",
    "цени",
    "онлайн присъствие",
    "продажби",
    // contact dictation vocabulary
    "имейл",
    "email",
    "маймунско",
    "маймунка",
    "кльомба",
    "точка",
    "джимейл",
    "gmail",
    "абв",
    "abv",
    "аутлук",
    "outlook",
    "телефон",
    "номер",
    "нула",
    "едно",
    "две",
    "три",
    "четири",
    "пет",
    "шест",
    "седем",
    "осем",
    "девет",
    ...rooms.map((r: any) => String(r?.name || "").trim()),
  ];

  return [
    ...new Set(
      raw
        .map((x) => String(x || "").trim())
        .filter(Boolean)
        .map((x) => x.replace(/\s+/g, " ").trim())
        .filter((x) => x.length >= 2 && x.length <= 48),
    ),
  ].slice(0, 16);
}

function normalizeEmailProvider(text: string): string {
  return String(text || "")
    .toLowerCase()
    .replace(
      /джи\s*мейл|джимейл|гмаил|гмейл|гмеил|g\s*mail|g\s*mal|g\s*meil|gmail|gmal|gmeil|gmial|gmale|gmaile|jmail/giu,
      "gmail",
    )
    .replace(/абеве|абе?ве|абв|a\s*b\s*v|abv|abeve|abve/giu, "abv")
    .replace(/аутлук|оутлук|out\s*look|outlook|autluk/giu, "outlook")
    .replace(/хот\s*мейл|хотмейл|hot\s*mail|hotmail|hotmeil/giu, "hotmail")
    .replace(/яху|y\s*ahoo|yahoo/giu, "yahoo")
    .replace(/\bmail\b/giu, "mail");
}

function normalizeEmailTld(text: string): string {
  return String(text || "")
    .replace(/точка\s*ком|dot\s*com|\bcom\b|\.\s*ком/giu, ".com")
    .replace(/точка\s*бг|точка\s*бе\s*ге|dot\s*bg|\bbg\b|\.\s*бг|беге/giu, ".bg")
    .replace(/точка\s*нет|dot\s*net|\bnet\b|\.\s*нет/giu, ".net")
    .replace(/точка\s*орг|dot\s*org|\borg\b|\.\s*орг/giu, ".org")
    .replace(/точка\s*биз|dot\s*biz|\bbiz\b|\.\s*биз/giu, ".biz")
    .replace(/точка\s*инфо|dot\s*info|\binfo\b|\.\s*инфо/giu, ".info")
    .replace(/точка\s*еу|dot\s*eu|\beu\b|\.\s*еу/giu, ".eu");
}

function normalizeSpokenEmail(text: string): string {
  // ── Strip spoken lead-ins BEFORE transliteration ──────────────────────
  // Without this, "Имейлът ми е user@…" → transliterate + compact spaces
  // → "imeylatmiangelmalev312@…" (garbage prefix).
  // Soniox sometimes returns the Bulgarian "имейлат е" in Latin as "imeylate",
  // so we strip both Cyrillic and phonetic-Latin variants.
  const preStripped = String(text || "")
    .replace(
      /^\s*(?:имейл[ъа]т?\s+(?:ми\s+)?е|имейл\s+(?:ми\s+)?е|imeyl[aа]t[ae]?\s+(?:mi\s+)?[еe]\s*|e-?mail\s+(?:is\s+)?|my\s+e-?mail(?:\s+is)?\s+|поща(?:та)?\s+(?:ми\s+)?е)\s*/iu,
      "",
    )
    .trim();
  let raw = normalizeDomainWords(preStripped || String(text || ""));
  raw = normalizeEmailProvider(normalizeEmailTld(raw))
    .replace(/\b(?:dolna\s+cherta|underscore)\b/giu, " _ ")
    .replace(/\b(?:tire|dash|minus)\b/giu, " - ")
    .replace(/\b(?:tochka|dot)\b/giu, " . ")
    .replace(/\b(?:at|et)\b/giu, " @ ")
    .replace(/[\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let compact = raw
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9@._+-]/g, "")
    .replace(/@+/g, "@")
    .replace(/\.{2,}/g, ".")
    .replace(/_{2,}/g, "_")
    .replace(/-{2,}/g, "-")
    .replace(/^\.+|\.+$/g, "");

  compact = compact
    .replace(/gmaile?|gmale|gmial|gmeil|gmal/g, "gmail")
    .replace(/abeve|abve/g, "abv")
    .replace(/outlookk|autluk/g, "outlook");

  if (!compact.includes("@")) {
    const providerMatch = compact.match(
      /^(.*?)(gmail|abv|outlook|hotmail|yahoo|mail)(?:\.(com|bg|net|org|biz|info|eu))?$/i,
    );
    if (providerMatch) {
      const local = String(providerMatch[1] || "").replace(/[.@]+$/g, "");
      const provider = providerMatch[2].toLowerCase();
      const suffix = String(providerMatch[3] || (provider === "abv" ? "bg" : "com")).toLowerCase();
      if (local) {
        compact = `${local}@${provider}.${suffix}`;
      }
    }
  }

  compact = transliterateBulgarianToLatin(compact)
    .replace(/[^a-z0-9@._+-]/g, "")
    .replace(/@+/g, "@");

  compact = compact
    .replace(
      /(?:klumbat|klumba|klomba|klom?ba|klyomba|maimunka)(?=gmail|gmal|gmeil|abv|outlook|hotmail|yahoo|mail)/g,
      "@",
    )
    .replace(/(?:^|[^a-z0-9])tgmail/g, "@gmail")
    .replace(/(?:^|[^a-z0-9])tgmal/g, "@gmail")
    .replace(/(?:^|[^a-z0-9])tabv/g, "@abv")
    .replace(/(?:^|[^a-z0-9])toutlook/g, "@outlook");

  compact = compact.replace(/@(gmail|abv|outlook|hotmail|yahoo|mail)(?!\.)/gi, (_m, providerRaw) => {
    const provider = String(providerRaw).toLowerCase();
    return `@${provider}.${provider === "abv" ? "bg" : "com"}`;
  });

  return compact;
}

function normalizeSpokenPhone(text: string): string {
  const normalizedInput = transliterateBulgarianToLatin(String(text || "").toLowerCase())
    .replace(/[\u0000-\u001F]/g, " ")
    .replace(/[()\-–—,.;:/\\]/g, " ")
    // STT often splits "neo" / "nula" into spaced letters while dictating digits
    .replace(/\bn\s*e\s*o\b/giu, " neo ")
    .replace(/\bn\s*u\s*l\s*a\b/giu, " nula ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedInput) return "";

  const tokenMap: Record<string, string> = {
    // Zero variants
    nula: "0",
    nulaa: "0",
    nulata: "0",
    nulka: "0",
    nua: "0",
    neo: "0",
    neoo: "0",
    ete: "0",
    eto: "0",
    zero: "0",
    ziro: "0",
    o: "0",
    oh: "0",

    // Digits
    edno: "1",
    edna: "1",
    edinica: "1",
    dve: "2",
    dva: "2",
    dvoika: "2",
    tri: "3",
    troika: "3",
    chetiri: "4",
    chetvorka: "4",
    pet: "5",
    petica: "5",
    petorka: "5",
    shest: "6",
    shestica: "6",
    shestorka: "6",
    sedem: "7",
    sedmica: "7",
    sedmorka: "7",
    osem: "8",
    osmica: "8",
    osmorka: "8",
    devet: "9",
    devetka: "9",
    devetorka: "9",

    // Teens
    deset: "10",
    edinaiset: "11",
    edinadeset: "11",
    ednaise: "11",
    ednaiset: "11",
    dvanaiset: "12",
    dvanadeset: "12",
    dvanaise: "12",
    trinaiset: "13",
    trinadeset: "13",
    trinaise: "13",
    chetirinaiset: "14",
    chetirinadeset: "14",
    chetirinaise: "14",
    petnaiset: "15",
    petnadeset: "15",
    petnaise: "15",
    shestnaiset: "16",
    shestnadeset: "16",
    sheinaiset: "16",
    sheinaise: "16",
    sedemnaiset: "17",
    sedemnadeset: "17",
    sedemnaise: "17",
    osemnaiset: "18",
    osemnadeset: "18",
    osemnaise: "18",
    devetnaiset: "19",
    devetnadeset: "19",
    devetnaise: "19",

    // Tens
    dvaiset: "20",
    dvadeset: "20",
    dvayse: "20",
    triyset: "30",
    trideset: "30",
    chetiriyset: "40",
    chetirideset: "40",
    petdeset: "50",
    sheiset: "60",
    shestdeset: "60",
    sedemdeset: "70",
    osemdeset: "80",
    devetdeset: "90",

    // Hundreds
    sto: "100",
    dvesta: "200",
    trista: "300",
    chetiristotin: "400",
    petstotin: "500",
    sheststotin: "600",
    sedemstotin: "700",
    osemstotin: "800",
    devetstotin: "900",

    plus: "+",
  };

  const pushMappedToken = (token: string, output: string[]) => {
    if (!token) return;
    if (/^\+?\d+$/.test(token)) {
      output.push(token);
      return;
    }
    const mapped = tokenMap[token];
    if (mapped) output.push(mapped);
  };

  const outputTokens: string[] = [];
  for (const rawToken of normalizedInput.split(/\s+/)) {
    const token = rawToken.replace(/[^a-z0-9+]/g, "");
    if (!token) continue;

    if (/^[a-z]+\d+$/.test(token) || /^\d+[a-z]+$/.test(token)) {
      const chunks = token.match(/\d+|[a-z]+/g) || [];
      for (const chunk of chunks) {
        pushMappedToken(chunk, outputTokens);
      }
      continue;
    }

    pushMappedToken(token, outputTokens);
  }

  return outputTokens
    .join("")
    .replace(/(?!^)\+/g, "")
    .replace(/[^\d+]/g, "");
}

function transliterateBulgarianToLatin(text: string): string {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sht",
    ъ: "a",
    ь: "",
    ю: "yu",
    я: "ya",
  };
  return Array.from(String(text || "").toLowerCase())
    .map((ch) => map[ch] ?? ch)
    .join("");
}

function normalizeDomainWords(text: string): string {
  return normalizeEmailTld(normalizeEmailProvider(transliterateBulgarianToLatin(String(text || "").toLowerCase())))
    .replace(
      /(?:maimunka|maimunsko|maimaunka|maimaunsko|maymunka|maymunsko|klyomba|klomba|klumba|klumbat|klomba|klomba|kliomba|klyombat|maimunkaa)/giu,
      " @ ",
    )
    .replace(/\b(?:at|et)\b/giu, " @ ")
    .replace(/(?:tochka|dot)/giu, " . ")
    .replace(/(?:dolna\s+cherta|underscore)/giu, " _ ")
    .replace(/(?:tire|minus|dash)/giu, " - ");
}

function looksLikePossibleEmail(text: string): boolean {
  const raw = normalizeDomainWords(text);
  return /(@|gmail|abv|outlook|hotmail|yahoo|\.)/.test(raw);
}

function looksLikePossiblePhone(text: string): boolean {
  const lowered = String(text || "").toLowerCase();
  if (/(?:телефон|номер|gsm|phone|мобилен|плюс|plus)/i.test(lowered)) return true;
  return getPhoneDigitCount(text) >= 6;
}

function extractContactFields(text: string, mode: SensitiveInputMode = "contact"): SensitiveContactFields {
  const raw = stripLowConfidenceTag(text);
  const lowered = raw.toLowerCase();
  const fields: SensitiveContactFields = {};

  const emailCandidate = normalizeSpokenEmail(normalizeDomainWords(raw));
  if ((mode === "email" || mode === "contact") && (looksLikeCompleteEmail(raw) || looksLikePossibleEmail(raw))) {
    if (emailCandidate.includes("@")) {
      fields.email = emailCandidate;
    }
  }

  const phoneCandidate = normalizeSpokenPhone(raw);
  if ((mode === "phone" || mode === "contact") && looksLikePossiblePhone(raw)) {
    if (phoneCandidate) fields.phone = phoneCandidate;
  }

  if (mode === "name" || mode === "contact") {
    const withoutEmailPhone = raw
      .replace(/\S+@\S+/g, " ")
      .replace(/[+\d][\d\s().-]{3,}/g, " ")
      .replace(
        /\b(имейл(ът)?\s+ми\s+е|email\s+is|email|имейл|майл|телефон(ът)?\s+ми\s+е|номер(ът)?\s+ми\s+е|телефон|номер|phone)\b/giu,
        " ",
      )
      .replace(/\b(gmail|abv|outlook|hotmail|yahoo)\b/giu, " ");
    const nameCandidate = normalizeSensitiveName(withoutEmailPhone);
    if (looksLikeSensitiveName(nameCandidate)) {
      fields.name = nameCandidate;
    }
  }

  return fields;
}

function extractContactIntentFields(text: string): SensitiveContactFields {
  const raw = stripLowConfidenceTag(text).trim();
  const fields: SensitiveContactFields = {};

  const nameMatch = raw.match(/(?:казвам\s+се|името\s+ми\s+е|име\s*:?\s*)([\p{L}][\p{L}\s'-]{2,60})/iu);
  if (nameMatch?.[1]) {
    const name = normalizeSensitiveName(nameMatch[1]);
    if (looksLikeSensitiveName(name)) fields.name = name;
  }

  const emailMatch = raw.match(
    /(?:имейл(?:ът)?\s+ми\s+е|imeyl[aа]t[ae]?\s+(?:mi\s+)?[еe]|email\s+is|email|e-mail|имейл|майл|поща)\s+(.+)$/iu,
  );
  const emailSegment = emailMatch?.[1]
    ? emailMatch[1]
        .split(/(?:,|\s+и\s+номер(?:ът)?|\s+телефон(?:ът)?|\s+а\s+номер(?:ът)?|\s+и\s+телефон(?:ът)?)/i)[0]
        ?.trim() || ""
    : "";
  // Remove Soniox glitch: "user@gmail.com, @gmail.com" → "user@gmail.com"
  const emailSegmentClean = emailSegment.replace(
    /([a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,})\s*,?\s*@[a-z0-9.-]+(?:\.[a-z]{2,})?/gi,
    "$1",
  );
  const emailCandidate = normalizeSpokenEmail(emailSegmentClean || raw);
  if (looksLikeCompleteEmail(emailCandidate)) fields.email = emailCandidate;

  const phoneMatch = raw.match(/(?:номер(?:ът)?\s+ми\s+е|телефон(?:ът)?\s+ми\s+е|телефон|номер|gsm|phone)\s+(.+)$/iu);
  const phoneSegment = phoneMatch?.[1]
    ? phoneMatch[1].split(/(?:,|\s+и\s+имейл|\s+а\s+имейл|\s+и\s+казвам\s+се)/i)[0]?.trim() || ""
    : "";
  const phoneCandidate = normalizeSpokenPhone(phoneSegment || raw);
  if (phoneCandidate.replace(/\D/g, "").length >= 8) fields.phone = phoneCandidate;

  return fields;
}

function hasMeaningfulSensitivePayload(mode: SensitiveInputMode, fields: SensitiveContactFields): boolean {
  if (mode === "name") return !!fields.name;
  if (mode === "email") return !!fields.email || !!fields.name;
  if (mode === "phone") return !!fields.phone;
  if (mode === "contact") return !!(fields.name || fields.email || fields.phone);
  return false;
}

function mergeSensitiveContact(
  current: CapturedSensitiveContact | null,
  incoming: SensitiveContactFields,
): CapturedSensitiveContact | null {
  const merged: CapturedSensitiveContact = {
    name: incoming.name || current?.name,
    email: incoming.email || current?.email,
    phone: (() => {
      const base = current?.phone || "";
      const next = incoming.phone || "";
      if (!base) return next;
      if (!next) return base;
      if (next.startsWith(base)) return next;
      if (base.startsWith(next)) return base;
      if (base.length < 10 && next.length < 10) return `${base}${next}`;
      return next.length >= base.length ? next : base;
    })(),
    ts: Date.now(),
  };
  if (!merged.name && !merged.email && !merged.phone) return null;
  return merged;
}

function cleanupSensitiveTranscript(text: string): string {
  const raw = String(text || "").trim();
  if (!raw) return raw;

  const parsed = extractContactIntentFields(raw);
  const explicitContactLead =
    /(?:казвам\s+се|името\s+ми\s+е|имейл(?:ът)?\s+ми\s+е|email|имейл|майл|поща|номер(?:ът)?\s+ми\s+е|телефон(?:ът)?\s+ми\s+е|телефон|номер)/iu.test(
      raw,
    );
  if (!explicitContactLead) return raw;

  if (parsed.name && parsed.email && parsed.phone) {
    return `Казвам се ${parsed.name}, имейлът ми е ${parsed.email}, телефонът ми е ${parsed.phone}`;
  }
  if (parsed.name && parsed.email) {
    return `Казвам се ${parsed.name}, имейлът ми е ${parsed.email}`;
  }
  if (parsed.name && parsed.phone) {
    return `Казвам се ${parsed.name}, телефонът ми е ${parsed.phone}`;
  }
  if (parsed.email && parsed.phone) {
    return `Имейлът ми е ${parsed.email}, телефонът ми е ${parsed.phone}`;
  }
  if (parsed.email) return `Имейлът ми е ${parsed.email}`;
  if (parsed.phone) return `Телефонът ми е ${parsed.phone}`;
  if (parsed.name) return `Казвам се ${parsed.name}`;

  return raw;
}

function stripLowConfidenceTag(text: string): string {
  return String(text || "")
    .replace(/^\[LOW_CONFIDENCE:\d+%\]\s*/, "")
    .trim();
}

function isLowConfidenceTranscript(text: string): boolean {
  return /^\[LOW_CONFIDENCE:\d+%\]/.test(String(text || ""));
}

function getTranscriptConfidencePercent(text: string): number | null {
  const match = String(text || "").match(/^\[LOW_CONFIDENCE:(\d+)%\]/);
  return match ? Number(match[1]) : null;
}

function sanitizeUserTranscriptForUi(text: string): string {
  return stripLowConfidenceTag(text).replace(/<end>/gi, "").replace(/\s+/g, " ").trim();
}

function shouldSkipStandaloneLowConfidence(text: string): boolean {
  const clean = sanitizeUserTranscriptForUi(text);
  // Never skip meaningful low-confidence chunks; dropping them causes missing transcript.
  return !clean;
}

function shouldDelayLowConfidenceCommit(text: string): boolean {
  const clean = stripLowConfidenceTag(text);
  if (!clean) return true;
  const words = clean.split(/\s+/).filter(Boolean);
  const maybeContact =
    /(@|маймунско|кльомба|gmail|abv|outlook|hotmail|yahoo|точка|\d{3,}|плюс|нула|едно|две|три|четири|пет|шест|седем|осем|девет)/i.test(
      clean,
    );
  if (maybeContact) return false;
  return clean.length <= LOW_CONF_SHORT_TEXT_MAX_CHARS || words.length <= LOW_CONF_SHORT_TEXT_MAX_WORDS;
}

function shouldReplaceBufferedTranscript(previous: string, nextText: string): boolean {
  const prevClean = stripLowConfidenceTag(previous).toLowerCase();
  const nextClean = stripLowConfidenceTag(nextText).toLowerCase();
  if (!prevClean || !nextClean) return false;
  if (!isLowConfidenceTranscript(previous)) return false;
  if (nextClean.length <= prevClean.length) return false;
  return nextClean.startsWith(prevClean) || prevClean.startsWith(nextClean.slice(0, Math.max(1, prevClean.length - 1)));
}

function shouldHoldForContinuation(text: string): boolean {
  const clean = stripLowConfidenceTag(text).trim().toLowerCase();
  if (!clean) return false;
  if (/[.!?…]$/.test(clean)) return false;

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return false;

  const lastWord = words[words.length - 1] || "";
  const trailingContinuation = new Set([
    "и",
    "или",
    "с",
    "със",
    "за",
    "от",
    "на",
    "по",
    "при",
    "към",
    "как",
    "какво",
    "колко",
    "кога",
    "къде",
    "дали",
    "ако",
    "че",
    "като",
    "защото",
    "понеже",
    "но",
    "ами",
    "също",
    "примерно",
  ]);

  if (trailingContinuation.has(lastWord)) return true;
  if (clean.endsWith(" нужда от") || clean.endsWith(" искам да") || clean.endsWith(" търся")) return true;
  if (/[,;:]$/.test(clean) && words.length >= 3) return true;
  // Phone number dictated in groups ("088 77 00...") — trailing digits signal more to come
  if (/\d$/.test(clean) && /(?:телефон|номер|phone|gsm|\+\d|088|087|089|086)/.test(clean)) return true;
  return false;
}

function isVeryShortClearAnswer(text: string): boolean {
  const clean = stripLowConfidenceTag(text).trim().toLowerCase();
  if (!clean) return false;
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 4) return false;
  return /^(да|не|добре|ок|okay|ok|супер|точно|така|ясно|разбира се|ами да|ами не|утре|днес|сега|категорично|разбрах|благодаря|мерси|чао|довиждане|здравейте|здрасти)$/i.test(
    clean,
  );
}

function looksLikeGeneralContactInput(text: string): boolean {
  const clean = stripLowConfidenceTag(text).toLowerCase();
  if (!clean) return false;
  return (
    /(?:имейл|email|майл|поща|телефон|номер|gsm|phone|маймунско|кльомба|джимейл|гмаил|абеве|абв|аутлук|gmail|gmal|gmeil|outlook|hotmail|yahoo|mail)/i.test(
      clean,
    ) ||
    /(?:\bнула\b|\bнео\b|\bneo\b|\bete\b|\beto\b|\bnula\b|\bnua\b|\bединайсет\b|\bосем\b|\bседем\b|\bдевет\b|\d{4,})/i.test(
      clean,
    )
  );
}

function detectContactLikeMode(text: string): SensitiveInputMode {
  const raw = stripLowConfidenceTag(String(text || "")).trim();
  if (!raw) return "general";

  const lowered = raw.toLowerCase();

  const hasAtLikeCue = /(?:@|маймунско|маймунка|кльомба|клумба|кломба|\bat\b)/i.test(lowered);
  const hasProviderCue = /(?:gmail|gmal|gmeil|джимейл|гмаил|abv|абв|outlook|аутлук|hotmail|yahoo)/i.test(lowered);
  const hasEmailLeadCue = /(?:имейл|email|e-mail|майл|поща)/i.test(lowered);
  const hasDotCue = /(?:точка|dot)/i.test(lowered);
  const emailCandidate = normalizeSpokenEmail(raw);
  const completeEmail = looksLikeCompleteEmail(emailCandidate);
  const emailLike =
    completeEmail ||
    ((hasEmailLeadCue || hasAtLikeCue || hasProviderCue) && (hasAtLikeCue || hasProviderCue || hasDotCue));

  const digitWords = (
    lowered.match(/\b(?:нула|едно|една|две|два|три|четири|пет|шест|седем|осем|девет|nula|neo|ete|eto|zero)\b/giu) || []
  ).length;
  const phoneDigits = getPhoneDigitCount(raw);
  const hasPhoneCue = /(?:телефон|номер|gsm|phone|мобилен|плюс|plus)/i.test(lowered);
  const completePhone = looksLikeCompletePhone(raw);
  const phoneLike =
    completePhone || ((hasPhoneCue || /^\+?[\d\s().-]+$/.test(raw)) && (phoneDigits >= 6 || digitWords >= 4));

  if (emailLike && phoneLike) return "contact";
  if (emailLike) return "email";
  if (phoneLike) return "phone";
  return "general";
}

function shouldTreatTextAsSensitive(text: string, expectedMode: SensitiveInputMode): boolean {
  const inferred = detectContactLikeMode(text);
  if (expectedMode === "general") return inferred !== "general";
  if (expectedMode === "name") return looksLikeSensitiveName(text);
  if (expectedMode === "email") return inferred === "email" || inferred === "contact" || looksLikePossibleEmail(text);
  if (expectedMode === "phone") return inferred === "phone" || inferred === "contact" || looksLikePossiblePhone(text);
  if (expectedMode === "contact") return inferred !== "general" || looksLikeSensitiveName(text);
  return false;
}

function getDynamicFlushDelay(
  text: string,
  source: "speech_final" | "utterance_end" | "debounce",
  isLowConfidence: boolean,
  sensitiveMode: SensitiveInputMode = "general",
): number {
  const clean = stripLowConfidenceTag(text).trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const length = clean.length;
  const continuation = shouldHoldForContinuation(clean);
  const shortAnswer = isVeryShortClearAnswer(clean);
  const autoDetectedMode = sensitiveMode === "general" ? detectContactLikeMode(clean) : sensitiveMode;
  const generalContactLike = sensitiveMode === "general" && autoDetectedMode !== "general";
  const sensitiveExtra = (SENSITIVE_MODE_EXTRA_WAIT_MS[autoDetectedMode] || 0) + (generalContactLike ? 600 : 0);

  if (source === "debounce") {
    if (shortAnswer && sensitiveMode === "general" && !generalContactLike) return 80;
    if (continuation) return 260 + Math.min(420, sensitiveExtra);
    if (generalContactLike) return 380;
    return sensitiveMode === "general" ? 180 : 280;
  }

  const minDelay = source === "speech_final" ? SPEECH_FINAL_MIN_MS : UTTERANCE_END_MIN_MS;
  const maxDelay = source === "speech_final" ? SPEECH_FINAL_MAX_MS : UTTERANCE_END_MAX_MS;

  let delay = minDelay;

  if (shortAnswer && sensitiveMode === "general" && !generalContactLike) delay = Math.min(delay, 120);
  if (words.length >= 6) delay += 80;
  if (words.length >= 10) delay += 120;
  if (length >= 50) delay += 100;
  if (continuation) delay += CONTINUATION_EXTRA_MS;
  if (isLowConfidence) delay += 180;
  delay += sensitiveExtra;

  return Math.max(minDelay, Math.min(delay, maxDelay));
}

function detectExpectedSensitiveInputMode(text: string): SensitiveInputMode {
  const t = String(text || "").toLowerCase();

  const asksName = /\b(име|имена|собствено(?:то)?|фамил(?:ия|но)?|презиме)\b/i.test(t);
  const asksPhone = /\b(телефон|телефона|телефонът|номер|номерът|phone|gsm|мобилен)\b/i.test(t);
  const asksEmail = /\b(имейл|e-mail|email|поща|майл)\b/i.test(t);

  if (asksName && (asksPhone || asksEmail)) return "contact";
  if (asksPhone && asksEmail) return "contact";
  if (asksEmail) return "email";
  if (asksPhone) return "phone";
  if (asksName) return "name";
  return "general";
}

function normalizeSensitiveName(text: string): string {
  return String(text || "")
    .replace(/\b(казвам\s+се|моето\s+име\s+е|името\s+ми\s+е|аз\s+съм)\b/giu, " ")
    .replace(/[^\p{L}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getPhoneDigitCount(text: string): number {
  return normalizeSpokenPhone(text).replace(/\D/g, "").length;
}

function looksLikeIncompletePhone(text: string): boolean {
  const digits = getPhoneDigitCount(text);
  return digits > 0 && digits < 10;
}

function looksLikeCompletePhone(text: string): boolean {
  const digits = getPhoneDigitCount(text);
  return digits >= 10 && digits <= 15;
}

function looksLikeIncompleteEmail(text: string): boolean {
  const raw = String(text || "").toLowerCase();
  const normalized = normalizeSpokenEmail(text);
  const emailCue = /(@|маймунско|кльомба|ет|точка|dot|gmail|abv|outlook|hotmail|yahoo|email|имейл|майл)/i.test(raw);
  if (!emailCue) return false;
  return !normalized.includes("@") || !normalized.includes(".");
}

function looksLikeCompleteEmail(text: string): boolean {
  const normalized = normalizeSpokenEmail(text);
  if (!normalized.includes("@") || !normalized.includes(".")) return false;
  const parts = normalized.split("@");
  if (parts.length !== 2) return false;
  return parts[0].length >= 1 && parts[1].includes(".") && parts[1].split(".").every(Boolean);
}

function looksLikeSensitiveName(text: string): boolean {
  const cleaned = normalizeSensitiveName(text);
  if (!cleaned) return false;
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 4) return false;
  return words.every((w) => w.length >= 2);
}

function isSensitiveFragmentIncomplete(text: string, mode: SensitiveInputMode): boolean {
  if (!shouldTreatTextAsSensitive(text, mode)) return false;
  if (mode === "phone") return looksLikeIncompletePhone(text);
  if (mode === "email") return looksLikeIncompleteEmail(text);
  if (mode === "name") return !looksLikeSensitiveName(text);
  if (mode === "contact") {
    const hasPhone = getPhoneDigitCount(text) > 0;
    const hasEmailCue =
      /(@|маймунско|маймунка|кльомба|кльомба|точка|gmail|gmal|abv|outlook|hotmail|yahoo|имейл|майл)/i.test(
        String(text || ""),
      );
    if (hasPhone && looksLikeIncompletePhone(text)) return true;
    if (hasEmailCue && looksLikeIncompleteEmail(text)) return true;
    if (!hasPhone && !hasEmailCue && looksLikeSensitiveName(text)) return false;
  }
  return false;
}

function normalizeBySensitiveMode(text: string, mode: SensitiveInputMode): string {
  const raw = stripLowConfidenceTag(text);
  if (mode === "phone") {
    const phone = normalizeSpokenPhone(text);
    return getPhoneDigitCount(phone) >= 6 ? phone : raw;
  }
  if (mode === "email") {
    const email = normalizeSpokenEmail(text);
    return looksLikeCompleteEmail(email) || looksLikePossibleEmail(text) ? email || raw : raw;
  }
  if (mode === "name") return normalizeSensitiveName(text) || raw;
  return raw;
}

function combineSensitiveFragments(existing: string, incoming: string, mode: SensitiveInputMode): string {
  const a = stripLowConfidenceTag(existing).trim();
  const b = stripLowConfidenceTag(incoming).trim();
  if (!a) return b;
  if (!b) return a;

  if (mode === "phone") {
    return `${normalizeSpokenPhone(a)}${normalizeSpokenPhone(b)}`;
  }

  if (mode === "email") {
    return `${a} ${b}`.replace(/\s+/g, " ").trim();
  }

  if (mode === "contact") {
    const phoneA = normalizeSpokenPhone(a);
    const phoneB = normalizeSpokenPhone(b);
    const hasOnlyDigitsA = phoneA.length > 0 && phoneA.length === a.replace(/\D/g, "").length;
    const hasOnlyDigitsB = phoneB.length > 0 && phoneB.length === b.replace(/\D/g, "").length;
    if (hasOnlyDigitsA || hasOnlyDigitsB || /номер|телефон/i.test(`${a} ${b}`)) {
      const mergedPhone = `${phoneA}${phoneB}`;
      const rest = `${a} ${b}`
        .replace(/[\d+\s,.-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return [rest, mergedPhone].filter(Boolean).join(" ").trim();
    }
  }

  return `${a} ${b}`.replace(/\s+/g, " ").trim();
}

function shouldAllowBargeIn(text: string): boolean {
  const norm = normalizeBgText(text);
  if (!norm) return false;
  // Always allow explicit stop commands
  if (BARGE_IN_COMMANDS.some((w) => norm.includes(w))) return true;
  // Require meaningful speech to interrupt — not just noise fragments
  if (norm.length < MIN_BARGE_IN_CHARS) return false;
  const words = norm.split(" ").filter(Boolean);
  if (words.length < MIN_BARGE_IN_WORDS) return false;
  // Extra: very short single-syllable words are likely noise
  if (words.length === 1 && norm.length <= 4) return false;
  return true;
}

// Fast, stable string hash for prompt key (not crypto)
function hash32(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function parseBulgarianDateText(raw: string): string[] {
  const text = String(raw || "")
    .toLowerCase()
    .trim();
  if (!text) return [];

  const months: Record<string, number> = {
    януари: 1,
    ян: 1,
    февруари: 2,
    фев: 2,
    март: 3,
    мар: 3,
    mart: 3,
    април: 4,
    апр: 4,
    april: 4,
    apr: 4,
    май: 5,
    mai: 5,
    may: 5,
    юни: 6,
    juni: 6,
    june: 6,
    jun: 6,
    юли: 7,
    juli: 7,
    july: 7,
    jul: 7,
    август: 8,
    авг: 8,
    avgust: 8,
    august: 8,
    aug: 8,
    септември: 9,
    сеп: 9,
    septemvri: 9,
    september: 9,
    sep: 9,
    октомври: 10,
    окт: 10,
    oktomvri: 10,
    october: 10,
    oct: 10,
    ноември: 11,
    ное: 11,
    noemvri: 11,
    november: 11,
    nov: 11,
    декември: 12,
    дек: 12,
    dekemvri: 12,
    december: 12,
    dec: 12,
    january: 1,
    jan: 1,
    february: 2,
    feb: 2,
    march: 3,
    mar: 3,
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const inferYear = (dayNum: number, monthNum: number, explicitYear?: string): number => {
    if (explicitYear && /^\d{4}$/.test(explicitYear)) return Number(explicitYear);
    if (monthNum < currentMonth) return currentYear + 1;
    if (monthNum === currentMonth && dayNum < currentDay) return currentYear + 1;
    return currentYear;
  };

  const toIso = (dayNum: number, monthNum: number, explicitYear?: string): string => {
    const yearNum = inferYear(dayNum, monthNum, explicitYear);
    return `${String(yearNum)}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
  };

  const out: string[] = [];
  const seen = new Set<string>();
  const pushIso = (iso: string) => {
    if (!iso || seen.has(iso)) return;
    seen.add(iso);
    out.push(iso);
  };

  const monthPattern = Object.keys(months)
    .sort((a, b) => b.length - a.length)
    .map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  // 1) 16 mart do 21 mart / 16 март до 21 март / 16-21 март
  const fullRangeRe = new RegExp(
    String.raw`\b(\d{1,2})\s*(${monthPattern})(?:\s*(\d{4}))?\s*(?:до|do|to|[-–—])\s*(\d{1,2})\s*(${monthPattern})(?:\s*(\d{4}))?\b`,
    "giu",
  );

  let m: RegExpExecArray | null;
  while ((m = fullRangeRe.exec(text))) {
    const d1 = Number(m[1]);
    const m1 = months[String(m[2] || "").toLowerCase()];
    const y1 = m[3];
    const d2 = Number(m[4]);
    const m2 = months[String(m[5] || "").toLowerCase()];
    const y2 = m[6];
    if (!m1 || !m2 || d1 < 1 || d1 > 31 || d2 < 1 || d2 > 31) continue;
    pushIso(toIso(d1, m1, y1));
    pushIso(toIso(d2, m2, y2 || y1));
  }

  // 2) 16 do 21 mart / 16 до 21 март
  const sharedMonthRangeRe = new RegExp(
    String.raw`\b(\d{1,2})\s*(?:до|do|to|[-–—])\s*(\d{1,2})\s*(${monthPattern})(?:\s*(\d{4}))?\b`,
    "giu",
  );

  while ((m = sharedMonthRangeRe.exec(text))) {
    const d1 = Number(m[1]);
    const d2 = Number(m[2]);
    const monthNum = months[String(m[3] || "").toLowerCase()];
    const explicitYear = m[4];
    if (!monthNum || d1 < 1 || d1 > 31 || d2 < 1 || d2 > 31) continue;
    pushIso(toIso(d1, monthNum, explicitYear));
    pushIso(toIso(d2, monthNum, explicitYear));
  }

  // 3) отделни дати: 16 mart / 16 март
  const singleDateRe = new RegExp(String.raw`\b(\d{1,2})\s*(${monthPattern})(?:\s*(\d{4}))?\b`, "giu");

  while ((m = singleDateRe.exec(text))) {
    const dayNum = Number(m[1]);
    const monthNum = months[String(m[2] || "").toLowerCase()];
    const explicitYear = m[3];
    if (!monthNum || dayNum < 1 || dayNum > 31) continue;
    pushIso(toIso(dayNum, monthNum, explicitYear));
  }

  // 4) ако няма месец, но има range като "16 do 21" -> ползвай текущ месец
  if (out.length === 0) {
    const dayOnlyRange = text.match(/\b(\d{1,2})\s*(?:до|do|to|[-–—])\s*(\d{1,2})\b/i);
    if (dayOnlyRange) {
      const d1 = Number(dayOnlyRange[1]);
      const d2 = Number(dayOnlyRange[2]);
      if (d1 >= 1 && d1 <= 31 && d2 >= 1 && d2 <= 31) {
        pushIso(toIso(d1, currentMonth));
        pushIso(toIso(d2, currentMonth));
      }
    }
  }

  return out.slice(0, 2);
}

function getTodayContextText(): string {
  const now = new Date();
  const weekdays = ["неделя", "понеделник", "вторник", "сряда", "четвъртък", "петък", "събота"];
  const months = [
    "януари",
    "февруари",
    "март",
    "април",
    "май",
    "юни",
    "юли",
    "август",
    "септември",
    "октомври",
    "ноември",
    "декември",
  ];

  const weekday = weekdays[now.getDay()];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();

  return `[CURRENT_DATE_CONTEXT: днес е ${weekday}, ${day} ${month} ${year} година. Ако клиентът каже дата без година, приемай най-близката бъдеща логична дата.]`;
}

function normalizeRoomText(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”"']/g, " ")
    .replace(/[(){}\[\]:;,.!?/\\|<>+=_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function roomOrdinalToIndex(text: string): number {
  const t = normalizeRoomText(text);
  if (!t) return -1;
  if (/\b(1|purvi|parvi|първи|първата|първия)\b/.test(t)) return 0;
  if (/\b(2|vtori|втори|втората|втория)\b/.test(t)) return 1;
  if (/\b(3|treti|трети|третата|третия)\b/.test(t)) return 2;
  if (/\b(4|chetvurti|четвърти|четвъртата|четвъртия)\b/.test(t)) return 3;
  return -1;
}

/**
 * Returns how many chars at the END of `older` match the START of `newer`.
 * Used to detect Soniox's rolling split: e.g. chunk1 ends with "@gmail.com"
 * and chunk2 starts with "@gmail.com, а номерът е…" — overlap = 10 chars.
 * Minimum overlap = 4 chars to avoid false positives on short words.
 */
function getSuffixPrefixOverlap(older: string, newer: string): number {
  const maxCheck = Math.min(older.length, newer.length, 80);
  for (let len = maxCheck; len >= 4; len--) {
    if (older.endsWith(newer.slice(0, len))) return len;
  }
  return 0;
}

function overlapsAsRollingCorrection(older: string, newer: string): boolean {
  if (!older || !newer) return false;
  const oldWords = older.split(/\s+/).filter(Boolean);
  const newWords = newer.split(/\s+/).filter(Boolean);
  if (oldWords.length < 4 || newWords.length < 4) return false;
  const halfNew = newWords.slice(0, Math.max(8, Math.ceil(newWords.length * 0.6))).join(" ");
  for (let start = 0; start <= oldWords.length - 4; start++) {
    const phrase = oldWords.slice(start, start + 4).join(" ");
    if (halfNew.includes(phrase)) return true;
  }
  return false;
}

function resolveRoomTypeFromState(rawRoomType: string, reservationState: any): string {
  const rooms = Array.isArray(reservationState?.available_rooms) ? reservationState.available_rooms : [];
  const direct = String(rawRoomType || "").trim();
  if (!direct) return "";

  const idx = roomOrdinalToIndex(direct);
  if (idx >= 0 && rooms[idx]?.name) return String(rooms[idx].name).trim();

  const wanted = normalizeRoomText(direct);
  if (!wanted) return "";

  const exact = rooms.find((r: any) => normalizeRoomText(String(r?.name || "")) === wanted);
  if (exact?.name) return String(exact.name).trim();

  const soft = rooms.find((r: any) => {
    const rn = normalizeRoomText(String(r?.name || ""));
    return rn && (rn.includes(wanted) || wanted.includes(rn));
  });
  if (soft?.name) return String(soft.name).trim();

  return direct;
}

type SubmitFormTarget = {
  form_id?: string;
  fingerprint?: string;
  kind?: string;
  url?: string;
};

function extractSubmitFormTargetsFromInstruction(instruction: string): SubmitFormTarget[] {
  const src = String(instruction || "");
  if (!src) return [];

  const lines = src.split(/\r?\n/);
  const targets: SubmitFormTarget[] = [];
  let current: SubmitFormTarget | null = null;

  const flush = () => {
    if (!current) return;
    if (current.form_id || current.fingerprint) targets.push(current);
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("- ")) {
      flush();
      const head = line.slice(2).trim();
      const match = head.match(/^(form|wizard|availability)(?:\s*@\s*(.+))?$/i);
      current = {
        kind: match?.[1]?.toLowerCase() || "",
        url: match?.[2]?.trim() || "",
      };
      continue;
    }

    if (!current) continue;

    const formIdMatch = line.match(/^form_id:\s*(.+)$/i);
    if (formIdMatch) {
      current.form_id = formIdMatch[1].trim();
      continue;
    }

    const fingerprintMatch = line.match(/^fingerprint:\s*(.+)$/i);
    if (fingerprintMatch) {
      current.fingerprint = fingerprintMatch[1].trim();
      continue;
    }
  }

  flush();
  return targets;
}

function pickPreferredSubmitFormTarget(targets: SubmitFormTarget[]): SubmitFormTarget | null {
  if (!Array.isArray(targets) || targets.length === 0) return null;

  const forms = targets.filter((t) => String(t?.kind || "").toLowerCase() === "form");
  if (forms.length > 0) {
    const withFormId = forms.find((t) => t.form_id || t.fingerprint);
    if (withFormId) return withFormId;
  }

  const anyTarget = targets.find((t) => t.form_id || t.fingerprint);
  return anyTarget || null;
}

export const useGeminiVoice = ({
  onMessage,
  onError,
  onSpeakingChange,
  onListeningChange,
  onTranscript,
}: UseGeminiVoiceProps = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  // ★ Ref mirrors — guards must read refs (never stale), state is for UI only
  const isPreparedRef = useRef(false);
  const isPreparingRef = useRef(false);
  const isConnectedRef = useRef(false);
  const isConnectingRef = useRef(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const isProcessingQueueRef = useRef(false);
  const sessionDataRef = useRef<SessionData | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const connectMutexRef = useRef(false);
  const companyNameRef = useRef<string>("");
  const silenceWatchdogRef = useRef<number | null>(null);
  const silenceNudgeSentRef = useRef(false);
  const silenceNudgeCountRef = useRef(0);
  const gainRef = useRef<GainNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const actualSampleRateRef = useRef<number>(48000);
  const greetingSentRef = useRef(false);
  const speakEndRef = useRef<number>(0);
  const speakStartRef = useRef<number>(0);
  const recentUtterancesRef = useRef<Array<{ text: string; ts: number }>>([]);
  const dgKeepAliveRef = useRef<number | null>(null);
  const currentResponseTextRef = useRef("");
  const dgSTTRef = useRef<DgSTTState>({ ws: null, isReady: false });
  const utteranceBufferRef = useRef<string[]>([]);
  const finalChunksRef = useRef<string[]>([]);
  const firstFinalChunkTsRef = useRef<number>(0);
  const lastFinalChunkTsRef = useRef<number>(0);
  const lastInterimTranscriptRef = useRef<string>("");
  const utteranceDebounceRef = useRef<number | null>(null);
  const pendingSensitiveCommitTimerRef = useRef<number | null>(null);
  const autoReservationCheckKeyRef = useRef<string>("");
  const autoReservationCheckDoneKeyRef = useRef<string>("");
  const reservationCheckInFlightRef = useRef<boolean>(false);

  // VAD refs
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadTimerRef = useRef<number | null>(null);
  const vadIsSpeakingRef = useRef<boolean>(false);
  const vadRafRef = useRef<number | null>(null);
  const vadThresholdRef = useRef<number>(0.012);
  const vadNoiseFloorRef = useRef<number>(0.003);
  const inputGainNodeRef = useRef<GainNode | null>(null);
  const inputCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const inputFilterRef = useRef<BiquadFilterNode | null>(null);
  const processorSinkRef = useRef<GainNode | null>(null);
  const sttFlushTimerRef = useRef<number | null>(null);
  const lowConfidenceHoldRef = useRef<number | null>(null);
  const vadSpeechFramesRef = useRef<number>(0);
  const lastCommittedUtteranceRef = useRef<{ text: string; ts: number }>({ text: "", ts: 0 });
  const lastSpeechStartedAtRef = useRef<number>(0);
  const expectedSensitiveInputModeRef = useRef<SensitiveInputMode>("general");
  const pendingSensitiveCaptureRef = useRef<PendingSensitiveCapture | null>(null);
  const capturedSensitiveContactRef = useRef<CapturedSensitiveContact | null>(null);
  const assistantTurnCanceledRef = useRef(false);
  const vadBargeInFramesRef = useRef<number>(0);

  // ★ NEW: track what context we prepared for (sessionId/companyName/systemPrompt)
  const preparedKeyRef = useRef<string>("");
  const lastSubmitFormTargetRef = useRef<SubmitFormTarget | null>(null);

  const updateSpeaking = useCallback(
    (speaking: boolean) => {
      setIsSpeaking(speaking);
      onSpeakingChange?.(speaking);
      if (speaking) speakStartRef.current = Date.now();
      else speakEndRef.current = Date.now();
    },
    [onSpeakingChange],
  );

  const updateListening = useCallback(
    (listening: boolean) => {
      setIsListening(listening);
      onListeningChange?.(listening);
    },
    [onListeningChange],
  );

  const clearSilenceWatchdog = useCallback(() => {
    if (silenceWatchdogRef.current) {
      window.clearTimeout(silenceWatchdogRef.current);
      silenceWatchdogRef.current = null;
    }
  }, []);

  const sendToGemini = useCallback((text: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(
      JSON.stringify({
        client_content: {
          turns: [{ role: "user", parts: [{ text }] }],
          turn_complete: true,
        },
      }),
    );
  }, []);

  const startSilenceWatchdog = useCallback(() => {
    clearSilenceWatchdog();
    silenceWatchdogRef.current = window.setTimeout(() => {
      if (isPlayingRef.current) return;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      if (silenceNudgeCountRef.current >= 1) return;
      if (silenceNudgeSentRef.current) return;
      silenceNudgeSentRef.current = true;
      silenceNudgeCountRef.current += 1;
      sendToGemini("Все още ли сте на линия?");
    }, 25000);
  }, [clearSilenceWatchdog, sendToGemini]);

  const handleUtteranceRef = useRef<(text: string) => void>(() => {});

  /** Cancel every pending flush timer — called on SpeechStarted / new is_final */
  const cancelAllPendingFlushes = useCallback(() => {
    if (utteranceDebounceRef.current) {
      window.clearTimeout(utteranceDebounceRef.current);
      utteranceDebounceRef.current = null;
    }
    if (sttFlushTimerRef.current) {
      window.clearTimeout(sttFlushTimerRef.current);
      sttFlushTimerRef.current = null;
    }
    if (lowConfidenceHoldRef.current) {
      window.clearTimeout(lowConfidenceHoldRef.current);
      lowConfidenceHoldRef.current = null;
    }
  }, []);

  const flushInterruptedAssistantTurn = useCallback(() => {
    const partial = currentResponseTextRef.current.replace(/\s+/g, " ").trim();
    if (!partial) return;

    const looksLikeAction =
      partial.startsWith("{") ||
      partial.includes('"type":"action_request"') ||
      partial.includes('"type": "action_request"') ||
      partial.includes('"action":"make_reservation"') ||
      partial.includes('"action": "make_reservation"') ||
      partial.includes('"action":"submit_form"') ||
      partial.includes('"action": "submit_form"');

    if (looksLikeAction) return;

    onMessage?.({ role: "assistant", content: partial });
    onTranscript?.(partial, true, "assistant");
    currentResponseTextRef.current = "";
  }, [onMessage, onTranscript]);

  /** Immediately stop assistant playback + mark turn canceled (speech-only barge-in) */
  const performEarlyBargeIn = useCallback(() => {
    if (!isPlayingRef.current) return;
    console.log("[BARGE-IN] ⚡ Early speech-based interrupt");
    assistantTurnCanceledRef.current = true;
    scheduledSourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {}
    });
    scheduledSourcesRef.current = [];
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {}
      activeSourceRef.current = null;
    }
    audioQueueRef.current = [];
    isProcessingQueueRef.current = false;
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
    updateSpeaking(false);
    flushInterruptedAssistantTurn();
  }, [flushInterruptedAssistantTurn, updateSpeaking]);

  const buildStableTranscriptFromBuffers = useCallback(() => {
    const finalJoined = finalChunksRef.current.join(" ").trim();
    const fallbackJoined = utteranceBufferRef.current
      .map((x) => stripLowConfidenceTag(x))
      .join(" ")
      .trim();
    const interimFallback = lastInterimTranscriptRef.current.trim();
    return (finalJoined || fallbackJoined || interimFallback).replace(/\s+/g, " ").trim();
  }, []);

  const flushBufferedUtterance = useCallback(() => {
    if (utteranceDebounceRef.current) {
      window.clearTimeout(utteranceDebounceRef.current);
      utteranceDebounceRef.current = null;
    }
    if (sttFlushTimerRef.current) {
      window.clearTimeout(sttFlushTimerRef.current);
      sttFlushTimerRef.current = null;
    }
    if (lowConfidenceHoldRef.current) {
      window.clearTimeout(lowConfidenceHoldRef.current);
      lowConfidenceHoldRef.current = null;
    }

    const resetSttBuffers = () => {
      utteranceBufferRef.current = [];
      finalChunksRef.current = [];
      firstFinalChunkTsRef.current = 0;
      lastFinalChunkTsRef.current = 0;
      lastInterimTranscriptRef.current = "";
    };

    // Guard: wait a short stable window after the latest final chunk.
    const now = Date.now();
    const lastTs = lastFinalChunkTsRef.current;
    if (lastTs > 0 && now - lastTs < MIN_AGGREGATION_WINDOW_MS) {
      const waitMs = Math.max(80, MIN_AGGREGATION_WINDOW_MS - (now - lastTs) + 30);
      console.log("[STT] waiting for stable final chunk window", { waitMs, elapsed: now - lastTs });
      sttFlushTimerRef.current = window.setTimeout(() => {
        sttFlushTimerRef.current = null;
        flushBufferedUtterance();
      }, waitMs);
      return;
    }

    const firstTs = firstFinalChunkTsRef.current;
    if (firstTs > 0 && now - firstTs < MIN_AGGREGATION_WINDOW_MS && finalChunksRef.current.length <= 1) {
      const waitMs = Math.max(80, MIN_AGGREGATION_WINDOW_MS - (now - firstTs) + 30);
      console.log("[STT] flush too early (single final chunk), reschedule", { waitMs, elapsed: now - firstTs });
      sttFlushTimerRef.current = window.setTimeout(() => {
        sttFlushTimerRef.current = null;
        flushBufferedUtterance();
      }, waitMs);
      return;
    }

    const fullText = buildStableTranscriptFromBuffers();
    if (!fullText) {
      resetSttBuffers();
      return;
    }

    const expectedSensitiveMode = expectedSensitiveInputModeRef.current;
    const inferredSensitiveMode = detectContactLikeMode(fullText);
    const sensitiveMode = expectedSensitiveMode === "general" ? inferredSensitiveMode : expectedSensitiveMode;
    if (sensitiveMode === "general" && shouldSkipStandaloneLowConfidence(fullText)) {
      console.log("[STT] skipping standalone low-confidence fragment", fullText);
      resetSttBuffers();
      return;
    }

    let candidateText = fullText;

    const pendingSensitive = pendingSensitiveCaptureRef.current;
    if (pendingSensitive && Date.now() - pendingSensitive.ts < SENSITIVE_CAPTURE_WINDOW_MS) {
      if (
        pendingSensitive.mode === sensitiveMode ||
        pendingSensitive.mode === "contact" ||
        sensitiveMode === "contact"
      ) {
        candidateText = combineSensitiveFragments(
          pendingSensitive.raw,
          candidateText,
          sensitiveMode === "general" ? pendingSensitive.mode : sensitiveMode,
        );
        pendingSensitiveCaptureRef.current = null;
        if (pendingSensitiveCommitTimerRef.current) {
          window.clearTimeout(pendingSensitiveCommitTimerRef.current);
          pendingSensitiveCommitTimerRef.current = null;
        }
      }
    }

    if (sensitiveMode !== "general" && isSensitiveFragmentIncomplete(candidateText, sensitiveMode)) {
      if (sensitiveMode === "phone" && getPhoneDigitCount(candidateText) < 10) {
        pendingSensitiveCaptureRef.current = {
          mode: sensitiveMode,
          raw: candidateText,
          normalized: normalizeBySensitiveMode(candidateText, sensitiveMode),
          ts: Date.now(),
        };
        if (pendingSensitiveCommitTimerRef.current) {
          window.clearTimeout(pendingSensitiveCommitTimerRef.current);
        }
        pendingSensitiveCommitTimerRef.current = window.setTimeout(() => {
          pendingSensitiveCommitTimerRef.current = null;
          const pending = pendingSensitiveCaptureRef.current;
          if (!pending) return;
          if (Date.now() - pending.ts > SENSITIVE_CAPTURE_WINDOW_MS) {
            pendingSensitiveCaptureRef.current = null;
            return;
          }
          console.log("[STT] fallback commit for pending phone fragment", { raw: pending.raw });
          pendingSensitiveCaptureRef.current = null;
          handleUtteranceRef.current(pending.raw);
        }, SENSITIVE_INCOMPLETE_HOLD_MS + 900);
        console.log("[STT] HOLD phone until full number", { candidateText });
        resetSttBuffers();
        return;
      }
      const partialFields = extractContactFields(candidateText, sensitiveMode);
      if (hasMeaningfulSensitivePayload(sensitiveMode, partialFields)) {
        console.log("[STT] partial sensitive payload ready -> commit", { mode: sensitiveMode, raw: candidateText });
      } else {
        pendingSensitiveCaptureRef.current = {
          mode: sensitiveMode,
          raw: candidateText,
          normalized: normalizeBySensitiveMode(candidateText, sensitiveMode),
          ts: Date.now(),
        };
        if (pendingSensitiveCommitTimerRef.current) {
          window.clearTimeout(pendingSensitiveCommitTimerRef.current);
        }
        pendingSensitiveCommitTimerRef.current = window.setTimeout(() => {
          pendingSensitiveCommitTimerRef.current = null;
          const pending = pendingSensitiveCaptureRef.current;
          if (!pending) return;
          if (Date.now() - pending.ts > SENSITIVE_CAPTURE_WINDOW_MS) {
            pendingSensitiveCaptureRef.current = null;
            return;
          }
          console.log("[STT] fallback commit for pending sensitive fragment", { mode: pending.mode, raw: pending.raw });
          pendingSensitiveCaptureRef.current = null;
          handleUtteranceRef.current(pending.raw);
        }, SENSITIVE_INCOMPLETE_HOLD_MS + 400);
        console.log("[STT] hold incomplete sensitive capture", pendingSensitiveCaptureRef.current);
        resetSttBuffers();
        return;
      }
    }

    const cleanFull = stripLowConfidenceTag(candidateText).toLowerCase();
    const last = lastCommittedUtteranceRef.current;
    if (cleanFull && last.text === cleanFull && Date.now() - last.ts < 3500) {
      console.log("[STT] skip duplicate utterance", cleanFull);
      resetSttBuffers();
      return;
    }

    resetSttBuffers();
    lastCommittedUtteranceRef.current = { text: cleanFull, ts: Date.now() };
    handleUtteranceRef.current(candidateText);
  }, [buildStableTranscriptFromBuffers]);

  const scheduleBufferedFlush = useCallback(
    (reason: string, delayMs: number) => {
      if (sttFlushTimerRef.current) {
        window.clearTimeout(sttFlushTimerRef.current);
        sttFlushTimerRef.current = null;
      }

      sttFlushTimerRef.current = window.setTimeout(() => {
        sttFlushTimerRef.current = null;
        console.log(`[STT] ${reason} -> flush`);
        flushBufferedUtterance();
      }, delayMs);
    },
    [flushBufferedUtterance],
  );

  const connectSTT = useCallback(() => {
    const sonioxApiKey = import.meta.env.VITE_SONIOX_API_KEY as string | undefined;
    if (!sonioxApiKey || sonioxApiKey.trim() === "" || sonioxApiKey === "undefined") {
      onError?.("Липсва VITE_SONIOX_API_KEY");
      return;
    }

    const cleanKey = sonioxApiKey.trim().replace(/^["']|["']$/g, "");
    console.log("[STT] Connecting Soniox realtime (bg default)");

    const ws = new WebSocket("wss://stt-rt.soniox.com/transcribe-websocket");
    const stt = dgSTTRef.current;
    stt.ws = ws;
    stt.isReady = false;

    ws.onopen = () => {
      try {
        ws.send(
          JSON.stringify({
            api_key: cleanKey,
            model: "stt-rt-preview",
            audio_format: "s16le",
            sample_rate: 16000,
            num_channels: 1,
            language_hints: ["bg"],
            enable_endpoint_detection: true,
          }),
        );
        stt.isReady = true;
        console.log("[STT] ✅ Soniox socket open; start message sent");
        // Keepalive: prevent Soniox 408 timeout while NEO is speaking
        // Send a fresh 20 ms silent frame every 8 s — but ONLY when NOT speaking,
        // so we never inject silence mid-utterance (which would garble phone numbers).
        if (dgKeepAliveRef.current) clearInterval(dgKeepAliveRef.current);
        dgKeepAliveRef.current = window.setInterval(() => {
          if (stt.ws && stt.ws.readyState === WebSocket.OPEN && stt.isReady && !vadIsSpeakingRef.current) {
            try {
              stt.ws.send(new Int16Array(320).buffer);
            } catch {} // fresh buffer every call — avoids detachment
          }
        }, 8000) as unknown as number;
      } catch (e) {
        console.error("[STT] Soniox start message failed", e);
        onError?.("Soniox STT старт грешка");
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(typeof event.data === "string" ? event.data : "{}");

        if (data?.error_message) {
          console.error("[STT] Soniox error", data?.error_code, data?.error_message);
          const isTimeout = data?.error_code === 408 || /timeout/i.test(String(data?.error_message || ""));
          if (isTimeout) {
            // Commit any pending sensitive capture before reconnect so data isn't lost
            const pendingOnTimeout = pendingSensitiveCaptureRef.current;
            if (pendingOnTimeout && Date.now() - pendingOnTimeout.ts < SENSITIVE_CAPTURE_WINDOW_MS) {
              console.log("[STT] Timeout — flushing pending sensitive capture before reconnect", pendingOnTimeout.raw);
              pendingSensitiveCaptureRef.current = null;
              if (pendingSensitiveCommitTimerRef.current) {
                window.clearTimeout(pendingSensitiveCommitTimerRef.current);
                pendingSensitiveCommitTimerRef.current = null;
              }
              handleUtteranceRef.current(pendingOnTimeout.raw);
            }
            console.log("[STT] Soniox timeout — reconnecting silently");
            ws.close();
            return;
          }
          onError?.(`Soniox STT грешка: ${data.error_message}`);
          return;
        }

        if (data?.finished === true) {
          console.log("[STT] Soniox finished");
          return;
        }

        const tokens = Array.isArray(data?.tokens) ? data.tokens : [];
        if (!tokens.length) return;

        const transcript = tokens
          .map((token: any) => String(token?.text || "").replace(/<end>/gi, ""))
          .join("")
          .replace(/\s+/g, " ")
          .trim();

        if (!transcript) return;

        const hasFinal = tokens.some((token: any) => !!token?.is_final);
        const hasNonFinal = tokens.some((token: any) => token?.is_final === false);
        const minConfidence = tokens.reduce((min: number, token: any) => {
          const value = typeof token?.confidence === "number" ? token.confidence : 1;
          return Math.min(min, value);
        }, 1);

        cancelAllPendingFlushes();
        lastSpeechStartedAtRef.current = Date.now();

        if (isPlayingRef.current && Date.now() - speakStartRef.current > ANTI_BARGE_IN_MS) {
          const hasSpeechEvidence = (hasNonFinal || hasFinal) && minConfidence >= 0.6;
          if (hasSpeechEvidence && shouldAllowBargeIn(transcript)) {
            performEarlyBargeIn();
          }
        }

        if (hasNonFinal) {
          const interimClean = sanitizeUserTranscriptForUi(transcript);
          lastInterimTranscriptRef.current = interimClean;
          const preview = [finalChunksRef.current.join(" "), interimClean]
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          onTranscript?.(preview || interimClean, false, "user");
        }

        if (!hasFinal) {
          if (utteranceDebounceRef.current) {
            window.clearTimeout(utteranceDebounceRef.current);
          }
          utteranceDebounceRef.current = window.setTimeout(() => {
            utteranceDebounceRef.current = null;
            const latestJoined = buildStableTranscriptFromBuffers() || sanitizeUserTranscriptForUi(transcript);
            if (latestJoined) {
              scheduleBufferedFlush(
                "debounce",
                getDynamicFlushDelay(latestJoined, "debounce", false, expectedSensitiveInputModeRef.current),
              );
            }
          }, UTTERANCE_DEBOUNCE_MS);
          return;
        }

        const taggedTranscript =
          minConfidence < 0.55 ? `[LOW_CONFIDENCE:${Math.round(minConfidence * 100)}%] ${transcript}` : transcript;

        const prev = utteranceBufferRef.current[utteranceBufferRef.current.length - 1] || "";
        if (prev && shouldReplaceBufferedTranscript(prev, taggedTranscript)) {
          utteranceBufferRef.current[utteranceBufferRef.current.length - 1] = taggedTranscript;
        } else if (prev !== taggedTranscript) {
          utteranceBufferRef.current.push(taggedTranscript);
        }

        const cleanFinalTranscript = sanitizeUserTranscriptForUi(transcript);
        if (cleanFinalTranscript) {
          const nowTs = Date.now();
          if (finalChunksRef.current.length === 0) {
            firstFinalChunkTsRef.current = nowTs;
          }
          lastFinalChunkTsRef.current = nowTs;
          lastInterimTranscriptRef.current = cleanFinalTranscript;
          const prevFinalChunk = finalChunksRef.current[finalChunksRef.current.length - 1] || "";
          if (!prevFinalChunk) {
            finalChunksRef.current.push(cleanFinalTranscript);
          } else {
            const prevNorm = prevFinalChunk.toLowerCase().trim();
            const nextNorm = cleanFinalTranscript.toLowerCase().trim();
            if (nextNorm === prevNorm) {
              // exact dup — noop
            } else if (nextNorm.startsWith(prevNorm) && nextNorm.length > prevNorm.length) {
              finalChunksRef.current[finalChunksRef.current.length - 1] = cleanFinalTranscript;
            } else if (prevNorm.endsWith(nextNorm) && prevNorm.length > nextNorm.length) {
              // keep older
            } else if (overlapsAsRollingCorrection(prevNorm, nextNorm)) {
              // Soniox re-emitted the same sentence with a correction — replace, don't append
              finalChunksRef.current[finalChunksRef.current.length - 1] = cleanFinalTranscript;
            } else {
              // Check for suffix→prefix overlap (e.g. chunk1 ends with "@gmail.com",
              // chunk2 starts with "@gmail.com, а номерът е…"). Stitch instead of appending.
              const overlapLen = getSuffixPrefixOverlap(prevNorm, nextNorm);
              if (overlapLen >= 4) {
                const uniqueSuffix = cleanFinalTranscript.slice(overlapLen).trim();
                if (uniqueSuffix) {
                  finalChunksRef.current[finalChunksRef.current.length - 1] = `${prevFinalChunk} ${uniqueSuffix}`
                    .replace(/\s+/g, " ")
                    .trim();
                }
                // else nextNorm is fully contained in prevNorm's tail — noop
              } else {
                finalChunksRef.current.push(cleanFinalTranscript);
              }
            }
          }
        }

        const uiTranscript =
          buildStableTranscriptFromBuffers() || sanitizeUserTranscriptForUi(utteranceBufferRef.current.join(" "));
        if (uiTranscript) {
          onTranscript?.(uiTranscript, false, "user");
        }

        if (lowConfidenceHoldRef.current) {
          window.clearTimeout(lowConfidenceHoldRef.current);
          lowConfidenceHoldRef.current = null;
        }

        const sensitiveMode = expectedSensitiveInputModeRef.current;
        const sensitiveIncomplete =
          sensitiveMode !== "general" && isSensitiveFragmentIncomplete(taggedTranscript, sensitiveMode);
        const shouldHoldLowConf = shouldDelayLowConfidenceCommit(taggedTranscript);
        const shouldHoldContinuation = shouldHoldForContinuation(taggedTranscript);

        if (shouldHoldLowConf || sensitiveIncomplete) {
          console.log("[STT] holding low-confidence fragment before commit");
          lowConfidenceHoldRef.current = window.setTimeout(
            () => {
              lowConfidenceHoldRef.current = null;
              flushBufferedUtterance();
            },
            sensitiveIncomplete ? SENSITIVE_INCOMPLETE_HOLD_MS : LOW_CONF_HOLD_MS,
          );
        }

        const joined = buildStableTranscriptFromBuffers();
        const lowConfJoined = utteranceBufferRef.current.some((x) => isLowConfidenceTranscript(x));
        const sinceSpeechStarted = Date.now() - lastSpeechStartedAtRef.current;
        const inferredSensitiveMode = sensitiveMode === "general" ? detectContactLikeMode(joined) : sensitiveMode;
        const generalContactLike =
          inferredSensitiveMode !== "general" || (sensitiveMode === "general" && looksLikeGeneralContactInput(joined));
        let speechFinalDelay = getDynamicFlushDelay(
          joined,
          "speech_final",
          lowConfJoined || shouldHoldLowConf,
          inferredSensitiveMode,
        );

        if (sinceSpeechStarted < 600 && !isVeryShortClearAnswer(joined)) {
          speechFinalDelay = Math.min(SPEECH_FINAL_MAX_MS, speechFinalDelay + 120);
        }
        if (inferredSensitiveMode !== "general") {
          if (sensitiveIncomplete) speechFinalDelay = Math.max(speechFinalDelay, 3800);
          else speechFinalDelay = Math.max(speechFinalDelay, 1200);
        } else if (generalContactLike) {
          speechFinalDelay = Math.max(speechFinalDelay, 900);
        }

        if (utteranceDebounceRef.current) {
          window.clearTimeout(utteranceDebounceRef.current);
        }
        if (shouldHoldContinuation) {
          utteranceDebounceRef.current = window.setTimeout(
            () => {
              utteranceDebounceRef.current = null;
              const latestJoined = buildStableTranscriptFromBuffers() || joined;
              scheduleBufferedFlush(
                "debounce",
                getDynamicFlushDelay(latestJoined, "debounce", shouldHoldLowConf, inferredSensitiveMode),
              );
            },
            Math.max(420, speechFinalDelay - 150),
          );
        } else {
          scheduleBufferedFlush("speech_final", speechFinalDelay);
        }
      } catch (e) {
        console.error("[STT] parse err", e);
      }
    };

    ws.onerror = () => onError?.("Soniox STT грешка");
    ws.onclose = (ev) => {
      console.log("[STT] Closed:", ev.code, ev.reason);
      stt.isReady = false;
      // disconnect() sets stt.ws = null before closing — use that as the intentional-close signal
      if (stt.ws === null) return;
      stt.ws = null;
      if (isConnectedRef.current) {
        console.log(`[STT] Auto-reconnect after code ${ev.code}`);
        window.setTimeout(() => {
          if (isConnectedRef.current) connectSTT();
        }, 600);
      }
    };
  }, [
    buildStableTranscriptFromBuffers,
    cancelAllPendingFlushes,
    flushBufferedUtterance,
    onError,
    onTranscript,
    performEarlyBargeIn,
    scheduleBufferedFlush,
  ]);

  const handleUserUtterance = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      if (Date.now() - speakEndRef.current < ECHO_GUARD_MS) return;
      if (isPlayingRef.current && Date.now() - speakStartRef.current < ANTI_BARGE_IN_MS) return;
      if (isPlayingRef.current && !shouldAllowBargeIn(text) && !looksLikeGeneralContactInput(text)) return;

      const now = Date.now();
      const isContactDictation =
        looksLikeGeneralContactInput(text) || looksLikePossibleEmail(text) || looksLikePossiblePhone(text);
      const recent = recentUtterancesRef.current.filter((u) => now - u.ts < 2000);
      recentUtterancesRef.current = recent;
      const normalized = text.trim().toLowerCase();
      if (!isContactDictation && recent.some((u) => u.text === normalized)) return;
      if (!isContactDictation) {
        recentUtterancesRef.current.push({ text: normalized, ts: now });
      }

      clearSilenceWatchdog();
      silenceNudgeSentRef.current = false;

      if (isPlayingRef.current) {
        assistantTurnCanceledRef.current = true;
        scheduledSourcesRef.current.forEach((s) => {
          try {
            s.stop();
          } catch {}
        });
        scheduledSourcesRef.current = [];
        if (activeSourceRef.current) {
          try {
            activeSourceRef.current.stop();
          } catch {}
          activeSourceRef.current = null;
        }
        audioQueueRef.current = [];
        isProcessingQueueRef.current = false;
        isPlayingRef.current = false;
        nextPlayTimeRef.current = 0;
        updateSpeaking(false);
      }

      let sensitiveMode = expectedSensitiveInputModeRef.current;
      const rawVisibleUserText = sanitizeUserTranscriptForUi(text);
      const autoDetectedIncomingMode = detectContactLikeMode(rawVisibleUserText || text);
      if (sensitiveMode !== "general" && autoDetectedIncomingMode === "general") {
        // User answered something non-contact (e.g. package choice) while assistant had asked for contact fields too.
        sensitiveMode = "general";
      }
      let visibleUserText = rawVisibleUserText || text;
      let geminiPayloadText = text;

      // ★ Extract contact hints separately — these are metadata, not replacements
      const genericContactFields = extractContactIntentFields(text);
      const extractedFields =
        sensitiveMode !== "general" ? extractContactFields(text, sensitiveMode) : genericContactFields;
      const mergedContact =
        sensitiveMode !== "general" ||
        genericContactFields.name ||
        genericContactFields.email ||
        genericContactFields.phone
          ? mergeSensitiveContact(capturedSensitiveContactRef.current, extractedFields)
          : capturedSensitiveContactRef.current;

      // Soniox returns accurate Bulgarian text — show its transcript as-is.
      // Contact data is extracted only as Gemini payload hints below; never replaces what the user said.
      const autoDetectedContactMode = detectContactLikeMode(visibleUserText);

      if (sensitiveMode !== "general") {
        if (mergedContact) {
          capturedSensitiveContactRef.current = mergedContact;
        }

        // ★ Build Gemini payload with contact hints — raw transcript stays intact for UI
        if (sensitiveMode === "phone") {
          const phoneCandidate = mergedContact?.phone || normalizeSpokenPhone(text);
          geminiPayloadText =
            (looksLikeCompletePhone(phoneCandidate) ? "[STT_PHONE_CAPTURED]" : "[STT_PHONE_PARTIAL]") +
            ` candidate=${phoneCandidate || ""} raw="${rawVisibleUserText || text}"`;
        } else if (sensitiveMode === "email") {
          const emailCandidate = mergedContact?.email || normalizeSpokenEmail(text);
          geminiPayloadText =
            (looksLikeCompleteEmail(emailCandidate) ? "[STT_EMAIL_CAPTURED]" : "[STT_EMAIL_PARTIAL]") +
            ` candidate=${emailCandidate || ""} raw="${rawVisibleUserText || text}"`;
        } else if (sensitiveMode === "name") {
          const nameCandidate = mergedContact?.name || normalizeSensitiveName(text);
          geminiPayloadText = `[STT_NAME_CAPTURED candidate="${nameCandidate}" raw="${rawVisibleUserText || text}"]`;
        } else if (sensitiveMode === "contact") {
          const possiblePhone = mergedContact?.phone || "";
          const possibleEmail = mergedContact?.email || "";
          const possibleName = mergedContact?.name || "";
          const missing = [
            possibleName ? "" : "name",
            possibleEmail && looksLikeCompleteEmail(possibleEmail) ? "" : "email",
            possiblePhone && looksLikeCompletePhone(possiblePhone) ? "" : "phone",
          ]
            .filter(Boolean)
            .join(",");
          geminiPayloadText = [
            missing ? "[STT_CONTACT_PARTIAL]" : "[STT_CONTACT_CAPTURED]",
            possibleName ? `name="${possibleName}"` : "",
            possibleEmail ? `email=${possibleEmail}` : "",
            possiblePhone && getPhoneDigitCount(possiblePhone) >= 6 ? `phone=${possiblePhone}` : "",
            missing ? `missing=${missing}` : "",
            `raw="${rawVisibleUserText || text}"`,
          ]
            .filter(Boolean)
            .join(" ");
        }
      }

      onMessage?.({ role: "user", content: visibleUserText || text });
      onTranscript?.(visibleUserText || text, true, "user");

      console.log("[VOICE] → Gemini:", geminiPayloadText.substring(0, 120));
      currentResponseTextRef.current = "";
      // ★ New user input → NEO must respond — clear any lingering barge-in cancel flag
      assistantTurnCanceledRef.current = false;

      // Hint Gemini to fix garbled STT for emails/phones/names — 0 extra latency, same WS
      const lc = geminiPayloadText.toLowerCase();

      // Detect likely contact info (email, phone, spelled-out characters)
      const maybeContact =
        /(@|маймунско|маймунка|кльомба|клумба|кломба|точка|дот|гмейл|абв|gmail|abv|yahoo|hotmail|outlook|мейл|поща)/i.test(
          lc,
        ) || /([\d]{3,}|плюс\s*\d|\+\d|нула\s|осем\s|девет\s|седем\s)/.test(text);
      const autoPhoneCandidate = normalizeSpokenPhone(rawVisibleUserText || text);
      const autoEmailCandidate = normalizeSpokenEmail(rawVisibleUserText || text);

      // Detect garbled/nonsensical text — too many repeated syllables, very short words, gibberish
      const words = text.split(/\s+/);
      const avgWordLen = words.reduce((s, w) => s + w.length, 0) / (words.length || 1);
      const hasRepeatedPattern = /(.{2,})\1{3,}/i.test(text); // "бобобобобо..."
      const tooManyShortWords = words.length >= 4 && avgWordLen < 2.5;
      const likelyGarbled = hasRepeatedPattern || tooManyShortWords;

      const todayCtx = getTodayContextText();

      const lowConf = isLowConfidenceTranscript(text);
      const cleanText = stripLowConfidenceTag(geminiPayloadText).replace(/\s+/g, " ").trim();
      const rawTextForGemini = stripLowConfidenceTag(text).replace(/\s+/g, " ").trim();

      if (sensitiveMode === "phone") {
        const phoneCandidate = mergedContact?.phone || normalizeSpokenPhone(visibleUserText);
        if (looksLikeCompletePhone(phoneCandidate)) {
          sendToGemini(
            `${todayCtx}\n[STT_PHONE_CAPTURED — кажи номера цифра по цифра и поискай потвърждение]: ${phoneCandidate}`,
          );
          expectedSensitiveInputModeRef.current = "general";
        } else {
          sendToGemini(
            `${todayCtx}\n[STT_PHONE_PARTIAL — повтори какво си чул и поискай само липсващите цифри]: ${phoneCandidate || cleanText}`,
          );
        }
      } else if (sensitiveMode === "email") {
        const emailCandidate = mergedContact?.email || normalizeSpokenEmail(visibleUserText);
        if (looksLikeCompleteEmail(emailCandidate)) {
          sendToGemini(
            `${todayCtx}\n[STT_EMAIL_CAPTURED — изпиши имейла точно и поискай потвърждение]: ${emailCandidate}`,
          );
          expectedSensitiveInputModeRef.current = "general";
        } else {
          sendToGemini(
            `${todayCtx}\n[STT_EMAIL_PARTIAL — изпиши точно какво си чул и поискай само липсващата част на имейла]: ${emailCandidate || cleanText}`,
          );
        }
      } else if (sensitiveMode === "name" && looksLikeSensitiveName(visibleUserText)) {
        sendToGemini(
          `${todayCtx}\n[STT_NAME_CAPTURED — повтори името точно и поискай потвърждение]: ${normalizeSensitiveName(visibleUserText)}`,
        );
        expectedSensitiveInputModeRef.current = "general";
      } else if (sensitiveMode === "contact") {
        const missing = [
          mergedContact?.name ? "" : "име",
          mergedContact?.email && looksLikeCompleteEmail(mergedContact.email) ? "" : "имейл",
          mergedContact?.phone && looksLikeCompletePhone(mergedContact.phone) ? "" : "телефон",
        ]
          .filter(Boolean)
          .join(", ");
        const payload = [
          mergedContact?.name ? `име: ${mergedContact.name}` : "",
          mergedContact?.email ? `имейл: ${mergedContact.email}` : "",
          mergedContact?.phone ? `телефон: ${mergedContact.phone}` : "",
        ]
          .filter(Boolean)
          .join(" | ");
        if (
          mergedContact?.name &&
          mergedContact?.email &&
          looksLikeCompleteEmail(mergedContact.email) &&
          mergedContact?.phone &&
          looksLikeCompletePhone(mergedContact.phone)
        ) {
          sendToGemini(
            `${todayCtx}\n[STT_CONTACT_CAPTURED — повтори точно име, имейл и телефон поотделно и поискай потвърждение, без да измисляш липсващи части]: ${payload}`,
          );
          expectedSensitiveInputModeRef.current = "general";
        } else {
          sendToGemini(
            `${todayCtx}\n[STT_CONTACT_PARTIAL — повтори само това, което вече е чуто, и поискай само липсващото: ${missing || "данни"}]: ${payload || cleanText}`,
          );
        }
      } else if (likelyGarbled) {
        sendToGemini(`${todayCtx}\n[STT_GARBLED — помоли клиента да повтори или напише в чата]: ${cleanText}`);
      } else if (lowConf && maybeContact) {
        sendToGemini(
          `${todayCtx}\n[STT_LOW_CONF + контактна информация — задължително изпиши и потвърди с клиента поправената версия]: ${cleanText}`,
        );
      } else if (lowConf) {
        sendToGemini(`${todayCtx}\n[STT_LOW_CONF — ако нещо звучи нелогично, помоли за потвърждение]: ${cleanText}`);
      } else if (maybeContact) {
        const parsedHints = [
          looksLikeCompleteEmail(autoEmailCandidate) ? `email=${autoEmailCandidate}` : "",
          getPhoneDigitCount(autoPhoneCandidate) >= 8 ? `phone=${autoPhoneCandidate}` : "",
        ]
          .filter(Boolean)
          .join(" ");
        sendToGemini(
          `${todayCtx}\n[STT_CONTACT — поправи имейл/телефон ако са изкривени, изпиши ги обратно на клиента за потвърждение${parsedHints ? `; parsed: ${parsedHints}` : ""}]: ${cleanText}`,
        );
      } else {
        sendToGemini(`${todayCtx}\n${cleanText}`);
      }
    },
    [clearSilenceWatchdog, updateSpeaking, onMessage, onTranscript, sendToGemini],
  );

  useEffect(() => {
    handleUtteranceRef.current = handleUserUtterance;
  }, [handleUserUtterance]);

  const tryAutoRunReservationCheck = useCallback(async () => {
    try {
      const sessionId = (sessionDataRef.current as any)?.sessionId || (sessionDataRef.current as any)?.session_id || "";

      const reservation = ((window as any).__neoReservationState || {}) as any;

      const checkIn = String(reservation?.check_in || reservation?.checkIn || "").trim();
      const checkOut = String(reservation?.check_out || reservation?.checkOut || "").trim();
      const guestsRaw = String(reservation?.guests || "").trim();
      // ✅ Do NOT default to "2" — only use guests if client explicitly said so
      // Worker defaults to 2 internally when not provided
      const guests = guestsRaw || "1";
      const rooms = String(reservation?.rooms || "1").trim() || "1";

      if (!sessionId || !checkIn || !checkOut) {
        console.log("[AUTO RES CHECK] missing prerequisites", {
          sessionId: !!sessionId,
          checkIn,
          checkOut,
          guests,
          rooms,
          reservation,
        });
        return false;
      }

      const dedupeKey = `${sessionId}::${checkIn}::${checkOut}::${guests}::${rooms}`;

      if (reservationCheckInFlightRef.current) {
        console.log("[AUTO RES CHECK] skipped in-flight request", dedupeKey);
        return true;
      }

      if (autoReservationCheckKeyRef.current === dedupeKey) {
        console.log("[AUTO RES CHECK] skipped duplicate", dedupeKey);
        return true;
      }

      if (autoReservationCheckDoneKeyRef.current === dedupeKey) {
        console.log("[AUTO RES CHECK] skipped already completed", dedupeKey);
        return true;
      }

      reservationCheckInFlightRef.current = true;
      autoReservationCheckKeyRef.current = dedupeKey;

      const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || "";
      const PROXY_BASE = "https://onufuxczpqlxxkgyltlz.supabase.co/functions/v1/neo-worker-proxy";

      const _checkPhrases = [
        "Един момент, проверявам наличността.",
        "Момент само, проверявам свободните стаи.",
        "Изчакайте, веднага проверявам за вас.",
        "Веднага проверявам наличността за вас.",
      ];
      const _checkPhrase = _checkPhrases[Math.floor(Math.random() * _checkPhrases.length)];
      // ✅ ВАЖНО: НЕ изпращай през sendToGemini — Gemini ще отговори с нов action JSON (безкраен цикъл)
      // Показваме само в чата като assistant съобщение
      onMessage?.({ role: "assistant", content: _checkPhrase });
      onTranscript?.(_checkPhrase, true, "assistant");

      const payload = {
        type: "action_request",
        action: "make_reservation",
        session_id: sessionId,
        phase: "check",
        check_in: checkIn,
        check_out: checkOut,
        guests,
        rooms,
      };

      console.log("[AUTO RES CHECK] POST", payload);
      console.log("[AUTO RES CHECK] sessionDataRef", sessionDataRef.current);

      const res = await fetch(`${PROXY_BASE}/make-reservation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify(payload),
      });

      const rawText = await res.text().catch(() => "");
      console.log("[AUTO RES CHECK] HTTP", res.status, rawText.slice(0, 1500));

      let result: any = {};
      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        result = { raw_text: rawText };
      }

      if (!res.ok || result?.success === false) {
        autoReservationCheckKeyRef.current = "";
        sendToGemini(
          [
            "RESERVATION_PROXY_FAILED:",
            "phase=check",
            `http_status=${res.status}`,
            `error=${String(result?.error || result?.message || rawText || "unknown_error").slice(0, 300)}`,
            "",
            "Кажи на клиента учтиво, че в момента не успяхме да проверим наличността. Предложи нов опит.",
          ].join("\n"),
        );
        return true;
      }

      const avail = result?.availability_result;
      const available = avail?.available;
      const roomsList = Array.isArray(avail?.rooms) ? avail.rooms : [];
      const rawSummary = String(avail?.raw_summary || "");

      if (!avail) {
        autoReservationCheckKeyRef.current = "";
        sendToGemini(
          [
            "RESERVATION_PROXY_FAILED:",
            "phase=check",
            `stage=${String(result?.stage || "missing_availability_result")}`,
            `error=${String(result?.error || result?.message || "availability_result missing")}`,
            "",
            "Кажи на клиента учтиво, че не успяхме да извлечем резултата от системата за резервации. Предложи нов опит.",
          ].join("\n"),
        );
        return true;
      }

      if (available === false || roomsList.length === 0) {
        sendToGemini(
          [
            "RESERVATION_CHECK_RESULT:",
            `phase=check check_in=${checkIn} check_out=${checkOut} guests=${guests}`,
            "",
            "НАЛИЧНОСТ: Няма свободни стаи за избрания период.",
            rawSummary ? `Обобщение: ${rawSummary}` : "",
            "",
            "Кажи на клиента учтиво, че за тези дати няма свободни стаи. Предложи алтернативен период или други дати.",
          ]
            .filter(Boolean)
            .join("\n"),
        );
        return true;
      }

      try {
        const state = ((window as any).__neoReservationState || {}) as any;
        (window as any).__neoReservationState = {
          ...state,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          rooms,
          available_rooms: roomsList.map((r: any, index: number) => ({
            index,
            name: String(r?.name || "").trim(),
            total_price: r?.total_price ?? null,
            price_per_night: r?.price_per_night ?? null,
            currency: r?.currency || "BGN",
            max_guests: r?.max_guests ?? null,
            meal_plan: r?.meal_plan || null,
          })),
        };
      } catch {}

      const prettyRooms = roomsList
        .slice(0, 8)
        .map((r: any, idx: number) => {
          const price = r.total_price
            ? `${r.total_price} ${r.currency || "BGN"} общо`
            : r.price_per_night
              ? `${r.price_per_night} ${r.currency || "BGN"}/нощ`
              : "цена по договаряне";

          return `${idx + 1}. ${r.name || "Стая"}: ${price}${r.max_guests ? `, макс. ${r.max_guests} гости` : ""}${r.meal_plan ? `, ${r.meal_plan}` : ""}`;
        })
        .join("\n");

      autoReservationCheckDoneKeyRef.current = dedupeKey;

      sendToGemini(
        [
          "RESERVATION_CHECK_RESULT:",
          `phase=check check_in=${checkIn} check_out=${checkOut} guests=${guests} nights=${avail?.nights || "?"}`,
          "",
          "НАЛИЧНИ СТАИ И ЦЕНИ:",
          prettyRooms,
          rawSummary ? `\nОбобщение: ${rawSummary}` : "",
          "",
          "⚠️ НЕ питай отново за дати или брой гости — вече са известни и проверени.",
          "Представи наличните стаи и цени на клиента естествено и кратко. После попитай кой вариант избира.",
        ]
          .filter(Boolean)
          .join("\n"),
      );

      return true;
    } catch (e) {
      autoReservationCheckKeyRef.current = "";
      autoReservationCheckDoneKeyRef.current = "";
      console.error("[AUTO RES CHECK] failed:", e);
      return false;
    } finally {
      reservationCheckInFlightRef.current = false;
    }
  }, [onMessage, onTranscript, sendToGemini]);

  const processAudioQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || audioQueueRef.current.length === 0 || !audioContextRef.current) return;
    isProcessingQueueRef.current = true;
    isPlayingRef.current = true;
    updateSpeaking(true);
    updateListening(false);

    const ctx = audioContextRef.current;
    if (!gainRef.current) {
      gainRef.current = ctx.createGain();
      gainRef.current.gain.value = 1.3;
      gainRef.current.connect(ctx.destination);
    }
    if (nextPlayTimeRef.current < ctx.currentTime) nextPlayTimeRef.current = ctx.currentTime + 0.005;

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();
      if (!audioData) continue;
      const buffer = ctx.createBuffer(1, audioData.length, AUDIO_SAMPLE_RATE_OUT);
      buffer.getChannelData(0).set(audioData);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = 1.0;
      activeSourceRef.current = source;
      source.connect(gainRef.current!);
      source.start(nextPlayTimeRef.current);
      scheduledSourcesRef.current.push(source);
      nextPlayTimeRef.current += buffer.duration / 1.0;

      source.onended = () => {
        const idx = scheduledSourcesRef.current.indexOf(source);
        if (idx > -1) scheduledSourcesRef.current.splice(idx, 1);
        if (scheduledSourcesRef.current.length === 0 && audioQueueRef.current.length === 0) {
          isPlayingRef.current = false;
          updateSpeaking(false);
          updateListening(true);
          startSilenceWatchdog();
        }
      };
    }
    isProcessingQueueRef.current = false;
  }, [updateSpeaking, updateListening, startSilenceWatchdog]);

  const playAudioChunk = useCallback(
    (base64Audio: string) => {
      if (!audioContextRef.current) return;
      try {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) float32Array[i] = int16Array[i] / 32768;
        audioQueueRef.current.push(float32Array);
        processAudioQueue();
      } catch {}
    },
    [processAudioQueue],
  );

  const startAudioCapture = useCallback(() => {
    if (!streamRef.current || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const track = streamRef.current.getAudioTracks()[0];
    if (!track) return;
    track.enabled = true;

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }
    if (ctx.state === "suspended") ctx.resume();

    actualSampleRateRef.current = ctx.sampleRate;
    const source = ctx.createMediaStreamSource(new MediaStream([track]));
    sourceRef.current = source;

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 140;
    inputFilterRef.current = highpass;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.2;
    inputCompressorRef.current = compressor;

    const inputGain = ctx.createGain();
    inputGain.gain.value = 1.28;
    inputGainNodeRef.current = inputGain;

    const processor = ctx.createScriptProcessor(2048, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (Date.now() - speakEndRef.current < ECHO_GUARD_MS) return;

      const stt = dgSTTRef.current;
      if (!stt.ws || stt.ws.readyState !== WebSocket.OPEN || !stt.isReady) return;

      const inputData = e.inputBuffer?.getChannelData(0);
      if (!inputData) return;

      let peak = 0;
      let sum = 0;

      for (let i = 0; i < inputData.length; i++) {
        const abs = Math.abs(inputData[i]);
        if (abs > peak) peak = abs;
        sum += inputData[i] * inputData[i];
      }

      const rms = Math.sqrt(sum / inputData.length);
      const crest = rms > 0 ? peak / rms : 999;

      if (inputGainNodeRef.current) {
        if (rms < 0.012) inputGainNodeRef.current.gain.value = 1.2;
        else if (rms < 0.022) inputGainNodeRef.current.gain.value = 1.1;
        else if (peak > 0.92) inputGainNodeRef.current.gain.value = 0.92;
        else inputGainNodeRef.current.gain.value = 1.0;
      }

      // ignore obvious keyboard / click transients
      if (
        !vadIsSpeakingRef.current &&
        rms < TRANSIENT_CLICK_RMS_MAX &&
        peak > TRANSIENT_CLICK_PEAK_MIN &&
        crest > TRANSIENT_CLICK_CREST_MIN
      ) {
        return;
      }

      // hard reject tiny noisy chunks that are not stable speech
      if (
        !vadIsSpeakingRef.current &&
        (rms < NOISE_GATE_FLOOR || (peak < 0.05 && rms < 0.0105) || (crest > 12 && rms < 0.012))
      ) {
        return;
      }

      try {
        stt.ws.send(float32ToInt16Buffer(resampleTo16k(inputData, actualSampleRateRef.current)));
      } catch {}
    };

    // ── Client-side VAD (Voice Activity Detection) ──────────────
    // AnalyserNode measures real microphone volume.
    // When silence > VAD_SILENCE_MS after speech → flush utterance buffer.
    // This replaces fixed-ms endpointing: works for any utterance length.
    if (vadRafRef.current) clearInterval(vadRafRef.current);
    if (vadTimerRef.current) {
      clearTimeout(vadTimerRef.current);
      vadTimerRef.current = null;
    }

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.6;
    analyserRef.current = analyser;

    source.connect(highpass);
    highpass.connect(compressor);
    compressor.connect(inputGain);
    inputGain.connect(analyser);
    inputGain.connect(processor);

    const vadData = new Float32Array(analyser.fftSize);
    const vadProfileStart = performance.now();
    let vadProfileSamples = 0;
    let vadProfileAccum = 0;

    const checkVAD = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getFloatTimeDomainData(vadData);

      let sum = 0;
      for (let i = 0; i < vadData.length; i++) sum += vadData[i] * vadData[i];
      const rms = Math.sqrt(sum / vadData.length);

      if (performance.now() - vadProfileStart < VAD_NOISE_PROFILE_MS) {
        vadProfileAccum += rms;
        vadProfileSamples += 1;

        const avgNoise = vadProfileAccum / Math.max(vadProfileSamples, 1);
        vadNoiseFloorRef.current = avgNoise;

        vadThresholdRef.current = Math.min(
          VAD_MAX_SPEECH_THRESHOLD,
          Math.max(VAD_MIN_SPEECH_THRESHOLD, avgNoise * VAD_THRESHOLD_MULTIPLIER),
        );
      }

      const isSpeaking = rms > vadThresholdRef.current && rms > NOISE_GATE_FLOOR;

      if (isSpeaking) {
        vadSpeechFramesRef.current += 1;
        if (vadSpeechFramesRef.current >= VAD_SPEECH_FRAMES_REQUIRED) {
          if (!vadIsSpeakingRef.current) {
            vadIsSpeakingRef.current = true;
            console.log("[VAD] 🎙 speech started", {
              rms,
              threshold: vadThresholdRef.current,
              noiseFloor: vadNoiseFloorRef.current,
            });
          }

          if (vadTimerRef.current) {
            clearTimeout(vadTimerRef.current);
            vadTimerRef.current = null;
          }
        }

        if (isPlayingRef.current && Date.now() - speakStartRef.current > ANTI_BARGE_IN_MS) {
          const transcriptPreview = [finalChunksRef.current.join(" "), lastInterimTranscriptRef.current]
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          const loudEnough = rms > Math.max(vadThresholdRef.current * 1.6, NOISE_GATE_FLOOR * 2);
          const hasSpeechEvidence = shouldAllowBargeIn(transcriptPreview);
          vadBargeInFramesRef.current += 1;
          if (hasSpeechEvidence && loudEnough && vadBargeInFramesRef.current >= VAD_BARGE_IN_FRAMES_REQUIRED) {
            console.log("[VAD BARGE-IN] ⚡ Confirmed speech detected → interrupt", { rms, frames: vadBargeInFramesRef.current });
            performEarlyBargeIn();
            vadBargeInFramesRef.current = 0;
          }
        } else {
          vadBargeInFramesRef.current = 0;
        }
      } else {
        vadSpeechFramesRef.current = 0;
        vadBargeInFramesRef.current = 0;
        if (vadIsSpeakingRef.current && !vadTimerRef.current) {
          vadTimerRef.current = window.setTimeout(() => {
            vadTimerRef.current = null;
            vadIsSpeakingRef.current = false;
            console.log("[VAD] 🔇 silence detected → flush utterance", {
              threshold: vadThresholdRef.current,
            });

            flushBufferedUtterance();
          }, VAD_SILENCE_MS);
        }
      }
    };
    // setInterval fires reliably at 20 ms (50 fps) regardless of tab visibility
    // or display refresh rate — much more stable than requestAnimationFrame.
    vadRafRef.current = window.setInterval(checkVAD, 20) as unknown as number;
    // ─────────────────────────────────────────────────────────────

    const silentSink = ctx.createGain();
    silentSink.gain.value = 0;
    processorSinkRef.current = silentSink;
    processor.connect(silentSink);
    silentSink.connect(ctx.destination);
    updateListening(true);
    console.log("[MIC] ✅ Capturing (always-on, VAD active)");
  }, [flushBufferedUtterance, updateListening, performEarlyBargeIn, buildStableTranscriptFromBuffers]);

  // ★ NEW: hard reset prepared session when context key changes
  const resetPreparedSession = useCallback(() => {
    sessionDataRef.current = null;
    preparedKeyRef.current = "";
    isPreparedRef.current = false;
    setIsPrepared(false);
    lastSubmitFormTargetRef.current = null;
    greetingSentRef.current = false;
    currentResponseTextRef.current = "";
  }, []);

  const prepareSession = useCallback(
    async (systemPrompt: string, companyName: string, sessionId?: string) => {
      const key = `${sessionId || ""}::${companyName || ""}::${hash32(systemPrompt || "")}`;

      if (isPreparingRef.current) return;
      if (isPreparedRef.current && sessionDataRef.current && preparedKeyRef.current === key) return;

      if (preparedKeyRef.current && preparedKeyRef.current !== key) {
        console.log("[SESSION] 🔄 Context changed → reset prepared session");
        resetPreparedSession();
      }

      isPreparingRef.current = true;
      setIsPreparing(true);
      companyNameRef.current = companyName;

      try {
        const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || "";
        const response = await fetch("https://onufuxczpqlxxkgyltlz.supabase.co/functions/v1/gemini-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            systemPrompt,
            companyName,
            sessionId,
          }),
        });

        if (!response.ok) throw new Error("Session prep failed");
        const data = await response.json();
        if (!data?.success) throw new Error(data?.error || "Session failed");

        sessionDataRef.current = {
          apiKey: data.apiKey,
          model: data.model,
          systemInstruction: clampInstruction(data.systemInstruction || "", MAX_SYSTEM_INSTRUCTION_CHARS),

          // always keep a usable session id even if edge does not echo it back
          sessionId: data.sessionId || data.session_id || sessionId || "",
          session_id: data.session_id || data.sessionId || sessionId || "",

          // keep schemas if present, but do NOT depend on them for auto reservation check
          ...(data.formSchemas ? { formSchemas: data.formSchemas } : {}),
          ...(data.form_schemas ? { form_schemas: data.form_schemas } : {}),
        } as any;

        const inferredSubmitTarget = pickPreferredSubmitFormTarget(
          extractSubmitFormTargetsFromInstruction(sessionDataRef.current.systemInstruction || ""),
        );
        lastSubmitFormTargetRef.current = inferredSubmitTarget;
        if (inferredSubmitTarget?.form_id || inferredSubmitTarget?.fingerprint) {
          console.log("[SESSION] submit form target inferred:", inferredSubmitTarget);
        }

        preparedKeyRef.current = key;

        console.log(
          "[SESSION] ✅ Ready, model:",
          data.model,
          "| instruction:",
          sessionDataRef.current.systemInstruction.length,
          "chars | key:",
          key,
        );
        isPreparedRef.current = true;
        setIsPrepared(true);
      } catch (e) {
        onError?.(e instanceof Error ? e.message : "Prepare failed");
      } finally {
        isPreparingRef.current = false;
        setIsPreparing(false);
      }
    },
    [onError, resetPreparedSession],
  );

  const preWarmMicrophone = useCallback(async () => {
    if (streamRef.current) return;
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {}
  }, []);

  const disconnect = useCallback(() => {
    clearSilenceWatchdog();
    silenceNudgeSentRef.current = false;
    silenceNudgeCountRef.current = 0;
    flushInterruptedAssistantTurn();

    if (dgKeepAliveRef.current) {
      clearInterval(dgKeepAliveRef.current);
      dgKeepAliveRef.current = null;
    }
    if (sttFlushTimerRef.current) {
      clearTimeout(sttFlushTimerRef.current);
      sttFlushTimerRef.current = null;
    }
    if (lowConfidenceHoldRef.current) {
      clearTimeout(lowConfidenceHoldRef.current);
      lowConfidenceHoldRef.current = null;
    }
    if (pendingSensitiveCommitTimerRef.current) {
      clearTimeout(pendingSensitiveCommitTimerRef.current);
      pendingSensitiveCommitTimerRef.current = null;
    }

    const stt = dgSTTRef.current;
    if (stt.ws) {
      try {
        stt.ws.close();
      } catch {}
      stt.ws = null;
    }
    stt.isReady = false;

    connectMutexRef.current = false;
    greetingSentRef.current = false;

    isPreparedRef.current = false;
    setIsPrepared(false);
    lastSubmitFormTargetRef.current = null;

    // Cleanup VAD
    if (vadRafRef.current) {
      clearInterval(vadRafRef.current);
      vadRafRef.current = null;
    }
    if (vadTimerRef.current) {
      clearTimeout(vadTimerRef.current);
      vadTimerRef.current = null;
    }
    vadIsSpeakingRef.current = false;
    vadSpeechFramesRef.current = 0;
    analyserRef.current = null;
    expectedSensitiveInputModeRef.current = "general";
    pendingSensitiveCaptureRef.current = null;
    capturedSensitiveContactRef.current = null;
    assistantTurnCanceledRef.current = false;
    utteranceBufferRef.current = [];
    finalChunksRef.current = [];
    firstFinalChunkTsRef.current = 0;
    lastFinalChunkTsRef.current = 0;

    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (gainRef.current) {
      try {
        gainRef.current.disconnect();
      } catch {}
      gainRef.current = null;
    }
    if (inputGainNodeRef.current) {
      try {
        inputGainNodeRef.current.disconnect();
      } catch {}
      inputGainNodeRef.current = null;
    }
    if (inputCompressorRef.current) {
      try {
        inputCompressorRef.current.disconnect();
      } catch {}
      inputCompressorRef.current = null;
    }
    if (inputFilterRef.current) {
      try {
        inputFilterRef.current.disconnect();
      } catch {}
      inputFilterRef.current = null;
    }
    if (processorSinkRef.current) {
      try {
        processorSinkRef.current.disconnect();
      } catch {}
      processorSinkRef.current = null;
    }
    scheduledSourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {}
    });
    scheduledSourcesRef.current = [];
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch {}
      activeSourceRef.current = null;
    }
    audioQueueRef.current = [];
    isProcessingQueueRef.current = false;
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;

    isConnectedRef.current = false;
    isConnectingRef.current = false;
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setIsListening(false);
  }, [clearSilenceWatchdog]);

  // ✅ FE → Edge proxy (no secrets in FE)
  const maybeExecuteActionFromGemini = useCallback(
    async (text: string) => {
      const trimmed = text.trim();

      console.log("[ACTION PARSER] raw preview:", trimmed.slice(0, 1200));

      const directJson = trimmed.startsWith("{")
        ? trimmed
        : trimmed.match(/\{[\s\S]*"type"\s*:\s*"action_request"[\s\S]*\}/)?.[0] || "";

      console.log("[ACTION PARSER] directJson preview:", directJson ? directJson.slice(0, 1200) : "<none>");

      if (!directJson) {
        return false;
      }

      const extractMissingRequired = (obj: any): string[] => {
        const out: string[] = [];
        const seen = new Set<string>();

        const pushArr = (arr: any) => {
          if (!Array.isArray(arr)) return;
          for (const v of arr) {
            const s = String(v || "").trim();
            if (!s) continue;
            const k = s.toLowerCase();
            if (seen.has(k)) continue;
            seen.add(k);
            out.push(s);
          }
        };

        const walk = (node: any) => {
          if (!node || typeof node !== "object") return;
          if (Array.isArray(node)) {
            for (const it of node) walk(it);
            return;
          }
          if ("missing_required" in node) pushArr((node as any).missing_required);
          for (const k of Object.keys(node)) walk((node as any)[k]);
        };

        walk(obj);
        return out.slice(0, 20);
      };

      try {
        const parsed = JSON.parse(directJson);

        console.log("[ACTION PARSER] parsed:", parsed?.type, parsed?.action, parsed?.phase, parsed?.session_id);

        if (parsed?.type !== "action_request") return false;

        const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || "";
        if (!anonKey) {
          onError?.("Липсва VITE_SUPABASE_PUBLISHABLE_KEY");
          return true;
        }

        const PROXY_BASE = "https://onufuxczpqlxxkgyltlz.supabase.co/functions/v1/neo-worker-proxy";

        // ── MAKE RESERVATION (нов workflow) ─────────────────────────
        if (parsed?.action === "make_reservation") {
          const phase = String(parsed?.phase || "check");
          const proxyUrl = `${PROXY_BASE}/make-reservation`;

          // ✅ IN-FLIGHT GUARD: само 1 reserve заявка в даден момент — предотвратява безкраен цикъл
          const _reserveInFlightKey = "__neoReserveInFlight";
          if (phase === "reserve" && (window as any)[_reserveInFlightKey]) {
            console.warn("[ACTION][RESERVATION] reserve already in-flight — skip duplicate");
            return true;
          }
          if (phase === "reserve") (window as any)[_reserveInFlightKey] = true;

          try {
            const state = ((window as any).__neoReservationState || {}) as any;

            if (phase === "reserve") {
              const resolvedRoomType = resolveRoomTypeFromState(
                String(parsed?.room_type || parsed?.fields?.room_type || ""),
                state,
              );

              if (resolvedRoomType) {
                parsed.room_type = resolvedRoomType;
                parsed.fields = {
                  ...(parsed.fields || {}),
                  room_type: resolvedRoomType,
                };
              }

              if (!parsed.check_in && state?.check_in) parsed.check_in = state.check_in;
              if (!parsed.check_out && state?.check_out) parsed.check_out = state.check_out;
              if (!parsed.guests && state?.guests) parsed.guests = state.guests;
              if (!parsed.rooms && state?.rooms) parsed.rooms = state.rooms || "1";

              // Restore guest data from state if not in current JSON
              if (!parsed.guest_name && state?.guest_name) parsed.guest_name = state.guest_name;
              if (!parsed.guest_email && state?.guest_email) parsed.guest_email = state.guest_email;
              if (!parsed.guest_phone && state?.guest_phone) parsed.guest_phone = state.guest_phone;
              if (!parsed.guest_egn && state?.guest_egn) parsed.guest_egn = state.guest_egn;
              if (!parsed.guest_birthdate && state?.guest_birthdate) parsed.guest_birthdate = state.guest_birthdate;
              if (!parsed.guest_gender && state?.guest_gender) parsed.guest_gender = state.guest_gender;
              if (!parsed.guest_country && state?.guest_country) parsed.guest_country = state.guest_country;
              if (!parsed.guest_doc_type && state?.guest_doc_type) parsed.guest_doc_type = state.guest_doc_type;
              if (!parsed.guest_doc_number && state?.guest_doc_number) parsed.guest_doc_number = state.guest_doc_number;

              // Save any new guest data to state
              const _stateUpdate: any = { ...state };
              if (parsed.guest_name) _stateUpdate.guest_name = parsed.guest_name;
              if (parsed.guest_email) _stateUpdate.guest_email = parsed.guest_email;
              if (parsed.guest_phone) _stateUpdate.guest_phone = parsed.guest_phone;
              if (parsed.guest_egn) _stateUpdate.guest_egn = parsed.guest_egn;
              if (parsed.guest_birthdate) _stateUpdate.guest_birthdate = parsed.guest_birthdate;
              if (parsed.guest_gender) _stateUpdate.guest_gender = parsed.guest_gender;
              if (parsed.guest_country) _stateUpdate.guest_country = parsed.guest_country;
              if (parsed.guest_doc_type) _stateUpdate.guest_doc_type = parsed.guest_doc_type;
              if (parsed.guest_doc_number) _stateUpdate.guest_doc_number = parsed.guest_doc_number;
              try {
                (window as any).__neoReservationState = _stateUpdate;
              } catch {}
            }
          } catch (e) {
            console.warn("[ACTION][RESERVATION] room_type resolve failed:", e);
          }

          console.log(`[ACTION][RESERVATION] phase=${phase} →`, parsed);

          // ── Показваме изчакващо съобщение в чата ──
          // ✅ КРИТИЧНО: НЕ използвай sendToGemini тук!
          // sendToGemini кара Gemini да отговори с нов action JSON → безкраен цикъл
          if (phase === "reserve") {
            const _waitPhrases = [
              "Обработвам заявката, един момент.",
              "Записвам избора ви, изчакайте.",
              "Проверявам в системата, един момент.",
              "Веднага проверявам за вас.",
            ];
            const _wp = _waitPhrases[Math.floor(Math.random() * _waitPhrases.length)];
            // Само в чата — НЕ към Gemini
            onMessage?.({ role: "assistant", content: _wp });
            onTranscript?.(_wp, true, "assistant");
          }

          let result: any = {};
          let rawErrorText = "";

          try {
            console.log("[ACTION][RESERVATION] POST", proxyUrl, parsed);

            const res = await fetch(proxyUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: anonKey,
                Authorization: `Bearer ${anonKey}`,
              },
              body: JSON.stringify({
                ...parsed,
                // Always inject session_id from the live session — Gemini may omit it
                session_id:
                  parsed.session_id ||
                  (sessionDataRef.current as any)?.sessionId ||
                  (sessionDataRef.current as any)?.session_id ||
                  "",
                // Extra guest fields from state (belt-and-suspenders)
                ...(() => {
                  try {
                    const _s = ((window as any).__neoReservationState || {}) as any;
                    return {
                      guest_egn: parsed.guest_egn || _s.guest_egn || undefined,
                      guest_birthdate: parsed.guest_birthdate || _s.guest_birthdate || undefined,
                      guest_gender: parsed.guest_gender || _s.guest_gender || undefined,
                      guest_country: parsed.guest_country || _s.guest_country || undefined,
                      guest_doc_type: parsed.guest_doc_type || _s.guest_doc_type || undefined,
                      guest_doc_number: parsed.guest_doc_number || _s.guest_doc_number || undefined,
                    };
                  } catch {
                    return {};
                  }
                })(),
              }),
            });

            if (!res.ok) {
              rawErrorText = await res.text().catch(() => "");
              console.error(`[RESERVATION HTTP ERROR] status=${res.status} body=${rawErrorText.slice(0, 500)}`);

              sendToGemini(
                [
                  "RESERVATION_PROXY_FAILED:",
                  `phase=${phase}`,
                  `http_status=${res.status}`,
                  rawErrorText ? `raw_error=${rawErrorText.slice(0, 300)}` : "",
                  "",
                  "Кажи на клиента учтиво, че в момента не успяхме да проверим наличността заради технически проблем. Предложи да опитаме отново след малко.",
                ]
                  .filter(Boolean)
                  .join("\n"),
              );

              return true;
            }

            const rawText = await res.text().catch(() => "");
            console.log("[ACTION][RESERVATION] HTTP", res.status, rawText.slice(0, 1500));

            try {
              result = rawText ? JSON.parse(rawText) : {};
            } catch {
              result = { raw_text: rawText };
            }

            console.log("[RESERVATION RESULT]:", result);
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error("[RESERVATION FETCH FAILED]:", msg, e);

            sendToGemini(
              [
                "RESERVATION_PROXY_FAILED:",
                `phase=${phase}`,
                `error=${msg}`,
                "",
                "Кажи на клиента учтиво, че в момента не успяхме да проверим наличността заради технически проблем. Предложи да опитаме отново след малко.",
              ].join("\n"),
            );

            return true;
          }

          if (result?.success === false) {
            sendToGemini(
              [
                "RESERVATION_PROXY_FAILED:",
                `phase=${phase}`,
                `stage=${String(result?.stage || "")}`,
                `error=${String(result?.error || result?.message || "unknown_error")}`,
                "",
                "Кажи на клиента учтиво, че в момента не успяхме да довършим проверката на наличността. Предложи да опитаме отново.",
              ].join("\n"),
            );

            return true;
          }

          if (phase === "check") {
            const avail = result?.availability_result;
            const available = avail?.available;
            const rooms = Array.isArray(avail?.rooms) ? avail.rooms : [];
            const rawSummary = String(avail?.raw_summary || "");
            const stage = String(result?.stage || "");

            if (!avail || stage === "reservation_no_screenshot") {
              sendToGemini(
                [
                  "RESERVATION_PROXY_FAILED:",
                  "phase=check",
                  `stage=${stage || "missing_availability_result"}`,
                  `error=${String(result?.error || result?.message || "No structured availability result")}`,
                  "",
                  "Кажи на клиента учтиво, че не успяхме да извлечем резултата от системата за резервации. Предложи да опитаме отново.",
                ].join("\n"),
              );

              return true;
            }

            if (available === false || rooms.length === 0) {
              try {
                const state = ((window as any).__neoReservationState || {}) as any;
                (window as any).__neoReservationState = {
                  ...state,
                  available_rooms: [],
                };
              } catch {}

              sendToGemini(
                [
                  "RESERVATION_CHECK_RESULT:",
                  `phase=check check_in=${parsed.check_in} check_out=${parsed.check_out} guests=${parsed.guests}`,
                  "",
                  "НАЛИЧНОСТ: Няма свободни стаи за избрания период.",
                  rawSummary ? `Обобщение: ${rawSummary}` : "",
                  "",
                  "Кажи на клиента учтиво, че за тези дати няма свободни стаи. Предложи алтернативен период или питай дали може да ти помогнеш с нещо друго.",
                ]
                  .filter(Boolean)
                  .join("\n"),
              );
            } else {
              try {
                const state = ((window as any).__neoReservationState || {}) as any;
                (window as any).__neoReservationState = {
                  ...state,
                  available_rooms: rooms.map((r: any, index: number) => ({
                    index,
                    name: String(r?.name || "").trim(),
                    total_price: r?.total_price ?? null,
                    price_per_night: r?.price_per_night ?? null,
                    currency: r?.currency || "BGN",
                    max_guests: r?.max_guests ?? null,
                    meal_plan: r?.meal_plan || null,
                  })),
                };
                console.log(
                  "[RESERVATION STATE][available_rooms]",
                  (window as any).__neoReservationState.available_rooms,
                );
              } catch {}

              const roomsList = rooms
                .slice(0, 8)
                .map((r: any, idx: number) => {
                  const price = r.total_price
                    ? `${r.total_price} ${r.currency || "BGN"} общо`
                    : r.price_per_night
                      ? `${r.price_per_night} ${r.currency || "BGN"}/нощ`
                      : "цена по договаряне";

                  return `${idx + 1}. ${r.name || "Стая"}: ${price}${r.max_guests ? `, макс. ${r.max_guests} гости` : ""}${r.meal_plan ? `, ${r.meal_plan}` : ""}`;
                })
                .join("\n");

              sendToGemini(
                [
                  "RESERVATION_CHECK_RESULT:",
                  `phase=check check_in=${parsed.check_in} check_out=${parsed.check_out} guests=${parsed.guests} nights=${avail?.nights || "?"}`,
                  "",
                  "НАЛИЧНИ СТАИ И ЦЕНИ:",
                  roomsList,
                  rawSummary ? `\nОбобщение: ${rawSummary}` : "",
                  "",
                  "⚠️ НЕ питай отново за дати или брой гости — вече са известни и проверени.",
                  "Представи наличните стаи и цени на клиента естествено и топло, като рецепционист. Питай коя стая го интересува.",
                  "Когато клиентът избере стая/вариант → върни ВЕДНАГА make_reservation JSON с phase=reserve и room_type. НЕ събирай предварително Три имена, Имейл и Телефон.",
                ]
                  .filter(Boolean)
                  .join("\n"),
              );
            }

            return true;
          }

          if (phase === "reserve") {
            const bookingUrl = String(result?.booking_url || "");
            const success = result?.success || !!bookingUrl;
            const missing = Array.isArray(result?.missing_required)
              ? result.missing_required.map((x: unknown) => String(x || "").trim()).filter(Boolean)
              : Array.isArray(result?.observation?.missing_required)
                ? result.observation.missing_required.map((x: unknown) => String(x || "").trim()).filter(Boolean)
                : [];

            const needsInput =
              Boolean(result?.needs_input) ||
              String(result?.stage || "") === "reservation_reserve_needs_input" ||
              missing.length > 0;

            if (needsInput) {
              // Filter out navigation/decorative noise — only real booking form fields
              const _NAV_NOISE =
                /^(бонус\s*код|bonus\s*code|избор:\s*\/|емоция|сватби|бизнес|конферентни|почивка|релакс|навигация|navigation|language|език)/i;
              const realMissing = missing.filter((m: string) => !_NAV_NOISE.test(m.trim()));

              // If only noise fields are "missing" — worker is confused, proceed to fill form
              if (realMissing.length === 0) {
                // No real required fields — try to proceed with available guest data
                const hasAnyGuestData = !!(parsed?.guest_name || parsed?.guest_email || parsed?.guest_phone);
                if (!hasAnyGuestData) {
                  sendToGemini(
                    [
                      "RESERVATION_RESERVE_NEEDS_INPUT:",
                      `phase=reserve`,
                      parsed?.room_type ? `room_type=${String(parsed.room_type)}` : "",
                      "",
                      "Попитай клиента за: Три имена (собствено и фамилия).",
                      "След като клиентът отговори, върни отново JSON action_request make_reservation със същия phase=reserve и същия room_type, като добавиш guest_name.",
                      "НЕ питай за бонус код — той е незадължителен.",
                    ]
                      .filter(Boolean)
                      .join("\n"),
                  );
                  return true;
                }
                // Has some data — ask for whatever is still missing
                const stillNeed = [];
                if (!parsed?.guest_name) stillNeed.push("Три имена");
                if (!parsed?.guest_email) stillNeed.push("Имейл");
                if (!parsed?.guest_phone) stillNeed.push("Телефон");
                if (stillNeed.length > 0) {
                  sendToGemini(
                    [
                      "RESERVATION_RESERVE_NEEDS_INPUT:",
                      `phase=reserve`,
                      parsed?.room_type ? `room_type=${String(parsed.room_type)}` : "",
                      "",
                      `Попитай клиента САМО за: ${stillNeed[0]}.`,
                      "След като клиентът отговори, върни отново JSON action_request make_reservation със същия phase=reserve и същия room_type.",
                    ]
                      .filter(Boolean)
                      .join("\n"),
                  );
                  return true;
                }
              }

              // ✅ v10 FIX: Verbatim directive — Gemini must say the exact pre-built sentence
              const _allMissing = realMissing.length > 0 ? realMissing : missing.length > 0 ? missing : [];
              const _currentState = ((window as any).__neoReservationState || {}) as any;

              // Build field list — omit what we already have
              const _needsName =
                _allMissing.some((f: string) => /иme|name|фамил/i.test(f)) && !_currentState.guest_name;
              const _needsEmail = _allMissing.some((f: string) => /имейл|mail/i.test(f)) && !_currentState.guest_email;
              const _needsPhone =
                _allMissing.some((f: string) => /телефон|phone/i.test(f)) && !_currentState.guest_phone;
              const _needsEgn = _allMissing.some((f: string) => /егн|egn/i.test(f)) && !_currentState.guest_egn;
              const _needsCountry = _allMissing.some((f: string) => /държав|country/i.test(f));
              const _needsDoc = _allMissing.some((f: string) => /документ|doc.*номер|номер.*doc/i.test(f));
              const _otherF = _allMissing.filter(
                (f: string) => !/иme|name|фамил|имейл|mail|телефон|phone|егн|egn|документ|doc|държав|country/i.test(f),
              );

              const _parts: string[] = [];
              if (_needsName) _parts.push("собствено и фамилно иme");
              if (_needsEmail) _parts.push("имейл адрес");
              if (_needsPhone) _parts.push("телефон за контакт");
              if (_needsEgn) _parts.push("ЕГН");
              if (_needsCountry) _parts.push("гражданство/държава");
              if (_needsDoc) _parts.push("тип и номер на документ за самоличност");
              _otherF.forEach((f: string) => _parts.push(f));

              const _listStr = _parts.length > 0 ? _parts.join(", ") : _allMissing.join(", ");
              const _haveStr = [
                _currentState.guest_name ? `иme: ${_currentState.guest_name}` : "",
                _currentState.guest_email ? `имейл: ${_currentState.guest_email}` : "",
                _currentState.guest_phone ? `тел: ${_currentState.guest_phone}` : "",
                _currentState.guest_egn ? `ЕГН: ${_currentState.guest_egn}` : "",
              ]
                .filter(Boolean)
                .join(", ");
              const _verbatim = `За да завършим резервацията ви за ${String(parsed?.room_type || "стаята")}, имам нужда от: ${_listStr}.${_haveStr ? ` Вече имам: ${_haveStr}.` : ""} Моля предоставете ги наведнъж.`;

              sendToGemini(
                [
                  "RESERVATION_RESERVE_NEEDS_INPUT:",
                  `phase=reserve room_type=${String(parsed?.room_type || "")}`,
                  "",
                  "Кажи ТОЧНО следното на клиента — ДУМА ПО ДУМА, без никакви промени или съкращения:",
                  `"${_verbatim}"`,
                  "",
                  "⚠️ КРИТИЧНО: Кажи ВСИЧКО в ЕДНО изречение. Абсолютно забранено е да питаш само за едно поле.",
                  "След като клиентът даде данните → върни JSON make_reservation phase=reserve с room_type и ВСИЧКИ guest_ полета наведнъж.",
                ]
                  .filter(Boolean)
                  .join("\n"),
              );

              return true;
            }
            if (bookingUrl || result?.observation?.payment_required) {
              const finalBookingUrl = String(bookingUrl || result?.observation?.url || "");
              sendToGemini(
                [
                  "RESERVATION_RESERVE_RESULT:",
                  `phase=reserve success=true booking_url=${finalBookingUrl}`,
                  parsed?.room_type ? `room_type=${String(parsed.room_type)}` : "",
                  "",
                  "Резервацията е попълнена успешно до последната стъпка (плащане).",
                  finalBookingUrl ? `Линк за завършване: ${finalBookingUrl}` : "",
                  "",
                  "Кажи на клиента: Попълних всички данни. Остава само да довършите потвърждението/плащането от линка.",
                  "НЕ питай за данни от карта. Просто го насочи към линка.",
                ]
                  .filter(Boolean)
                  .join("\n"),
              );
            } else {
              sendToGemini(
                [
                  "RESERVATION_RESERVE_RESULT:",
                  `phase=reserve success=${success} no_booking_url`,
                  parsed?.room_type ? `room_type=${String(parsed.room_type)}` : "",
                  `worker_message=${String(result?.message || "")}`,
                  "",
                  "Не успяхме да получим директен линк за резервация.",
                  "Кажи на клиента учтиво, че стигнахме до следващата booking стъпка, но няма директен финален линк. Предложи нов опит или директен контакт с хотела.",
                ]
                  .filter(Boolean)
                  .join("\n"),
              );
            }

            // ✅ Cleanup mutex before leaving reserve phase
            try {
              delete (window as any).__neoReserveInFlight;
            } catch {}
            return true;
          }

          // ✅ Cleanup mutex (phase=check or unknown)
          try {
            delete (window as any).__neoReserveInFlight;
          } catch {}
          return true;
        }

        // ── NEO CALENDAR: book_slot ─────────────────────────────────
        if (parsed?.action === "book_slot") {
          const calAction = String(parsed?.calendar_action || "get_slots");
          const SUPABASE_BASE = "https://onufuxczpqlxxkgyltlz.supabase.co/functions/v1/widget-book-slot";

          const calUserId = parsed?.owner_user_id ||
            (sessionDataRef.current as any)?.userId ||
            (sessionDataRef.current as any)?.user_id || "";

          if (!calUserId) {
            sendToGemini("CALENDAR_ERROR: Няма userId. Кажи на клиента учтиво, че календарът не е наличен в момента.");
            return true;
          }

          try {
            const calBody: any = {
              action: calAction,
              userId: calUserId,
              date: parsed?.date || undefined,
              time: parsed?.time || undefined,
              attendeeName: parsed?.attendee_name || parsed?.client_name || undefined,
              attendeeEmail: parsed?.attendee_email || parsed?.client_email || undefined,
            };

            console.log("[ACTION][BOOK_SLOT]", calAction, calBody);

            const calRes = await fetch(SUPABASE_BASE, {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: anonKey },
              body: JSON.stringify(calBody),
            });

            const calResult = await calRes.json().catch(() => ({}));
            console.log("[ACTION][BOOK_SLOT] result:", calResult);

            if (calAction === "get_slots") {
              sendToGemini(
                [
                  "CALENDAR_SLOTS_RESULT:",
                  `date=${calResult?.date || parsed?.date || ""}`,
                  `available=${calResult?.available}`,
                  `bookingLabel=${calResult?.bookingLabel || ""}`,
                  `message=${calResult?.message || ""}`,
                  calResult?.nextAvailableDate ? `nextAvailableDate=${calResult.nextAvailableDate}` : "",
                  calResult?.slots ? `slots=${calResult.slots.map((s: any) => s.display).join(", ")}` : "",
                  "",
                  "Предай тази информация на клиента по естествен начин.",
                ].filter(Boolean).join("\n")
              );
            } else if (calAction === "book") {
              if (calResult?.success) {
                sendToGemini(
                  [
                    "CALENDAR_BOOKING_SUCCESS:",
                    `message=${calResult?.message || ""}`,
                    `bookingId=${calResult?.bookingId || ""}`,
                    "",
                    "Кажи на клиента, че записът е направен успешно. Предай детайлите.",
                  ].join("\n")
                );
              } else {
                sendToGemini(
                  [
                    "CALENDAR_BOOKING_FAILED:",
                    `message=${calResult?.message || calResult?.error || "Грешка при записване"}`,
                    "",
                    "Кажи на клиента учтиво, че часът не е наличен и предложи алтернатива.",
                  ].join("\n")
                );
              }
            }
          } catch (e) {
            console.error("[BOOK_SLOT ERROR]", e);
            sendToGemini("CALENDAR_ERROR: Технически проблем с календара. Кажи на клиента учтиво и предложи нов опит.");
          }
          return true;
        }

        // ── СТАНДАРТНА ФОРМА (submit_form) ───────────────────────────
        if (parsed?.action !== "submit_form") return false;

        // Inject live session + deterministic form target so proxy always has a target.
        const _sid =
          parsed?.session_id ||
          (sessionDataRef.current as any)?.sessionId ||
          (sessionDataRef.current as any)?.session_id ||
          "";

        const inferredTarget =
          lastSubmitFormTargetRef.current ||
          pickPreferredSubmitFormTarget(
            extractSubmitFormTargetsFromInstruction((sessionDataRef.current as any)?.systemInstruction || ""),
          );

        if (inferredTarget?.form_id || inferredTarget?.fingerprint) {
          lastSubmitFormTargetRef.current = inferredTarget;
        }

        const enrichedParsed = {
          ...parsed,
          ...(_sid ? { session_id: _sid } : {}),
          ...(!parsed?.form_id && inferredTarget?.form_id ? { form_id: inferredTarget.form_id } : {}),
          ...(!parsed?.fingerprint && inferredTarget?.fingerprint ? { fingerprint: inferredTarget.fingerprint } : {}),
        };

        console.log("[SUBMIT_FORM] enriched payload keys:", Object.keys(enrichedParsed));
        console.log("[SUBMIT_FORM] target:", {
          session_id: enrichedParsed?.session_id || "",
          form_id: enrichedParsed?.form_id || "",
          fingerprint: enrichedParsed?.fingerprint || "",
          inferredTarget,
        });

        if (!enrichedParsed?.session_id || (!enrichedParsed?.form_id && !enrichedParsed?.fingerprint)) {
          console.error("[SUBMIT_FORM] missing proxy target", {
            session_id: enrichedParsed?.session_id || "",
            form_id: enrichedParsed?.form_id || "",
            fingerprint: enrichedParsed?.fingerprint || "",
            inferredTarget,
          });

          sendToGemini(
            [
              "WORKER_SUBMIT_BLOCKED:",
              `session_id=${String(enrichedParsed?.session_id || "")}`,
              `form_id=${String(enrichedParsed?.form_id || "")}`,
              `fingerprint=${String(enrichedParsed?.fingerprint || "")}`,
              "",
              "Не казвай, че формата е изпратена.",
              "Кажи учтиво на клиента, че в момента има технически проблем с формата и предложи нов опит след малко.",
            ].join("\n"),
          );

          return true;
        }

        const res = await fetch(PROXY_BASE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify(enrichedParsed),
        });

        const result = await res.json().catch(() => ({}));
        console.log("[PROXY RESULT]:", result);

        const needsInput =
          Boolean(result?.needs_input) || result?.stage === "needs_input" || extractMissingRequired(result).length > 0;

        if (needsInput) {
          const missing = extractMissingRequired(result);
          const first = missing[0] || "следващото задължително поле";

          // Key point: keep loop tight & deterministic: ask for ONE field only.
          sendToGemini(
            [
              "WORKER_NEEDS_INPUT:",
              missing.length ? `missing_required=${missing.join(", ")}` : "missing_required=unknown",
              "",
              `Попитай клиента САМО за: ${first}.`,
              "След като клиентът отговори, върни отново JSON action_request (submit_form) със същите form_id/fingerprint, като добавиш новото поле към fields.",
              "НЕ казвай, че е подадено. Чакаш success=true от worker/proxy.",
            ].join("\n"),
          );

          return true;
        }

        if (result?.success) {
          // Tell Gemini so it speaks the confirmation out loud
          sendToGemini(
            [
              "WORKER_SUBMIT_SUCCESS:",
              "Формата е изпратена успешно (submitted=true).",
              "",
              "Кажи на клиента накратко, че запитването е подадено успешно през формата.",
              "НЕ питай допълнителни въпроси. Просто потвърди, че е готово и благодари.",
            ].join("\n"),
          );
        } else {
          sendToGemini(
            [
              "WORKER_SUBMIT_FAILED:",
              `Резултат: ${JSON.stringify(result).slice(0, 300)}`,
              "",
              "Кажи на клиента, че не успя да подаде запитването и попитай дали да опита отново.",
            ].join("\n"),
          );
        }

        return true;
      } catch {
        return false;
      }
    },
    [onError, onMessage, sendToGemini],
  );

  const textOnlyRef = useRef(false);

  const connect = useCallback(
    async (systemPrompt: string, companyName: string, sessionId?: string, textOnly?: boolean) => {
      textOnlyRef.current = !!textOnly;
      const key = `${sessionId || ""}::${companyName || ""}::${hash32(systemPrompt || "")}`;

      if (isConnectedRef.current && preparedKeyRef.current && preparedKeyRef.current !== key) {
        console.log("[CONNECT] 🔄 Context changed while connected → reconnect WS");
        disconnect();
      }

      if (connectMutexRef.current || isConnectedRef.current || isConnectingRef.current) return;
      connectMutexRef.current = true;
      isConnectingRef.current = true;
      setIsConnecting(true);

      try {
        await prepareSession(systemPrompt, companyName, sessionId);

        if (!textOnly) {
          if (!streamRef.current) {
            streamRef.current = await navigator.mediaDevices.getUserMedia({
              audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
          }
        }

        audioContextRef.current = new AudioContext();
        if (audioContextRef.current.state === "suspended") await audioContextRef.current.resume();

        const session = sessionDataRef.current;
        if (!session) {
          // prepareSession already called onError with the real reason.
          // Just clean up state and return — don't throw a second confusing error.
          connectMutexRef.current = false;
          isConnectingRef.current = false;
          setIsConnecting(false);
          return;
        }

        const isLive001 = session.model.includes("2.0-flash-live");
        const isNativeAudioPreview = session.model.includes("native-audio");
        const apiVersion = isLive001 || isNativeAudioPreview ? "v1alpha" : "v1beta";
        console.log("[CONNECT] Gemini WS, model:", session.model, "api:", apiVersion);

        const ws = new WebSocket(
          `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${apiVersion}.GenerativeService.BidiGenerateContent?key=${session.apiKey}`,
        );
        wsRef.current = ws;

        ws.onopen = () => {
          const isNativeAudio = session.model.includes("native-audio");
          const voiceName = isNativeAudio ? "Charon" : "Charon";

          const setupPayload: any = {
            setup: {
              model: `models/${session.model}`,
              generation_config: {
                response_modalities: ["AUDIO"],
                temperature: 0.3,
                max_output_tokens: 1500,
                speech_config: {
                  voice_config: { prebuilt_voice_config: { voice_name: voiceName } },
                },
                thinking_config: { thinking_budget: 0 },
              },
              system_instruction: { parts: [{ text: session.systemInstruction }] },
            },
          };

          if (isNativeAudio) setupPayload.setup.output_audio_transcription = {};

          ws.send(JSON.stringify(setupPayload));
          console.log(`[GEMINI] Setup sent — thinking=OFF, voice=${voiceName}`);
        };

        ws.onmessage = async (event) => {
          const data = JSON.parse(event.data instanceof Blob ? await event.data.text() : event.data);

          if (data?.setupComplete || data?.setup_complete) {
            console.log("[GEMINI] ✅ Ready — LLM + Voice, zero thinking");
            isConnectedRef.current = true;
            isConnectingRef.current = false;
            setIsConnected(true);
            setIsConnecting(false);
            if (!textOnlyRef.current) {
              startAudioCapture();
              connectSTT();
            } else {
              console.log("[GEMINI] Text-only mode — skipping mic/STT");
            }

            if (!greetingSentRef.current) {
              greetingSentRef.current = true;
              currentResponseTextRef.current = "";
              sendToGemini(
                `Нов клиент се обади. Поздрави го кратко — ти си НЕО от ${companyNameRef.current}. Питай с какво можеш да помогнеш. Максимум 2 изречения.`,
              );
            }
          }

          const content = data?.serverContent || data?.server_content;
          if (!content) return;

          const modelTurn = content.modelTurn || content.model_turn;
          if (modelTurn?.parts) {
            // ★ Suppress canceled assistant turn — don't play audio or accumulate text
            if (assistantTurnCanceledRef.current) {
              // Still allow action JSON through (it won't be spoken anyway)
              for (const part of modelTurn.parts) {
                if (part.text) {
                  const partText = String(part.text).trim();
                  const looksLikeAction =
                    partText.startsWith("{") ||
                    partText.includes('"type":"action_request"') ||
                    partText.includes('"type": "action_request"');
                  if (looksLikeAction) {
                    currentResponseTextRef.current = partText;
                  }
                }
              }
            } else {
              for (const part of modelTurn.parts) {
                if (part.inlineData?.data) {
                  clearSilenceWatchdog();
                  playAudioChunk(part.inlineData.data);
                }
                if (part.text) {
                  const partText = String(part.text).trim();

                  if (partText) {
                    console.log("[MODEL PART TEXT]", partText.slice(0, 1200));
                  }

                  const looksLikeAction =
                    partText.startsWith("{") ||
                    partText.includes('"type":"action_request"') ||
                    partText.includes('"type": "action_request"') ||
                    partText.includes('"action":"make_reservation"') ||
                    partText.includes('"action": "make_reservation"') ||
                    partText.includes('"action":"submit_form"') ||
                    partText.includes('"action": "submit_form"');

                  if (looksLikeAction) {
                    currentResponseTextRef.current = partText;
                  } else if (partText) {
                    if (currentResponseTextRef.current && !currentResponseTextRef.current.endsWith(" ")) {
                      currentResponseTextRef.current += " ";
                    }
                    currentResponseTextRef.current += partText;
                  }
                }
              }
            }
          }

          // ★ Suppress transcription output for canceled turns
          if (!assistantTurnCanceledRef.current) {
            const transcription =
              content.outputTranscription ||
              content.output_transcription ||
              content.outputAudioTranscription ||
              content.output_audio_transcription;
            if (transcription?.text) {
              const txt = transcription.text.trim();
              const currentLooksLikeAction =
                currentResponseTextRef.current.startsWith("{") ||
                currentResponseTextRef.current.includes('"type":"action_request"') ||
                currentResponseTextRef.current.includes('"type": "action_request"');

              if (
                txt &&
                !txt.startsWith("**") &&
                !txt.includes(">>>") &&
                !txt.includes("<<<") &&
                !currentLooksLikeAction
              ) {
                if (currentResponseTextRef.current && !currentResponseTextRef.current.endsWith(" ")) {
                  currentResponseTextRef.current += " ";
                }
                currentResponseTextRef.current += txt;
                onTranscript?.(currentResponseTextRef.current, false, "assistant");
              }
            }
          }

          if (content.turnComplete || content.turn_complete) {
            const wasCanceled = assistantTurnCanceledRef.current;
            assistantTurnCanceledRef.current = false;
            const responseText = currentResponseTextRef.current.trim();

            if (responseText) {
              // Always try to execute actions even from canceled turns
              const looksLikeActionResponse =
                responseText.startsWith("{") ||
                responseText.includes("action_request") ||
                responseText.includes("make_reservation") ||
                responseText.includes("submit_form");

              if (looksLikeActionResponse) {
                console.log("[TURN_COMPLETE] action JSON (wasCanceled=%s):", wasCanceled, responseText.slice(0, 200));
                let handled = await maybeExecuteActionFromGemini(responseText);
                if (!handled) {
                  const jsonMatch = responseText.match(/\{[\s\S]*"type"\s*:\s*"action_request"[\s\S]*\}/);
                  if (jsonMatch) {
                    handled = await maybeExecuteActionFromGemini(jsonMatch[0]);
                  }
                }
                if (handled) {
                  currentResponseTextRef.current = "";
                  return;
                }
              }

              if (!wasCanceled) {
                console.log("[TURN_COMPLETE] responseText preview:", responseText.slice(0, 200));
                let handled = await maybeExecuteActionFromGemini(responseText);
                if (
                  !handled &&
                  (responseText.includes("action_request") ||
                    responseText.includes("make_reservation") ||
                    responseText.includes("submit_form"))
                ) {
                  const jsonMatch = responseText.match(/\{[\s\S]*"type"\s*:\s*"action_request"[\s\S]*\}/);
                  if (jsonMatch) {
                    handled = await maybeExecuteActionFromGemini(jsonMatch[0]);
                  }
                }

                if (!handled) {
                  onMessage?.({ role: "assistant", content: responseText });
                  onTranscript?.(responseText, true, "assistant");
                  expectedSensitiveInputModeRef.current = detectExpectedSensitiveInputMode(responseText);
                  if (expectedSensitiveInputModeRef.current !== "general") {
                    pendingSensitiveCaptureRef.current = null;
                    if (expectedSensitiveInputModeRef.current === "contact") {
                      capturedSensitiveContactRef.current = capturedSensitiveContactRef.current || null;
                    } else {
                      capturedSensitiveContactRef.current = null;
                    }
                    console.log("[STT] sensitive capture mode:", expectedSensitiveInputModeRef.current);
                  }
                }
              } else {
                console.log("[TURN_COMPLETE] suppressed canceled assistant turn:", responseText.slice(0, 100));
              }
            }

            currentResponseTextRef.current = "";
          }
        };

        ws.onerror = () => {
          connectMutexRef.current = false;
          disconnect();
        };
        ws.onclose = (ev) => {
          console.log("[GEMINI] Closed:", ev.code, ev.reason);
          connectMutexRef.current = false;
          isConnectedRef.current = false;
          setIsConnected(false);
        };
      } catch (e) {
        connectMutexRef.current = false;
        isConnectingRef.current = false;
        setIsConnecting(false);
        onError?.(e instanceof Error ? e.message : "Connection failed");
        disconnect();
      }
    },
    [
      prepareSession,
      disconnect,
      onError,
      onMessage,
      onTranscript,
      startAudioCapture,
      connectSTT,
      playAudioChunk,
      clearSilenceWatchdog,
      sendToGemini,
      maybeExecuteActionFromGemini,
    ],
  );

  const sendText = useCallback(
    (text: string) => {
      const t = String(text || "").trim();

      try {
        const state = ((window as any).__neoReservationState || {}) as any;
        const next = { ...state };

        const isoDates = t.match(/\b20\d{2}-\d{2}-\d{2}\b/g) || [];
        let parsedDates = parseBulgarianDateText(t);

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const currentDay = now.getDate();

        const toIsoFromDayOnly = (dayNum: number) => {
          let year = currentYear;
          if (dayNum < currentDay) year = currentYear + 1;
          return `${String(year)}-${String(currentMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
        };

        const addDaysToIso = (iso: string, nights: number) => {
          const d = new Date(`${iso}T12:00:00`);
          if (Number.isNaN(d.getTime())) return "";
          d.setDate(d.getDate() + nights);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        };

        // extra fallback for chat inputs like "za 16 do 21"
        if (parsedDates.length < 2) {
          const dayOnlyRange = t.match(/\b(\d{1,2})\s*(?:до|do|to|[-–—])\s*(\d{1,2})\b/i);
          if (dayOnlyRange) {
            const d1 = Number(dayOnlyRange[1]);
            const d2 = Number(dayOnlyRange[2]);

            if (d1 >= 1 && d1 <= 31 && d2 >= 1 && d2 <= 31) {
              parsedDates = [toIsoFromDayOnly(d1), toIsoFromDayOnly(d2)];
            }
          }
        }

        const allDates = [...isoDates, ...parsedDates];

        if (allDates[0]) next.check_in = allDates[0];
        if (allDates[1]) next.check_out = allDates[1];

        const standaloneNum = /^\d+$/.test(t) ? Number(t) : null;
        const hasGuestWords = /\b(гост|гости|gost|gosti|adults?|persons?|people|pax|човека|души?)\b/i.test(t);
        const hasNightWords = /\b(нощ|нощувк|nights?|night|overnight)\b/i.test(t);

        // 1) ако е само число и още няма check_in -> приемай го за ден от месеца
        if (
          standaloneNum !== null &&
          standaloneNum >= 1 &&
          standaloneNum <= 31 &&
          !next.check_in &&
          !hasGuestWords &&
          !hasNightWords
        ) {
          next.check_in = toIsoFromDayOnly(standaloneNum);
        }

        // 2) ако вече има check_in, няма check_out и клиентът дава число -> приемай го за нощувки
        if (
          standaloneNum !== null &&
          standaloneNum >= 1 &&
          standaloneNum <= 30 &&
          !!next.check_in &&
          !next.check_out &&
          !next.guests &&
          !hasGuestWords
        ) {
          next.nights = String(standaloneNum);
          const derivedCheckOut = addDaysToIso(String(next.check_in), standaloneNum);
          if (derivedCheckOut) next.check_out = derivedCheckOut;
        }

        const nightsMatch = t.match(/\b(\d+)\s*(нощ(?:увк[аи]?)?|нощи|noshtuvki|noshtuvka|nights?|night)\b/i);

        if (nightsMatch?.[1]) {
          const nightsNum = Number(nightsMatch[1]);
          if (Number.isFinite(nightsNum) && nightsNum >= 1 && nightsNum <= 60) {
            next.nights = String(nightsNum);
            if (next.check_in && !next.check_out) {
              const derivedCheckOut = addDaysToIso(String(next.check_in), nightsNum);
              if (derivedCheckOut) next.check_out = derivedCheckOut;
            }
          }
        }

        const guestsMatch = t.match(/\b(\d+)\s*(гост[аи]?|gost(?:i)?|adults?|persons?|people|pax|човека|души?)\b/i);

        if (guestsMatch?.[1]) {
          next.guests = guestsMatch[1];
        } else {
          const standaloneNums = t.match(/\b\d+\b/g) || [];
          const plausibleGuestNum = standaloneNums.find((n) => {
            const v = Number(n);
            return Number.isFinite(v) && v >= 1 && v <= 20;
          });

          // standalone число става guests само ако:
          // - има guest думи, ИЛИ
          // - вече имаме период и входът очевидно е за гости, а не просто ден/нощувки
          if (
            plausibleGuestNum &&
            (hasGuestWords ||
              (!!next.check_in &&
                !!next.check_out &&
                !next.guests &&
                /^\s*\d+\s*$/.test(t) &&
                Number(plausibleGuestNum) <= 10))
          ) {
            next.guests = plausibleGuestNum;
          }
        }

        if (next.check_in && !next.check_out && next.nights) {
          const derivedCheckOut = addDaysToIso(String(next.check_in), Number(next.nights));
          if (derivedCheckOut) next.check_out = derivedCheckOut;
        }

        // Reset dedupe keys when dates change so a new check can fire
        const nextCheckKey = [
          (sessionDataRef.current as any)?.sessionId || (sessionDataRef.current as any)?.session_id || "",
          String(next.check_in || ""),
          String(next.check_out || ""),
          String(next.guests || "2"),
          String(next.rooms || "1"),
        ].join("::");

        if (autoReservationCheckDoneKeyRef.current && autoReservationCheckDoneKeyRef.current !== nextCheckKey) {
          autoReservationCheckDoneKeyRef.current = "";
        }
        if (autoReservationCheckKeyRef.current && autoReservationCheckKeyRef.current !== nextCheckKey) {
          autoReservationCheckKeyRef.current = "";
        }

        (window as any).__neoReservationState = next;
        console.log("[RESERVATION STATE][sendText]", next);
      } catch {}

      // ── Direct room selection detection ──────────────────────────
      // If user text matches an available room AND we have dates → fire reserve directly
      // This bypasses the Gemini→JSON→parse loop entirely
      try {
        const state = ((window as any).__neoReservationState || {}) as any;
        const availRooms: any[] = Array.isArray(state?.available_rooms) ? state.available_rooms : [];
        const hasDateRange = !!state?.check_in && !!state?.check_out;

        if (availRooms.length > 0 && hasDateRange && t.length >= 2 && t.length <= 60) {
          const resolvedRoom = resolveRoomTypeFromState(t, state);
          const isRealRoom = availRooms.some(
            (r: any) => normalizeRoomText(String(r?.name || "")) === normalizeRoomText(resolvedRoom),
          );

          if (isRealRoom && resolvedRoom) {
            console.log(`[ROOM DETECT] Direct reserve trigger → "${resolvedRoom}"`);

            const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || "";
            const PROXY_BASE = "https://onufuxczpqlxxkgyltlz.supabase.co/functions/v1/neo-worker-proxy";

            const reservePayload = {
              type: "action_request",
              action: "make_reservation",
              session_id:
                (sessionDataRef.current as any)?.sessionId || (sessionDataRef.current as any)?.session_id || "",
              phase: "reserve",
              check_in: state.check_in,
              check_out: state.check_out,
              guests: state.guests || "2",
              rooms: state.rooms || "1",
              room_type: resolvedRoom,
            };

            // Don't await — fire and forget, result goes back through sendToGemini
            (async () => {
              try {
                console.log("[ROOM DETECT] POST reserve", reservePayload);
                const res = await fetch(`${PROXY_BASE}/make-reservation`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    apikey: anonKey,
                    Authorization: `Bearer ${anonKey}`,
                  },
                  body: JSON.stringify(reservePayload),
                });
                const rawText = await res.text().catch(() => "");
                console.log("[ROOM DETECT] reserve HTTP", res.status, rawText.slice(0, 800));
                let result: any = {};
                try {
                  result = rawText ? JSON.parse(rawText) : {};
                } catch {}

                // Reuse existing action handler logic by constructing a fake parsed object
                const fakeAction = { ...reservePayload, ...result };
                // Feed result back through existing reserve handler via sendToGemini
                const missing: string[] = Array.isArray(result?.missing_required)
                  ? result.missing_required.map((x: unknown) => String(x || "").trim()).filter(Boolean)
                  : [];

                const _NAV_NOISE =
                  /^(бонус\s*код|bonus\s*code|избор:\s*\/|емоция|сватби|бизнес|конферентни|почивка|релакс)/i;
                const realMissing = missing.filter((m: string) => !_NAV_NOISE.test(m.trim()));

                if (result?.booking_url || result?.observation?.payment_required) {
                  const finalUrl = String(result.booking_url || result?.observation?.url || "");
                  sendToGemini(
                    [
                      "RESERVATION_RESERVE_RESULT:",
                      `phase=reserve success=true booking_url=${finalUrl}`,
                      `room_type=${resolvedRoom}`,
                      "",
                      "Резервацията е попълнена успешно до последната стъпка.",
                      finalUrl ? `Линк: ${finalUrl}` : "",
                      "Кажи на клиента: Попълних данните. Остава само да довършите потвърждението от линка.",
                    ]
                      .filter(Boolean)
                      .join("\n"),
                  );
                } else if (realMissing.length === 0) {
                  // No real fields missing — ask for guest identity
                  sendToGemini(
                    [
                      "RESERVATION_RESERVE_NEEDS_INPUT:",
                      "phase=reserve",
                      `room_type=${resolvedRoom}`,
                      "",
                      "Попитай клиента за: Три имена (собствено и фамилия).",
                      "След като отговори, върни JSON action_request make_reservation phase=reserve с room_type и guest_name.",
                      "НЕ питай за бонус код.",
                    ]
                      .filter(Boolean)
                      .join("\n"),
                  );
                } else {
                  sendToGemini(
                    [
                      "RESERVATION_RESERVE_NEEDS_INPUT:",
                      "phase=reserve",
                      `room_type=${resolvedRoom}`,
                      "",
                      `Попитай клиента САМО за: ${realMissing[0]}.`,
                      "НЕ питай за бонус код.",
                      "След като отговори, върни JSON action_request make_reservation phase=reserve.",
                    ]
                      .filter(Boolean)
                      .join("\n"),
                  );
                }
              } catch (e) {
                console.error("[ROOM DETECT] reserve failed:", e);
              }
            })();

            // ✅ DO NOT call handleUserUtterance here — it would send the raw text to Gemini
            // simultaneously with the RESERVATION_RESERVE_NEEDS_INPUT instruction,
            // causing Gemini to respond to "студио с балкон" as plain text (asking "за коя дата?")
            // instead of responding to the reservation instruction.
            // The async block above sends the proper sendToGemini instruction when result is ready.
            return;
          }
        }
      } catch (e) {
        console.warn("[ROOM DETECT] error:", e);
      }
      // ─────────────────────────────────────────────────────────────

      handleUserUtterance(`${text}`);

      window.setTimeout(() => {
        tryAutoRunReservationCheck();
      }, 40);
    },
    [handleUserUtterance, tryAutoRunReservationCheck, sendToGemini],
  );

  useEffect(() => () => disconnect(), [disconnect]);

  useEffect(() => {
    const resume = async () => {
      if (audioContextRef.current?.state === "suspended") await audioContextRef.current.resume();
    };
    const events = ["touchstart", "touchend", "click", "keydown"];
    events.forEach((e) => document.addEventListener(e, resume, { passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, resume));
  }, []);

  const getSessionData = useCallback(() => sessionDataRef.current, []);

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    isListening,
    connect,
    disconnect,
    prepareSession,
    preWarmMicrophone,
    sendText,
    getSessionData,
    interrupt: () => {
      assistantTurnCanceledRef.current = true;
      scheduledSourcesRef.current.forEach((s) => {
        try {
          s.stop();
        } catch {}
      });
      scheduledSourcesRef.current = [];
      audioQueueRef.current = [];
      isProcessingQueueRef.current = false;
      isPlayingRef.current = false;
      nextPlayTimeRef.current = 0;
      updateSpeaking(false);
    },
  };
};
