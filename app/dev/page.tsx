'use client'

import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const TEST_ACCOUNTS = [
    {
        email: 'iyad.mohmad@s.unikl.edu.my',
        password: 'password123',
        fullName: 'Iyad Mohmad',
        role: 'RUNNER',
        data: { is_verified_runner: true, balance: 45.00, photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Iyad' }
    },
    {
        email: 'muhaimin@s.unikl.edu.my',
        password: 'password123',
        fullName: 'Muhaimin',
        role: 'BUYER',
        data: { is_verified_runner: false, balance: 100.00, photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Muhaimin' }
    },
    {
        email: 'kelabbola@s.unikl.edu.my',
        password: 'password123',
        fullName: 'Kelab Bola UniKL',
        role: 'SELLER',
        data: { is_official: true, is_verified_runner: false, seller_name: 'Kelab Bola UniKL', photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ball' }
    }
];

export default function DevSeedPage() {
    const [status, setStatus] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const provisionAccounts = async () => {
        setLoading(true);
        const results: string[] = [];

        for (const account of TEST_ACCOUNTS) {
            try {
                results.push(`Processing ${account.email}...`);
                setStatus([...results]);

                const userCred = await createUserWithEmailAndPassword(auth, account.email, account.password);
                
                await setDoc(doc(db, "users", userCred.user.uid), {
                    uid: userCred.user.uid,
                    email: account.email,
                    full_name: account.fullName,
                    created_at: serverTimestamp(),
                    ...account.data
                });

                results.push(`✅ Successfully created ${account.fullName}`);
            } catch (err: any) {
                results.push(`❌ Failed ${account.email}: ${err.message}`);
            }
            setStatus([...results]);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-white p-12 font-sans">
            <h1 className="text-2xl font-bold mb-8">Pulse Dev Provisioning</h1>
            <p className="text-slate-500 mb-8">This will create the test accounts in Firebase Auth and Firestore.</p>
            
            <button 
                onClick={provisionAccounts}
                disabled={loading}
                className="px-6 py-3 bg-[#1C1C1E] text-white rounded-xl font-bold disabled:opacity-50"
            >
                {loading ? 'Provisioning...' : 'Provision Test Accounts'}
            </button>

            <div className="mt-12 space-y-2">
                {status.map((s, i) => (
                    <p key={i} className="text-sm font-mono">{s}</p>
                ))}
            </div>

            {status.length > 0 && !loading && (
                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="font-bold mb-2">Login Details (Password: password123):</p>
                    <ul className="space-y-1 text-sm text-slate-600">
                        <li>iyad.mohmad@s.unikl.edu.my (Runner)</li>
                        <li>muhaimin@s.unikl.edu.my (Buyer)</li>
                        <li>kelabbola@s.unikl.edu.my (Seller)</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
