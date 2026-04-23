"use client";

/**
 * Pulse Demo Database Bridge
 * Simulates a persistent user session for demonstration purposes
 * when real Firebase auth is not being used.
 */

export interface DemoUser {
  uid: string;
  full_name: string;
  email: string;
  hustle_score: number;
  role: string;
  photo_url?: string;
  matric_no?: string;
}

const STORAGE_KEY = 'pulse_demo_user';

export const getDemoUser = (): DemoUser | null => {
  if (typeof window === 'undefined') return null;
  const data = sessionStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
};

export const setDemoUser = (user: DemoUser) => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const clearDemoUser = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
};

export const formatNameFromEmail = (email: string): string => {
  const account = email.split('@')[0];
  return account
    .split(/[._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};
