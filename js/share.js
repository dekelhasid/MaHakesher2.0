export async function shareResult({ title, mistakes, solved }) {
  const text = solved ? `מה הקשר? — פתרתי עם ${mistakes} טעויות 🟩` : 'מה הקשר? — לא הצלחתי, תנסו אתם 🟨';
  const payload = { title, text, url: location.href };
  if (navigator.share) { await navigator.share(payload); return 'נפתח חלון שיתוף.'; }
  await navigator.clipboard.writeText(`${text}\n${location.href}`); return 'תוצאת המשחק הועתקה ללוח.';
}
