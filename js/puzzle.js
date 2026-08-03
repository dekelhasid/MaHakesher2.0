export const COLORS = ['#a6d883', '#8dd4ee', '#b897df', '#f4d378'];
export const CURRENT_PUZZLE = {
  id: '2026-08-03', title: 'מה הקשר?', createdAt: '2026-08-03T00:00:00.000Z', status: 'published', hint: { words: ['ג׳אז', 'רחם'] },
  groups: [
    { title: 'אפשר למצוא שם חצוצרה', color: COLORS[0], words: ['ג׳אז', 'רחם', 'להקת מריאצ׳י', 'תזמורת צה״ל'] },
    { title: 'דגמי מכוניות בישראל', color: COLORS[1], words: ['פוקוס', 'אקורד', 'גולף', 'סונטה'] },
    { title: 'הגדרות במצלמה', color: COLORS[2], words: ['ISO', 'פלאש', 'צמצם', 'זום'] },
    { title: 'תוכנות היסטוריות לשיתוף ולצ׳אט', color: COLORS[3], words: ['טנגו', 'סקייפ', 'ICQ', 'וייבר'] }
  ]
};
export function validatePuzzle(puzzle) {
  if (!puzzle?.title?.trim() || !Array.isArray(puzzle.groups) || puzzle.groups.length !== 4) return 'חידה חייבת לכלול כותרת וארבע קבוצות.';
  const words = puzzle.groups.flatMap(group => group.words || []);
  if (words.length !== 16 || words.some(word => !String(word).trim())) return 'כל קבוצה חייבת לכלול ארבע מילים.';
  const unique = new Set(words.map(word => String(word).trim().toLocaleLowerCase('he')));
  if (unique.size !== 16) return 'כל מילה בחידה חייבת להיות ייחודית.';
  if (puzzle.groups.some(group => !group.title?.trim())) return 'לכל קבוצה דרוש שם.';
  const hintWords = puzzle.hint?.words;
  if (hintWords) {
    if (!Array.isArray(hintWords) || hintWords.length !== 2 || hintWords.some(word => !String(word).trim())) return 'רמז חייב לכלול שתי מילים.';
    const normalized = hintWords.map(word => String(word).trim().toLocaleLowerCase('he'));
    if (normalized[0] === normalized[1]) return 'שתי מילות הרמז חייבות להיות שונות.';
    const matchingGroup = puzzle.groups.find(group => group.words.map(word => String(word).trim().toLocaleLowerCase('he')).includes(normalized[0]) && group.words.map(word => String(word).trim().toLocaleLowerCase('he')).includes(normalized[1]));
    if (!matchingGroup) return 'שתי מילות הרמז חייבות להיות שתי מילים מאותה קבוצה.';
  }
  return null;
}
export function scramble(items) { const next = [...items]; for (let index = next.length - 1; index > 0; index -= 1) { const target = Math.floor(Math.random() * (index + 1)); [next[index], next[target]] = [next[target], next[index]]; } return next; }
