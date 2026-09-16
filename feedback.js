import { firebaseConfigured, ensureSignedIn, add } from './firebase.js';

export async function submitFeedback(feedback) {
  if (!firebaseConfigured) throw new Error('firebase-not-configured');
  const user = await ensureSignedIn();
  if (!user) throw new Error('not-signed-in');
  return add('feedback', feedback);
}
