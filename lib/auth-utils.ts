import { auth, db } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

/**
 * Institutional Guard: Validates that the email belongs to the UniKL domain.
 * Supports both Student (@s.unikl.edu.my) and Staff (@unikl.edu.my) nodes.
 */
export const isValidUniKLEmail = (email: string) => {
  const uniklRegex = /^[a-zA-Z0-9._%+-]+@(s\.)?unikl\.edu\.my$/;
  // Note: External merchant whitelisting is handled post-auth in the login flow
  return uniklRegex.test(email.toLowerCase());
};

/**
 * Register a new Student in the Pulse Ecosystem.
 * Creates an Auth record and initializes a Firestore Profile.
 */
export const registerStudent = async (email: string, pass: string, fullName: string, matricNo: string) => {
  // 🏛️ REQ_F101: Institutional Gating
  if (!isValidUniKLEmail(email)) {
    return { user: null, error: 'Unauthorized: You must use a valid UniKL email address to join CODEP.' };
  }

  try {
    // 1. Create Auth Identity
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // 2. Initialize Pulse Profile (Firestore)
    // Uses the Auth UID as the document ID for absolute synchronization
    await setDoc(doc(db, "users", user.uid), {
      full_name: fullName,
      matric_no: matricNo,
      hustle_score: 0,
      role: 'STUDENT',
      created_at: new Date().toISOString(),
      performance_tier: 'NOVICE'
    });

    return { user, error: null };
  } catch (error: any) {
    console.error("Pulse Registration Error:", error.message);
    return { user: null, error: error.message };
  }
};

/**
 * Admin Protocol: Register an Official Institutional Merchant (Club/Org).
 * This is an ADMIN ONLY action to ensure institutional vetting.
 */
export const createInstitutionalMerchant = async (email: string, pass: string, clubName: string) => {
  try {
    // 1. Create Auth Identity
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // 2. Initialize Institutional Profile
    // Stores the organization name and sets high-prestige flags
    await setDoc(doc(db, "users", user.uid), {
      full_name: clubName,
      email: email,
      role: 'CLUB',
      is_official: true,
      is_verified_merchant: true,
      hustle_score: 500, // Starting prestige for official entities
      created_at: new Date().toISOString()
    });

    return { user, error: null };
  } catch (error: any) {
    console.error("Institutional Deployment Error:", error.message);
    return { user: null, error: error.message };
  }
};

/**
 * Secure Session Handshake (Login)
 */
export const loginStudent = async (email: string, pass: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error("Pulse Login Error:", error.message);
    return { user: null, error: error.message };
  }
};

/**
 * Terminate Session
 */
export const logoutUser = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
/**
 * Institutional Protocol: Submit application and synchronize with Institutional Ledger.
 * Handles both Runner and Merchant registration.
 */
export const submitInstitutionalApplication = async (uid: string, data: any, type: 'runner' | 'merchant') => {
  try {
    const userRef = doc(db, "users", uid);
    const statusField = type === 'runner' ? 'runner_status' : 'merchant_status';
    const verifiedField = type === 'runner' ? 'is_verified_runner' : 'is_verified_merchant';

    await setDoc(userRef, {
      ...data,
      [statusField]: 'pending',
      [verifiedField]: false,
      applied_at: new Date().toISOString()
    }, { merge: true });

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Institutional Registry Error:", error.message);
    return { success: false, error: error.message };
  }
};
