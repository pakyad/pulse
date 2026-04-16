import { auth, db } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

/**
 * Register a new Student in the Pulse Ecosystem.
 * Creates an Auth record and initializes a Firestore Profile.
 */
export const registerStudent = async (email: string, pass: string, fullName: string, matricNo: string) => {
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
