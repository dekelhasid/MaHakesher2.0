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

$('#refresh-feedback')?.addEventListener('click', loadFeedback);
if (firebaseConfigured) observeAuth(user => { if (isAdmin(user)) void loadFeedback(); });
