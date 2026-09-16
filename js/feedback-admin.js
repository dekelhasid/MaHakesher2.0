import { firebaseConfigured, observeAuth, read, patch } from './firebase.js';

const ADMIN_EMAIL = 'admin@mahakesher2nekuda0.com';
const $ = selector => document.querySelector(selector);
const isAdmin = user => user?.email?.toLowerCase() === ADMIN_EMAIL;
const dateText = value => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(date); };
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));

async function markRead(id) { try { await patch(`feedback/${id}`, { read: true, readAt: new Date().toISOString() }); await loadFeedback(); } catch { alert('לא הצלחנו לסמן את המשוב כנקרא.'); } }
async function loadFeedback() {
  const target = $('#feedback-library'); const count = $('#feedback-count'); if (!target || !firebaseConfigured) return;
  target.replaceChildren();
  try {
    const entries = Object.entries((await read('feedback')) || {}).map(([id, item]) => ({ id, ...item })).sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));
    const unread = entries.filter(item => !item.read).length;
    count.textContent = unread ? `${unread} חדשים` : 'אין חדשים';
    if (!entries.length) { target.innerHTML = '<p class="empty">עדיין לא התקבל משוב.</p>'; return; }
    entries.forEach(item => {
      const card = document.createElement('article'); card.className = 'puzzle-item feedback-item';
      const name = item.playerName?.trim() || 'אורח/ת';
      const outcome = item.solved ? 'נפתרה' : 'נחשף פתרון';
      card.innerHTML = `<div><h3>${escapeHtml(name)}${item.read ? '' : ' <span class="feedback-new">חדש</span>'}</h3><p>חידה ${escapeHtml(item.puzzleNumber)} · ${escapeHtml(item.puzzleTitle)} · ${outcome} · ${escapeHtml(dateText(item.submittedAt))}</p><p class="feedback-message">${escapeHtml(item.message)}</p></div>`;
      if (!item.read) { const button = document.createElement('button'); button.className = 'secondary'; button.type = 'button'; button.textContent = 'סימון כנקרא'; button.addEventListener('click', () => markRead(item.id)); card.append(button); }
      target.append(card);
    });
  } catch { target.innerHTML = '<p class="empty">לא ניתן לטעון משובים. בדקו את כללי Firebase.</p>'; }
}

async function loadResults() {
  const target = $('#results-library');
  if (!target || !firebaseConfigured) return;
  target.replaceChildren();
  try {
    const puzzleById = (await read('puzzles')) || {};
    const groups = await Promise.all(Object.entries(puzzleById).map(async ([puzzleId, puzzle]) => {
      const results = await read(`stats/${puzzleId}`);
      const entries = Object.values(results || {})
        .filter(item => item?.finished && item.playerKind === 'named' && item.playerName?.trim())
        .sort((a, b) => String(b.finishedAt || '').localeCompare(String(a.finishedAt || '')));
      return { puzzleId, number: Number(puzzle.number || 0), title: puzzle.title || 'חידה ללא כותרת', entries };
    }));
    const visibleGroups = groups.filter(group => group.entries.length).sort((a, b) => a.number - b.number || a.puzzleId.localeCompare(b.puzzleId));
    if (!visibleGroups.length) { target.innerHTML = '<p class="empty">עדיין אין תוצאות של שחקנים בעלי שם.</p>'; return; }
    visibleGroups.forEach(group => {
      const card = document.createElement('article'); card.className = 'puzzle-item results-puzzle';
      const heading = document.createElement('h3'); heading.textContent = `${group.number ? `חידה ${group.number} · ` : ''}${group.title}`; card.append(heading);
      const summary = document.createElement('p'); summary.className = 'result-summary'; summary.textContent = `${group.entries.length} ניסיונות עם שם`; card.append(summary);
      const attempts = document.createElement('div'); attempts.className = 'result-attempts';
      group.entries.forEach(item => {
        const row = document.createElement('div'); row.className = `result-item ${item.solved ? 'solved' : 'failed'}`;
        const name = document.createElement('p'); name.className = 'result-name'; name.textContent = item.playerName.trim(); row.append(name);
        const outcome = document.createElement('p'); outcome.className = `result-result ${item.solved ? 'solved' : 'failed'}`; outcome.textContent = `${Number(item.mistakes || 0)} טעויות`; row.append(outcome);
        attempts.append(row);
      });
      card.append(attempts);
      target.append(card);
    });
  } catch {
    target.innerHTML = '<p class="empty">לא ניתן לטעון תוצאות. בדקו את כללי Firebase.</p>';
  }
}

$('#refresh-feedback')?.addEventListener('click', loadFeedback);
$('#refresh-results')?.addEventListener('click', loadResults);
if (firebaseConfigured) observeAuth(user => { if (isAdmin(user)) { void loadFeedback(); void loadResults(); } });
