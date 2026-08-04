import { firebaseConfigured, ensureSignedIn, read } from './firebase.js';
import { CURRENT_PUZZLE, scramble, validatePuzzle } from './puzzle.js';
import { getPlayer, setPlayer, findPlayer, recordPlayerFinish } from './players.js';
import { getStats, recordResult } from './stats.js';
import { openDialog, showMessage } from './dialogs.js';
import { highlight, shake } from './animations.js';
import { shareResult } from './share.js';

const MAX_MISTAKES = 5;
const state = { puzzle: null, words: [], selected: new Set(), solved: [], revealAnswers: false, mistakes: 0, attempts: new Set(), finished: false, saved: false, player: getPlayer() };
const $ = selector => document.querySelector(selector);
let currentGameId = null;

async function loadPuzzle(requestedId = null) {
  let puzzle = null; let gameId = requestedId;
  if (firebaseConfigured) {
    try { await ensureSignedIn(); currentGameId = await read('games/currentGameId'); gameId ||= currentGameId; if (gameId) puzzle = await read(`puzzles/${gameId}`); } catch (error) { console.warn('Could not load Firebase puzzle.', error); }
  }
  state.puzzle = validatePuzzle(puzzle) ? CURRENT_PUZZLE : puzzle;
  state.words = scramble(state.puzzle.groups.flatMap((group, groupIndex) => group.words.map((word, wordIndex) => ({ word, groupIndex, id: `${groupIndex}-${wordIndex}` }))));
  state.selected.clear(); state.solved = []; state.revealAnswers = false; state.mistakes = 0; state.attempts.clear(); state.finished = false; state.saved = false; $('#result-panel').hidden = true;
  $('#puzzle-title').textContent = state.puzzle.title;
  $('#puzzle-number').textContent = state.puzzle.number ? `חידה ${state.puzzle.number}` : state.puzzle.id === CURRENT_PUZZLE.id ? 'חידת הבכורה' : 'חידה';
  $('#connection-status').textContent = firebaseConfigured ? 'מחובר ל־Firebase' : 'מצב מקומי';
  setStatus('בחרו ארבע מילים שיש ביניהן קשר.'); render(); await renderArchive();
}
function puzzleLabel(puzzle) { return puzzle.number ? `חידה ${puzzle.number}` : 'חידה בארכיון'; }
async function renderArchive() { const section = $('#archive-section'); const list = $('#archive-list'); list.replaceChildren(); if (!firebaseConfigured || !currentGameId) { section.hidden = true; return; } try { const puzzles = Object.values((await read('puzzles')) || {}); if (state.puzzle.id !== currentGameId) { const current = puzzles.find(puzzle => puzzle.id === currentGameId); if (current) list.append(itemButton(`חזרה ל־${puzzleLabel(current)}`, () => loadPuzzle())); } const archived = puzzles.filter(puzzle => puzzle.id !== currentGameId && puzzle.id !== state.puzzle.id).sort((a, b) => Number(a.number || 0) - Number(b.number || 0)); archived.forEach(puzzle => list.append(itemButton(`${puzzleLabel(puzzle)} — ${puzzle.title}`, () => loadPuzzle(puzzle.id)))); section.hidden = !list.children.length; } catch (error) { console.warn('Could not load archive.', error); section.hidden = true; } }
function itemButton(label, handler) { const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary'; button.textContent = label; button.addEventListener('click', handler); return button; }
function render() {
  const board = $('#board'); board.replaceChildren();
  state.words.filter(tile => !state.revealAnswers && !state.solved.includes(tile.groupIndex)).forEach(tile => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'tile'; button.dataset.id = tile.id; button.textContent = tile.word;
    button.setAttribute('aria-pressed', String(state.selected.has(tile.id))); button.addEventListener('click', () => toggleTile(tile.id)); board.append(button);
  });
  const solvedRows = $('#solved-rows'); solvedRows.replaceChildren(); const visibleGroups = state.revealAnswers ? state.puzzle.groups.map((_, index) => index) : state.solved; visibleGroups.forEach(groupIndex => {
    const group = state.puzzle.groups[groupIndex]; const row = document.createElement('article'); row.className = 'solved-row'; row.style.background = group.color; row.innerHTML = `<h2>${escapeHtml(group.title)}</h2><div class="words">${group.words.map(escapeHtml).join(' · ')}</div>`; solvedRows.append(row);
  });
  const pips = $('#mistakes'); pips.replaceChildren(); for (let index = 0; index < MAX_MISTAKES; index += 1) { const pip = document.createElement('i'); pip.className = `pip ${index < state.mistakes ? 'used' : ''}`; pips.append(pip); }
  $('#submit-button').disabled = state.selected.size !== 4 || state.finished;
  $('#clear-button').disabled = !state.selected.size || state.finished;
  const hint = configuredHint(); $('#hint-button').disabled = state.finished || !hint || state.solved.includes(hint.groupIndex);
  $('#shuffle-button').disabled = state.finished;
}
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function setStatus(message, error = false) { const element = $('#game-status'); element.textContent = message; element.classList.toggle('error', error); }
function configuredHint() { const words = state.puzzle?.hint?.words?.map(word => String(word).trim()).filter(Boolean); const normalize = word => word.toLocaleLowerCase('he'); if (!words || words.length !== 2 || normalize(words[0]) === normalize(words[1])) return null; const groupIndex = state.puzzle.groups.findIndex(group => words.every(word => group.words.some(candidate => normalize(candidate) === normalize(word)))); if (groupIndex < 0) return null; return { words: words.map(word => state.puzzle.groups[groupIndex].words.find(candidate => normalize(candidate) === normalize(word))), groupIndex }; }
function toggleTile(id) { if (state.finished) return; if (state.selected.has(id)) state.selected.delete(id); else if (state.selected.size < 4) state.selected.add(id); else { setStatus('אפשר לבחור עד ארבע מילים.', true); return; } setStatus(state.selected.size === 4 ? 'מוכנים? שלחו את הבחירה.' : 'בחרו ארבע מילים שיש ביניהן קשר.'); render(); }
function selectionKey(selected) { return [...selected].sort().join('|'); }
function submit() {
  if (state.selected.size !== 4 || state.finished) return;
  const selected = state.words.filter(tile => state.selected.has(tile.id)); const key = selectionKey(state.selected);
  const matched = state.puzzle.groups.findIndex((group, groupIndex) => !state.solved.includes(groupIndex) && selected.every(tile => group.words.includes(tile.word)));
  if (matched >= 0) { state.solved.push(matched); state.selected.clear(); setStatus('נכון! מצאתם קבוצה.'); render(); if (state.solved.length === 4) finish(true); return; }
  if (state.attempts.has(key)) { setStatus('כבר ניסיתם את הרביעייה הזאת.', true); return; }
  state.attempts.add(key); const largestMatch = Math.max(...state.puzzle.groups.filter((_, index) => !state.solved.includes(index)).map(group => selected.filter(tile => group.words.includes(tile.word)).length));
  state.mistakes += 1; setStatus(largestMatch === 3 ? 'כמעט, שלוש מארבע.' : 'לא נכון.', true); document.querySelectorAll('.tile[aria-pressed="true"]').forEach(shake); state.selected.clear(); render(); if (state.mistakes >= MAX_MISTAKES) finish(false);
}
function shuffleBoard() { if (state.finished) return; state.words = scramble(state.words); state.selected.clear(); setStatus('המילים עורבבו.'); render(); }
function clearSelection() { state.selected.clear(); setStatus('הבחירה נוקתה.'); render(); }
function giveHint() {
  if (state.finished) return;
  const hint = configuredHint(); if (!hint || state.solved.includes(hint.groupIndex)) { setStatus('הרמז אינו זמין, כי הרביעייה שלו כבר נפתרה.'); render(); return; }
  const pair = hint.words.map(word => state.words.find(tile => tile.groupIndex === hint.groupIndex && tile.word === word)).filter(Boolean);
  state.selected.clear(); pair.forEach(tile => state.selected.add(tile.id)); render();
  pair.forEach(tile => highlight(document.querySelector(`[data-id="${tile.id}"]`)));
  setStatus('הרמז סימן שתי מילים. אפשר להוסיף עוד שתיים ולשלוח את הבחירה.');
}
async function finish(solved) {
  state.finished = true; state.revealAnswers = !solved; render(); const player = state.player; const result = { finished: true, solved, mistakes: state.mistakes, playerKind: player.kind, playerName: player.name || null, finishedAt: new Date().toISOString(), sessionId: resultId() };
  const newlyRecorded = await recordPlayerFinish(player, state.puzzle.id, result); if (newlyRecorded) await recordResult(state.puzzle.id, result); state.saved = true;
  $('#result-panel').hidden = false; $('#result-title').textContent = solved ? 'כל הכבוד!' : 'לא הפעם'; $('#result-copy').textContent = solved ? `פתרתם את החידה עם ${state.mistakes} טעויות.` : 'לא הצלחתם הפעם. הפתרון המלא מוצג למעלה.'; setStatus(solved ? 'החידה נפתרה.' : 'החידה הסתיימה והפתרון מוצג.', !solved);
}
function resultId() { return `${state.puzzle.id}-${state.player.kind === 'named' ? encodeURIComponent(state.player.name) : crypto.randomUUID?.() || Date.now()}`; }
function resetGame() { state.words = scramble(state.puzzle.groups.flatMap((group, groupIndex) => group.words.map((word, wordIndex) => ({ word, groupIndex, id: `${groupIndex}-${wordIndex}` })))); state.selected.clear(); state.solved = []; state.revealAnswers = false; state.mistakes = 0; state.attempts.clear(); state.finished = false; state.saved = false; $('#result-panel').hidden = true; setStatus('בחרו ארבע מילים שיש ביניהן קשר.'); render(); }
async function renderStats() { const stats = await getStats(state.puzzle.id); $('#stats-content').replaceChildren(); const total = document.createElement('p'); total.textContent = stats.total ? `${stats.total} שחקנים ושחקניות סיימו את החידה.` : 'עדיין אין תוצאות של שחקנים מזוהים.'; $('#stats-content').append(total); stats.rows.forEach(row => { const element = document.createElement('div'); element.className = 'stat-row'; element.innerHTML = `<span>${row.label}</span><span class="bar"><i style="width:${row.percent}%"></i></span><strong>${row.percent}%</strong>`; $('#stats-content').append(element); }); openDialog('#stats-dialog'); }
async function savePlayerFromDialog(event) { event.preventDefault(); const action = event.submitter?.value; if (action === 'guest') { state.player = setPlayer({ kind: 'guest', name: '' }); $('#player-dialog').close(); setStatus('ממשיכים כאורח/ת.'); return; }
  const name = $('#player-name').value.trim(); if (!name) { showMessage('חסר שם', 'אפשר לכתוב שם או לבחור בהמשך כאורח/ת.'); return; } state.player = setPlayer({ kind: 'named', name }); $('#player-dialog').close(); setStatus(`שלום ${name}, בהצלחה!`);
}
let nameCheck;
function checkKnownName() { clearTimeout(nameCheck); nameCheck = setTimeout(async () => { const name = $('#player-name').value.trim(); const existing = await findPlayer(name); $('#known-player-question').classList.toggle('hidden', !existing); $('#known-player-name').textContent = existing?.name || ''; }, 400); }
function configurePlayerDialog() { const player = state.player; $('#player-name').value = player.kind === 'named' ? player.name : ''; $('#rename-player').hidden = player.kind !== 'named'; $('#rename-player').onclick = () => { $('#player-name').value = ''; $('#player-name').focus(); }; $('#known-player-question').classList.add('hidden'); openDialog('#player-dialog'); }
function bind() { $('#submit-button').addEventListener('click', submit); $('#shuffle-button').addEventListener('click', shuffleBoard); $('#clear-button').addEventListener('click', clearSelection); $('#hint-button').addEventListener('click', giveHint); $('#new-game-button').addEventListener('click', resetGame); $('#share-button').addEventListener('click', async () => { try { showMessage('שיתוף', await shareResult({ title: state.puzzle.title, mistakes: state.mistakes, solved: state.solved.length === 4 })); } catch (error) { if (error.name !== 'AbortError') showMessage('שיתוף', 'לא הצלחנו לשתף כרגע.'); } }); $('#stats-button').addEventListener('click', renderStats); $('#player-button').addEventListener('click', configurePlayerDialog); $('#player-form').addEventListener('submit', savePlayerFromDialog); $('#player-name').addEventListener('input', checkKnownName); }
async function init() { bind(); await loadPuzzle(); if (state.player.kind === 'unknown') configurePlayerDialog(); }
init();
