import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import { getDatabase, ref, get, set, update, push, remove } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js';
import { getAuth, signInAnonymously, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';

const config = window.MAHAKESHER_FIREBASE_CONFIG;
const configured = Boolean(config && config.apiKey && config.databaseURL && !String(config.apiKey).includes('PASTE'));
let db = null;
let auth = null;

if (configured) {
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  db = getDatabase(app);
  auth = getAuth(app);
}

export const firebaseConfigured = configured;
export const firebaseAuth = () => auth;
export const firebaseDatabase = () => db;

export async function ensureSignedIn() {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  try { return (await signInAnonymously(auth)).user; } catch (error) { console.warn('Firebase anonymous sign-in is unavailable.', error); return null; }
}
export function observeAuth(callback) { return auth ? onAuthStateChanged(auth, callback) : () => {}; }
export async function googleSignIn() { if (!auth) throw new Error('Firebase אינו מוגדר.'); return (await signInWithPopup(auth, new GoogleAuthProvider())).user; }
export async function signOutUser() { if (auth) await signOut(auth); }
export async function read(path) { if (!db) return null; const snapshot = await get(ref(db, path)); return snapshot.exists() ? snapshot.val() : null; }
export async function write(path, value) { if (!db) return false; await set(ref(db, path), value); return true; }
export async function patch(path, value) { if (!db) return false; await update(ref(db, path), value); return true; }
export async function add(path, value) { if (!db) return null; const item = push(ref(db, path)); await set(item, value); return item.key; }
export async function erase(path) { if (!db) return false; await remove(ref(db, path)); return true; }
