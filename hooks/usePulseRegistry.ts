import { useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { VETTED_ACCOUNTS } from '@/lib/utils/admin-seeding';

/**
 * Pulse Registry Hook
 * Ensures that specific vetted accounts have their roles and statuses synchronized "forever".
 */
export function usePulseRegistry() {
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(async (user) => {
            if (!user || !user.email) return;

            const vetting = VETTED_ACCOUNTS.find(a => a.email.toLowerCase() === user.email?.toLowerCase());
            
            if (vetting) {
                const userRef = doc(db, "users", user.uid);
                const snap = await getDoc(userRef);
                
                if (!snap.exists()) {
                    // Initialize if missing
                    await setDoc(userRef, {
                        ...vetting,
                        created_at: new Date().toISOString(),
                    });
                    console.log(`[Pulse Registry] Initialized ${user.email} as ${vetting.role}`);
                } else {
                    const data = snap.data();
                    // Check for drift in role or verification status
                    const needsUpdate = data.role !== vetting.role || 
                                      data.is_verified_runner !== vetting.is_verified_runner ||
                                      data.is_verified_merchant !== vetting.is_verified_merchant;
                    
                    if (needsUpdate) {
                        await updateDoc(userRef, {
                            role: vetting.role,
                            is_verified_runner: vetting.is_verified_runner ?? false,
                            is_verified_merchant: vetting.is_verified_merchant ?? false,
                            runner_status: vetting.runner_status ?? 'none',
                            merchant_status: vetting.merchant_status ?? 'none',
                            is_official: vetting.is_official ?? false
                        });
                        console.log(`[Pulse Registry] Synchronized ${user.email} registry.`);
                    }
                }
            }
        });

        return () => unsub();
    }, []);
}
