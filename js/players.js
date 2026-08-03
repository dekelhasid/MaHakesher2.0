import { firebaseConfigured, read, write } from './firebase.js';

const KEY = 'mahakesher.player';
export function getPlayer() { try { return JSON.parse(localStorage.getItem(KEY)) || { kind: 'unknown', name: '' }; } catch { return { kind: 'unknown', name: '' }; } }
export function setPlayer(player) { localStorage.setItem(KEY, JSON.stringify(player)); return player; }
export function playerKey(name) { return encodeURIComponent(name.trim().toLocaleLowerCase('he')).replace(/%/g, '_'); }
export async function findPlayer(name) {
  if (!name?.trim()) return null;
  const key = playerKey(name);
  if (!firebaseConfigured) { try { return JSON.parse(localStorage.getItem(`mahakesher.player.${key}`) || 'null'); } catch { return null; } }
  try { return await read(`players/${key}`); } catch { return null; }
}
export async function recordPlayerFinish(player, gameId, result) {
  if (player.kind !== 'named') return;
  const key = playerKey(player.name); const existing = (await findPlayer(player.name)) || { name: player.name, games: {}, createdAt: new Date().toISOString() };
  const wasPlayed = existing.games?.[gameId];
  const next = { ...existing, name: player.name, lastPlayedAt: new Date().toISOString(), games: { ...(existing.games || {}), [gameId]: result } };
  if (!wasPlayed) {
    next.streak = calculateStreak(next.games);
    if (firebaseConfigured) { try { await write(`players/${key}`, next); } catch (error) { console.warn('Could not save player.', error); } }
    else localStorage.setItem(`mahakesher.player.${key}`, JSON.stringify(next));
  }
  return !wasPlayed;
}
function calculateStreak(games) { const chronological = Object.entries(games).sort(([a], [b]) => a.localeCompare(b)); let streak = 0; for (const [, game] of chronological) streak = game.solved ? streak + 1 : 0; return streak; }
