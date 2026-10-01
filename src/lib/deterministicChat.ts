const STOP_WORDS = new Set([
  'и','в','във','на','за','с','със','от','до','по','при','ли','се','са','е','как','какъв','каква','какви',
  'има','имате','може','мога','искам','ми','ви','ваш','вашия','вашата','този','тази','това','the','a','an','and',
  'or','of','to','for','is','are','do','does','how','what','which','with','from','your','you','i','me'
]);

const normalize = (value: string) => value
  .toLocaleLowerCase('bg-BG')
  .replace(/https?:\/\/\S+/g, ' ')
  .replace(/[^\p{L}\p{N}€$£%+.-]+/gu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const tokens = (value: string) => normalize(value)
  .split(' ')
  .filter(token => token.length > 2 && !STOP_WORDS.has(token));

const INTENTS: Record<string, string[]> = {
  price: ['цена','цени','струва','стойност','лв','лева','евро','€','price','cost'],
  hours: ['работно','време','работите','отворено','часове','график','hours','open'],
  contact: ['телефон','имейл','email','контакт','свържа','phone'],
  address: ['адрес','къде','намирате','локация','location','address'],
  service: ['услуга','услуги','предлагате','масаж','процедура','service','services'],
};
const detectIntent = (query: string) => {
  const q = normalize(query);
  return Object.entries(INTENTS)
    .filter(([, words]) => words.some(word => q.includes(word)))
    .map(([intent]) => intent);
};

const isUsefulLine = (line: string) => {
  const value = line.trim();
  if (value.length < 8 || value.length > 420) return false;
  if (/^(#{2,}|[-=]{3,}|ти си |важно:|стъпка \d|кога да |задължителни|дейcтвия|actions?)/i.test(value)) return false;
  if (/^\{.*"(type|action)"/i.test(value)) return false;
  return true;
};

const getKnowledgeLines = (source: string) => {
  let knowledge = source || '';
  const marker = 'Информация за компанията:';
  const markerIndex = knowledge.indexOf(marker);
  if (markerIndex >= 0) knowledge = knowledge.slice(markerIndex + marker.length);

  return knowledge
    .split(/\n+/)
    .map(line => line.replace(/^===\s*|\s*===$/g, '').trim())
    .filter(isUsefulLine);
};
const scoreLine = (line: string, query: string, queryTokens: string[], intents: string[]) => {
  const normalizedLine = normalize(line);
  let score = 0;

  for (const token of queryTokens) {
    if (normalizedLine.includes(token)) score += token.length > 6 ? 5 : 3;
  }

  const normalizedQuery = normalize(query);
  if (normalizedQuery.length > 8 && normalizedLine.includes(normalizedQuery)) score += 15;

  for (const intent of intents) {
    const words = INTENTS[intent] || [];
    if (words.some(word => normalizedLine.includes(word))) score += 4;
  }

  if (/\b\d+(?:[.,]\d+)?\s*(?:лв\.?|лева|€|eur|евро)\b/i.test(line) && intents.includes('price')) score += 6;
  if (/\b(?:0?\d|1\d|2[0-3]):[0-5]\d\b/.test(line) && intents.includes('hours')) score += 6;
  if (/\+?\d[\d\s().-]{6,}\d/.test(line) && intents.includes('contact')) score += 6;
  if (/@/.test(line) && intents.includes('contact')) score += 6;

  return score;
};
export const buildDeterministicReply = (query: string, source: string, companyName = 'компанията') => {
  const q = normalize(query);
  if (/^(здравей|здрасти|добър ден|hello|hi|hey)\b/.test(q)) {
    return `Здравейте! Аз съм чат асистентът на ${companyName}. Как мога да Ви помогна?`;
  }

  const queryTokens = tokens(query);
  const intents = detectIntent(query);
  const ranked = getKnowledgeLines(source)
    .map(line => ({ line, score: scoreLine(line, query, queryTokens, intents) }))
    .filter(item => item.score >= (queryTokens.length <= 1 ? 4 : 6))
    .sort((a, b) => b.score - a.score);

  const selected: string[] = [];
  const seen = new Set<string>();
  for (const item of ranked) {
    const key = normalize(item.line);
    if (seen.has(key)) continue;
    if (selected.some(line => normalize(line).includes(key) || key.includes(normalize(line)))) continue;
    seen.add(key);
    selected.push(item.line);
    if (selected.length === 3) break;
  }

  if (!selected.length) {
    return 'Не откривам точна информация за това в сайта. Можете да оставите контакт и екипът ще Ви отговори.';
  }

  return selected.join('\n');
};
