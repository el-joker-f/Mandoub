import { auth, db } from './auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

export async function getCustomerProfile(user = auth.currentUser) {
  if (!user) return null;
  const snap = await getDoc(doc(db, 'customers', user.uid));
  return snap.exists() ? { uid: user.uid, ...snap.data() } : { uid: user.uid, email: user.email || '', name: user.displayName || '', phone: '', addresses: [] };
}

export async function saveCustomerProfile(data, user = auth.currentUser) {
  if (!user) throw new Error('AUTH_REQUIRED');
  const payload = { uid: user.uid, email: user.email || '', ...data, updatedAt: serverTimestamp() };
  await setDoc(doc(db, 'customers', user.uid), payload, { merge: true });
  return payload;
}

export function profileAddress(profile) {
  return profile?.lastAddress || profile?.addresses?.[0] || null;
}
