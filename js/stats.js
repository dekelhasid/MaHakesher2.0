import { firebaseConfigured, read, write } from './firebase.js';
const statsKey = id => `mahakesher.stats.${id}`;
export async function recordResult(gameId, result) {
  const local = JSON.parse(localStorage.getItem(statsKey(gameId)) || '[]');
  local.push(result); localStorage.setItem(statsKey(gameId), JSON.stringify(local));
  if (firebaseConfigured) { try { await write(`stats/${gameId}/${result.sessionId}`, result); } catch (error) { console.warn('Could not update statistics.', error); } }
}
export async function getStats(gameId) {
  let results = JSON.parse(localStorage.getItem(statsKey(gameId)) || '[]');
  if (firebaseConfigured) { try { const cloud = await read(`stats/${gameId}`); if (cloud) results = Object.values(cloud); } catch (error) { console.warn('Could not load statistics.', error); } }
  const eligible = results.filter(result => result.finished && result.playerKind === 'named');
  const total = eligible.length; const buckets = [0, 1, 2, 3, 4, 5].map(mistakes => ({ label: `${mistakes} טעויות`, count: eligible.filter(item => item.solved && item.mistakes === mistakes).length }));
  buckets.push({ label: 'לא הצליחו', count: eligible.filter(item => !item.solved).length });
  return { total, rows: buckets.map(bucket => ({ ...bucket, percent: total ? Math.round((bucket.count / total) * 100) : 0 })) };
}
