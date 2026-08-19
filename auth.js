/* =====================================================
   MANDOUB - AUTH / ROLES
   Centralized authentication + role helpers.

   Roles:
   - superadmin: permanent root administrator
   - admin: dashboard administrator
   - customer: normal user

   IMPORTANT:
   Firestore Security Rules are the real authorization layer.
   This file is only the client-side routing/UI layer.
===================================================== */

import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

export const SUPER_ADMIN_EMAIL = "fmdyh6636@gmail.com";

export const firebaseConfig = {
  apiKey: "AIzaSyB6-RVH7-8NrN-AaOOv6QjL9APDeyj7oIU",
  authDomain: "mandoub-dv.firebaseapp.com",
  projectId: "mandoub-dv",
  storageBucket: "mandoub-dv.firebasestorage.app",
  messagingSenderId: "311140400335",
  appId: "1:311140400335:web:db198b7c53259c53594bba",
  measurementId: "G-7V1LJQYYXD"
};

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export async function getUserRole(user = auth.currentUser) {
  if (!user) return null;

  const email = (user.email || "").trim().toLowerCase();

  // The root account is always superadmin.
  if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return "superadmin";
  }

  const roleSnap = await getDoc(doc(db, "roles", user.uid));

  if (!roleSnap.exists()) {
    return "customer";
  }

  const role = roleSnap.data()?.role;

  return role === "admin" || role === "superadmin"
    ? role
    : "customer";
}

export async function ensureCustomerRole(user) {
  if (!user) return;

  const email = (user.email || "").trim().toLowerCase();

  // Never downgrade or overwrite the root account.
  if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
    await setDoc(
      doc(db, "roles", user.uid),
      {
        uid: user.uid,
        email: user.email,
        role: "superadmin",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return;
  }

  const roleRef = doc(db, "roles", user.uid);
  const roleSnap = await getDoc(roleRef);

  // Registration defaults to customer. Existing admin roles are preserved.
  if (!roleSnap.exists()) {
    await setDoc(roleRef, {
      uid: user.uid,
      email: user.email,
      role: "customer",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

export async function isAdmin(user = auth.currentUser) {
  const role = await getUserRole(user);
  return role === "admin" || role === "superadmin";
}

export async function isSuperAdmin(user = auth.currentUser) {
  return (await getUserRole(user)) === "superadmin";
}

export async function requireAdmin({ redirect = "login.html" } = {}) {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();

      if (!user) {
        window.location.replace(redirect);
        resolve(false);
        return;
      }

      try {
        const allowed = await isAdmin(user);

        if (!allowed) {
          await signOut(auth);
          window.location.replace(redirect);
          resolve(false);
          return;
        }

        resolve(true);
      } catch (error) {
        console.error("Admin authorization error:", error);
        await signOut(auth).catch(() => {});
        window.location.replace(redirect);
        resolve(false);
      }
    });
  });
}

export async function routeAfterLogin(user) {
  await ensureCustomerRole(user);

  const role = await getUserRole(user);

  if (role === "admin" || role === "superadmin") {
    window.location.replace("admin.html");
  } else {
    window.location.replace("index.html");
  }
}

export async function addAdmin(targetUid, targetEmail) {
  if (!(await isSuperAdmin())) {
    throw new Error("SUPER_ADMIN_REQUIRED");
  }

  if (!targetUid || !targetEmail) {
    throw new Error("INVALID_ADMIN");
  }

  const email = targetEmail.trim().toLowerCase();

  if (email === SUPER_ADMIN_EMAIL.toLowerCase()) {
    throw new Error("SUPER_ADMIN_ALREADY_EXISTS");
  }

  await setDoc(doc(db, "roles", targetUid), {
    uid: targetUid,
    email: targetEmail.trim(),
    role: "admin",
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function removeAdmin(targetUid, targetEmail) {
  if (!(await isSuperAdmin())) {
    throw new Error("SUPER_ADMIN_REQUIRED");
  }

  if (!targetUid) {
    throw new Error("INVALID_ADMIN");
  }

  if ((targetEmail || "").trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    throw new Error("CANNOT_REMOVE_SUPER_ADMIN");
  }

  await setDoc(doc(db, "roles", targetUid), {
    role: "customer",
    updatedAt: serverTimestamp()
  }, { merge: true });
}
