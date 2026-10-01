/**
 * Ukrywa tresc komentarzy, zachowujac konce linii oraz literaly tekstowe.
 * Dzieki temu audyty zachowuja numery linii i nie traktuja dokumentacji jak kodu.
 */
export function maskSourceComments(source: string): string {
  let result = '';
  let state: 'code' | 'single' | 'double' | 'template' | 'line' | 'block' | 'html' = 'code';
  let escaped = false;

  const appendMasked = (character: string) => {
    result += character === '\n' ? '\n' : ' ';
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1] ?? '';
    const htmlCommentStart = source.slice(index, index + 4) === '<!--';
    const htmlCommentEnd = source.slice(index, index + 3) === '-->';

    if (state === 'line') {
      appendMasked(character);
      if (character === '\n') state = 'code';
      continue;
    }

    if (state === 'block') {
      if (character === '*' && next === '/') {
        appendMasked(character);
        appendMasked(next);
        index += 1;
        state = 'code';
      } else {
        appendMasked(character);
      }
      continue;
    }

    if (state === 'html') {
      if (htmlCommentEnd) {
        appendMasked(character);
        appendMasked(next);
        appendMasked(source[index + 2] ?? '');
        index += 2;
        state = 'code';
      } else {
        appendMasked(character);
      }
      continue;
    }

    if (state === 'single' || state === 'double' || state === 'template') {
      result += character;
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (
        (state === 'single' && character === "'")
        || (state === 'double' && character === '"')
        || (state === 'template' && character === '`')
      ) {
        state = 'code';
      }
      continue;
    }

    if (htmlCommentStart) {
      appendMasked(character);
      appendMasked(next);
      appendMasked(source[index + 2] ?? '');
      appendMasked(source[index + 3] ?? '');
      index += 3;
      state = 'html';
      continue;
    }

    if (character === '/' && next === '/') {
      appendMasked(character);
      appendMasked(next);
      index += 1;
      state = 'line';
      continue;
    }

    if (character === '/' && next === '*') {
      appendMasked(character);
      appendMasked(next);
      index += 1;
      state = 'block';
      continue;
    }

    result += character;
    if (character === "'") state = 'single';
    if (character === '"') state = 'double';
    if (character === '`') state = 'template';
  }

  return result;
}
