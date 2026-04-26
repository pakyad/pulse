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
        email: 'se-club@s.unikl.edu.my',
        role: 'CLUB',
        full_name: 'Software Engineering Club',
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
