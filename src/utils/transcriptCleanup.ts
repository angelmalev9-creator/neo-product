/**
 * Post-processes transcript text before persisting to DB.
 * Normalizes spoken email patterns like "точка ком" → ".com",
 * "маймунско" → "@", "джимейл" → "gmail", etc.
 */

function transliterateBgToLatin(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
    р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
    ш: "sh", щ: "sht", ъ: "a", ь: "", ю: "yu", я: "ya",
  };
  return Array.from(text.toLowerCase()).map(ch => map[ch] ?? ch).join("");
}

function normalizeEmailProvider(text: string): string {
  return text
    .replace(/джи\s*мейл|джимейл|гмаил|гмейл|гмеил|g\s*mail|g\s*mal|g\s*meil/giu, "gmail")
    .replace(/абеве|абв|a\s*b\s*v|abv/giu, "abv")
    .replace(/аутлук|оутлук|out\s*look|outlook/giu, "outlook")
    .replace(/хот\s*мейл|хотмейл|hot\s*mail|hotmail/giu, "hotmail")
    .replace(/яху|y\s*ahoo|yahoo/giu, "yahoo");
}

function normalizeEmailTld(text: string): string {
  return text
    .replace(/точка\s*ком|dot\s*com/giu, ".com")
    .replace(/точка\s*бг|точка\s*бе\s*ге|dot\s*bg/giu, ".bg")
    .replace(/точка\s*нет|dot\s*net/giu, ".net")
    .replace(/точка\s*орг|dot\s*org/giu, ".org")
    .replace(/точка\s*инфо|dot\s*info/giu, ".info")
    .replace(/точка\s*еу|dot\s*eu/giu, ".eu");
}

function normalizeAtSign(text: string): string {
  return text
    .replace(/\bмаймунско\b|\bмаймунка\b|\bкльомба\b|\bклумба\b|\bкломба\b/giu, " @ ")
    .replace(/\bmaimunka\b|\bmaimunsko\b|\bklyomba\b|\bklomba\b|\bklumba\b/giu, " @ ");
}

/**
 * Detects email-like segments in natural speech and normalizes them.
 * E.g. "Имейлът ми е иван маймунско джимейл точка ком" → "Имейлът ми е ivan@gmail.com"
 */
export function cleanTranscriptForStorage(text: string): string {
  if (!text) return text;

  // Check if text contains email-related cues
  const hasEmailCue = /маймунско|маймунка|кльомба|клумба|кломба|джимейл|гмейл|абв|аутлук|точка\s*ком|точка\s*бг|точка\s*нет|gmail|abv|outlook|hotmail|yahoo|maimunka|maimunsko|klyomba/i.test(text);
  
  if (!hasEmailCue) return text;

  // Find the email segment: from potential local part through provider+tld
  // Strategy: apply normalizations to the full text but preserve non-email parts
  let result = text;
  
  // First pass: normalize TLD and provider names in-place
  result = normalizeEmailTld(result);
  result = normalizeEmailProvider(result);
  result = normalizeAtSign(result);

  // Try to extract and compact the email part
  const emailMatch = result.match(/([а-яa-z0-9._\s-]+)\s*@\s*(gmail|abv|outlook|hotmail|yahoo|mail)(\.[a-z]{2,4})?/i);
  if (emailMatch) {
    const localRaw = emailMatch[1].trim();
    const provider = emailMatch[2].toLowerCase();
    const tld = emailMatch[3] || (provider === "abv" ? ".bg" : ".com");
    
    // Transliterate the local part
    const localClean = transliterateBgToLatin(localRaw)
      .replace(/[^a-z0-9._+-]/g, "")
      .replace(/\.{2,}/g, ".")
      .replace(/^\.+|\.+$/g, "");
    
    if (localClean) {
      const cleanEmail = `${localClean}@${provider}${tld}`;
      // Replace the matched segment in the original text
      const fullMatch = emailMatch[0];
      const startIdx = result.indexOf(fullMatch);
      if (startIdx !== -1) {
        // Also strip any "имейлът ми е" prefix right before the email
        const before = result.slice(0, startIdx).replace(/(?:имейл[ъа]т?\s+(?:ми\s+)?е\s*|имейл\s+(?:ми\s+)?е\s*)$/iu, "");
        result = before + cleanEmail + result.slice(startIdx + fullMatch.length);
      }
    }
  }

  return result.replace(/\s+/g, " ").trim();
}
