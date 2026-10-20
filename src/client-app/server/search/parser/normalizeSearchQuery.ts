/**
 * Normalize a complete user search query.
 *
 * Pipeline:
 * Unicode → case → punctuation → whitespace → noise → numbers
 */
export function normalizeSearchQuery(query: string): string {
  let text = query;

  text = normalizeUnicode(text);
  text = normalizeCase(text);
  text = normalizePunctuation(text);
  text = normalizeWhitespace(text);
  text = removeSearchNoise(text);
  text = normalizeNumbers(text);
  text = normalizeWhitespace(text);

  return text.trim();
}

/**
 * Normalize repeated whitespace and trim the text.
 *
 * Example:
 * "  AC   repair   in   Hakimpara  "
 * → "AC repair in Hakimpara"
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Normalize text to lowercase.
 *
 * Example:
 * "AC REPAIR Siliguri"
 * → "ac repair siliguri"
 */
export function normalizeCase(text: string): string {
  return text.toLocaleLowerCase('en-IN');
}

/**
 * Normalize punctuation that usually has no search meaning.
 *
 * We preserve characters that can be meaningful in search:
 * - +
 * - #
 * - -
 * - /
 *
 * Examples:
 * "AC Repair, Hakimpara!"
 * → "AC Repair Hakimpara"
 *
 * "C++ developer"
 * → "C++ developer"
 */
export function normalizePunctuation(text: string): string {
  return text
    .replace(/[.,!?;:()[\]{}'"`~^*=<>|\\]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/@/g, ' at ');
}

/**
 * Normalize Unicode characters.
 *
 * NFKC handles compatibility characters and keeps normal
 * Unicode text intact.
 *
 * Example:
 * "ＡＣ Ｒｅｐａｉｒ"
 * → "AC Repair"
 */
export function normalizeUnicode(text: string): string {
  return text.normalize('NFKC');
}

/**
 * Remove search noise without removing words that may be
 * important to the query parser.
 *
 * Important:
 * Do NOT remove words such as:
 * - in
 * - near
 * - around
 * - best
 * - open
 * - today
 *
 * The parser may need these later to detect intent/location.
 */
export function removeSearchNoise(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Normalize numbers in search text.
 *
 * Currently this intentionally does NOT convert numbers to words
 * or remove them because numbers can represent:
 *
 * - phone numbers
 * - prices
 * - years
 * - ratings
 * - addresses
 * - pincode
 * - distances
 *
 * It only normalizes common numeric separators.
 *
 * Example:
 * "AC service 24/7"
 * → "AC service 24/7"
 *
 * "₹ 1,500"
 * → "₹ 1500"
 */
export function normalizeNumbers(text: string): string {
  return text.replace(/(?<=\d)[,\s](?=\d)/g, '').replace(/₹\s+/g, '₹');
}

/**
 * Normalize a phone number.
 *
 * This is intended for phone-number matching, not general
 * search-query normalization.
 *
 * Examples:
 * "+91 97329 39123"
 * → "919732939123"
 *
 * "09732939123"
 * → "919732939123"
 *
 * "9732939123"
 * → "919732939123"
 *
 * Invalid/unknown formats are returned as digits only.
 */
export function normalizePhoneNumber(text: string): string {
  let digits = text.replace(/\D/g, '');

  // Indian international format: 91XXXXXXXXXX
  if (digits.startsWith('91') && digits.length === 12) {
    return digits;
  }

  // Indian domestic format with leading zero.
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }

  // Indian 10-digit mobile number.
  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
}

/**
 * Normalize location text.
 *
 * Location names need slightly different treatment from
 * general search queries.
 *
 * Examples:
 * "  Hakim Para, Siliguri "
 * → "hakim para siliguri"
 *
 * "Siliguri-West Bengal"
 * → "siliguri west bengal"
 */
export function normalizeLocationText(text: string): string {
  let value = text;

  value = normalizeUnicode(value);
  value = normalizeCase(value);
  value = normalizePunctuation(value);
  value = normalizeWhitespace(value);

  return value;
}

/**
 * Normalize a business/concept/category phrase.
 *
 * Examples:
 * "  AC Repair & Service "
 * → "ac repair and service"
 *
 * "Mobile-Phone Repair"
 * → "mobile phone repair"
 */
export function normalizeConceptText(text: string): string {
  let value = text;

  value = normalizeUnicode(value);
  value = normalizeCase(value);
  value = normalizePunctuation(value);
  value = normalizeWhitespace(value);

  return value;
}
