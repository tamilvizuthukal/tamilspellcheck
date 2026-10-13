/**
 * Tamil Typography & Punctuation Auto-Formatter
 * 
 * Rules enforced:
 * 1. Spaces after . and , when attached to following words (preserving numbers like 3.14, 1,000).
 * 2. Proper spacing for single (') and double (") quotes (opening, closing, inner margins).
 * 3. Elimination of double/multiple horizontal spaces.
 * 4. Elimination of unnecessary consecutive blank lines (max 2 line breaks).
 * 5. Elimination of spaces before punctuation marks (. , ; : ! ?).
 */

export interface FormatResult {
  formatted: string;
  hasChanges: boolean;
  changes: string[];
}

export function autoFormatTamilTypography(text: string): FormatResult {
  if (!text) {
    return { formatted: text, hasChanges: false, changes: [] };
  }

  const changes: string[] = [];
  let result = text;

  // 1. Remove trailing spaces on lines
  const noTrailing = result.replace(/[ \t]+$/gm, '');
  if (noTrailing !== result) {
    result = noTrailing;
    changes.push('வரிகளின் இறுதியிலுள்ள இடைவெளிகள் நீக்கப்பட்டன');
  }

  // 2. Reduce 3+ consecutive newlines to 2 (single blank line)
  const normalizedNewlines = result.replace(/\n{3,}/g, '\n\n');
  if (normalizedNewlines !== result) {
    result = normalizedNewlines;
    changes.push('தேவையற்ற அதிகப்படியான வரி இடைவெளிகள் நீக்கப்பட்டன');
  }

  // 3. Remove spaces before punctuation marks (. , ; : ! ?)
  // e.g. "வணக்கம் ," -> "வணக்கம்," or "முடிந்தது ." -> "முடிந்தது."
  const noSpaceBeforePunct = result.replace(/[ \t]+([,.;:!?])/g, '$1');
  if (noSpaceBeforePunct !== result) {
    result = noSpaceBeforePunct;
    changes.push('புள்ளி மற்றும் காற்புள்ளிக்கு முன்னிருந்த தவறான இடைவெளி நீக்கப்பட்டது');
  }

  // 4. Ensure space after comma (,) when immediately followed by a word (Tamil or English)
  // Protect numbers like 1,000 or 2,500
  const fixedCommas = result.replace(/,(?=[A-Za-z\u0B80-\u0BFF"'“‘])/g, ', ');
  if (fixedCommas !== result) {
    result = fixedCommas;
    changes.push('காற்புள்ளிக்கு (,) பின் இடைவெளி சேர்க்கப்பட்டது');
  }

  // 5. Ensure space after period (.) when immediately followed by a word (Tamil or English)
  // Avoid breaking:
  // - Decimal numbers: 3.14
  // - Ellipsis: ...
  let fixedPeriods = result;

  // 5a. Fix ellipsis followed by letter: "...அவர்" -> "... அவர்"
  fixedPeriods = fixedPeriods.replace(/(\.{2,})([A-Za-z\u0B80-\u0BFF"'“‘])/g, '$1 $2');

  // 5b. Fix single period followed by letter, excluding decimals or multiple dots:
  fixedPeriods = fixedPeriods.replace(/(?<![\.\d])\.(?![.\d\s])([A-Za-z\u0B80-\u0BFF"'“‘])/g, '. $1');

  // 5c. Digit followed by dot followed by letter (e.g. "1.வினா" -> "1. வினா")
  fixedPeriods = fixedPeriods.replace(/(\d)\.(?=[A-Za-z\u0B80-\u0BFF])/g, '$1. ');

  if (fixedPeriods !== result) {
    result = fixedPeriods;
    changes.push('முற்றுப்புள்ளிக்கு (.) பின் இடைவெளி சேர்க்கப்பட்டது');
  }

  // 6. Ensure space after semicolons, colons, question marks, and exclamation marks
  const fixedOtherPunct = result.replace(/([;:!?])(?=[A-Za-z\u0B80-\u0BFF"'“‘])/g, '$1 ');
  if (fixedOtherPunct !== result) {
    result = fixedOtherPunct;
    changes.push('நிறுத்தற்குறிகளுக்கு பின் இடைவெளி சேர்க்கப்பட்டது');
  }

  // 7. Fix Quotes (' and " and “ ” and ‘ ’)
  // Cleanly format pairs: trim inside, ensure space before opening if attached to a word,
  // ensure space after closing if attached to a word (unless followed by punctuation).
  let fixedQuotes = result;

  const wordCharRegex = /[A-Za-z0-9\u0B80-\u0BFF]/;

  // 7a. Double straight quotes: "..."
  fixedQuotes = fixedQuotes.replace(/"([^"\n]+)"/g, (match, inner, offset, fullText) => {
    const trimmedInner = inner.trim();
    const charBefore = offset > 0 ? fullText[offset - 1] : '';
    const charAfter = offset + match.length < fullText.length ? fullText[offset + match.length] : '';

    const prefix = (charBefore && wordCharRegex.test(charBefore)) ? ' ' : '';
    const suffix = (charAfter && wordCharRegex.test(charAfter)) ? ' ' : '';

    return `${prefix}"${trimmedInner}"${suffix}`;
  });

  // 7b. Curly double quotes: “...”
  fixedQuotes = fixedQuotes.replace(/“([^”\n]+)”/g, (match, inner, offset, fullText) => {
    const trimmedInner = inner.trim();
    const charBefore = offset > 0 ? fullText[offset - 1] : '';
    const charAfter = offset + match.length < fullText.length ? fullText[offset + match.length] : '';

    const prefix = (charBefore && wordCharRegex.test(charBefore)) ? ' ' : '';
    const suffix = (charAfter && wordCharRegex.test(charAfter)) ? ' ' : '';

    return `${prefix}“${trimmedInner}”${suffix}`;
  });

  // 7c. Single straight quotes: '...'
  fixedQuotes = fixedQuotes.replace(/'([^'\n]+)'/g, (match, inner, offset, fullText) => {
    // Skip English single-character contractions (e.g. don't, it's)
    if (/^[a-zA-Z]$/.test(inner)) return match;

    const trimmedInner = inner.trim();
    const charBefore = offset > 0 ? fullText[offset - 1] : '';
    const charAfter = offset + match.length < fullText.length ? fullText[offset + match.length] : '';

    const prefix = (charBefore && wordCharRegex.test(charBefore)) ? ' ' : '';
    const suffix = (charAfter && wordCharRegex.test(charAfter)) ? ' ' : '';

    return `${prefix}'${trimmedInner}'${suffix}`;
  });

  // 7d. Curly single quotes: ‘...’
  fixedQuotes = fixedQuotes.replace(/‘([^’\n]+)’/g, (match, inner, offset, fullText) => {
    const trimmedInner = inner.trim();
    const charBefore = offset > 0 ? fullText[offset - 1] : '';
    const charAfter = offset + match.length < fullText.length ? fullText[offset + match.length] : '';

    const prefix = (charBefore && wordCharRegex.test(charBefore)) ? ' ' : '';
    const suffix = (charAfter && wordCharRegex.test(charAfter)) ? ' ' : '';

    return `${prefix}‘${trimmedInner}’${suffix}`;
  });

  // 7e. If closing quote is followed by punctuation with extra space:
  // e.g. "வணக்கம்" , -> "வணக்கம்",
  fixedQuotes = fixedQuotes.replace(/(["”'’])[ \t]+([,.;:!?])/g, '$1$2');

  if (fixedQuotes !== result) {
    result = fixedQuotes;
    changes.push('மேற்கோள் குறிகளின் (\' மற்றும் ") இடைவெளிகள் சீரமைக்கப்பட்டன');
  }

  // 8. Collapse 2 or more horizontal spaces into a single space
  // Preserving \n and \t
  const collapsedSpaces = result.replace(/[ ]{2,}/g, ' ');
  if (collapsedSpaces !== result) {
    result = collapsedSpaces;
    changes.push('தேவையற்ற இரட்டை இடைவெளிகள் (Double spaces) நீக்கப்பட்டன');
  }

  return {
    formatted: result,
    hasChanges: result !== text,
    changes
  };
}
