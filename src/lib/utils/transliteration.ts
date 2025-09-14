const translitMap: { [key: string]: string } = {
    'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'e': 'е', 'yo': 'ё', 'zh': 'ж',
    'z': 'з', 'i': 'и', 'j': 'й', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о',
    'p': 'п', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'f': 'ф', 'h': 'х', 'c': 'ц',
    'ch': 'ч', 'sh': 'ш', 'shch': 'щ', '"': 'ъ', 'y': 'ы', "'": 'ь', 'yu': 'ю',
    'ya': 'я',
    'A': 'А', 'B': 'Б', 'V': 'В', 'G': 'Г', 'D': 'Д', 'E': 'Е', 'YO': 'Ё', 'ZH': 'Ж',
    'Z': 'З', 'I': 'И', 'J': 'Й', 'K': 'К', 'L': 'Л', 'M': 'М', 'N': 'Н', 'O': 'О',
    'P': 'П', 'R': 'Р', 'S': 'С', 'T': 'Т', 'U': 'У', 'F': 'Ф', 'H': 'Х', 'C': 'Ц',
    'CH': 'Ч', 'SH': 'Ш', 'SHCH': 'Щ', '': 'Ъ', 'Y': 'Ы', '': 'Ь', 'YU': 'Ю',
    'YA': 'Я'
};

// Список ключей, которые состоят из нескольких символов, отсортированный по убыванию длины.
// Это важно для правильного парсинга: сначала ищем 'shch', а только потом 'sh'
const complexKeys = ['shch', 'yo', 'zh', 'ch', 'sh', 'yu', 'ya'];

export function transliterate(text: string): string {
  let result = '';
  let i = 0;
  while (i < text.length) {
    let consumed = false;

    // Сначала ищем совпадения с многосимвольными ключами
    for (const key of complexKeys) {
      if (text.substring(i, i + key.length).toLowerCase() === key) {
        const originalCaseKey = text.substring(i, i + key.length);
        result += translitMap[originalCaseKey] || translitMap[originalCaseKey.toLowerCase()];
        i += key.length;
        consumed = true;
        break;
      }
    }

    if (consumed) {
      continue;
    }

    // Если совпадений не найдено, обрабатываем как один символ
    const char = text[i];
    result += translitMap[char] || char; // Если для символа нет транслитерации, оставляем его как есть
    i++;
  }
  return result;
}