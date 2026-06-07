import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, getDocs, collection } from 'firebase/firestore';

/**
 * Pulse Protocol | Account Role Configuration
 * Centralizes the "forever" memory of specific user roles and statuses.
 */

export interface AccountVetting {
    email: string;
    role: 'STUDENT' | 'CLUB' | 'ADMIN';
    is_verified_runner?: boolean;
    is_verified_merchant?: boolean;
    runner_status?: 'verified' | 'pending' | 'none';
    merchant_status?: 'verified' | 'pending' | 'none';
    is_official?: boolean;
    campus?: string;
    full_name: string;
}

export const VETTED_ACCOUNTS: AccountVetting[] = [
    {
        email: 'iyad.mohmad@s.unikl.edu.my',
        role: 'STUDENT',
        full_name: 'Iyad Mohmad',
        is_verified_runner: true,
        is_verified_merchant: true,
        runner_status: 'verified',
        merchant_status: 'verified',
        campus: 'City Campus'
    },
    {
        email: 'muhaiminzu@s.unikl.edu.my',
        role: 'STUDENT',
        full_name: 'Muhaiminzu',
        is_verified_runner: false,
        is_verified_merchant: false,
        runner_status: 'none',
        merchant_status: 'none',
        campus: 'City Campus'
    },
    {
        email: 'muhaimin@s.unikl.edu.my',
        role: 'STUDENT',
        full_name: 'Muhaimin',
        is_verified_runner: false,
        runner_status: 'none',
        campus: 'City Campus'
    },
    {
        email: 'se-club@s.unikl.edu.my',
        role: 'CLUB',
        full_name: 'Software Engineering Club',
        is_verified_merchant: true,
        merchant_status: 'verified',
        is_official: true,
        campus: 'City Campus'
    },
    {
        email: 'kelab-bola@s.unikl.edu.my',
        role: 'CLUB',
        full_name: 'UniKL Football Club',
        is_verified_merchant: true,
        merchant_status: 'verified',
        is_official: true,
        campus: 'City Campus'
    },
    {
        email: 'kelabbola@s.unikl.edu.my',
        role: 'CLUB',
        full_name: 'UniKL Football Club',
        is_verified_merchant: true,
        merchant_status: 'verified',
        is_official: true,
        campus: 'City Campus'
    },
    {
        email: 'admin@pulse.com',
        role: 'ADMIN',
        full_name: 'System Admin'
    }
];

/**
 *  Registry Correction | Institutional Data Integrity
 * Force-aligns the UniKL Scarf (cicMuv) to the correct Merchant UID.
 */
export async function fixMerchantRegistry() {
    const TARGET_ID = "cicMuv";
    const TARGET_UID = "2GSboliteBeTsO3eeVCIoBseLB62";

    try {
        const docId = "cicMuvyP2GSboliteBeTs";
        const ref = doc(db, "items", docId);
        const snap = await getDoc(ref);
        
        if (snap.exists()) {
            await updateDoc(ref, {
                seller_id: TARGET_UID,
                seller_name: "Kelab Bola"
            });
            console.log(" Registry Correction: Scarf aligned to Kelab Bola.");
        }
    } catch (e) {
        console.error("Registry Repair Failed:", e);
    }
}

