import * as admin from "firebase-admin";

// ── LAZY SINGLETON INITIALIZATION ──
// Prevents module-evaluation crashes if environment variables are missing 
// or if the app is partially initialized during Next.js build cycles.

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0];

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("⚠️ [Pulse Admin] Missing Server-Side Credentials. Admin SDK functions will fail.");
    // We return the default app initialization attempt to keep the object structure, 
    // but actual calls will throw meaningful errors later instead of crashing the whole server on boot.
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Firebase Admin initialization error", error);
    return null;
  }
}

// Export getters or proxies to ensure we don't call .firestore() until needed
export const getAdminDb = () => {
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin SDK not initialized. Check FIREBASE_PRIVATE_KEY.");
  return admin.firestore(app);
};

export const getAdminAuth = () => {
  const app = getAdminApp();
  if (!app) throw new Error("Firebase Admin SDK not initialized. Check FIREBASE_PRIVATE_KEY.");
  return admin.auth(app);
};

// Legacy support for existing imports (Lazy Proxy)
export const adminDb = {
  collection: (path: string) => getAdminDb().collection(path),
  doc: (path: string) => getAdminDb().doc(path),
} as any;

export const adminAuth = {
  verifyIdToken: (token: string) => getAdminAuth().verifyIdToken(token),
  getUser: (uid: string) => getAdminAuth().getUser(uid),
} as any;
