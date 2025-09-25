'use server';

import { getPengurusDataFromSheet } from "@/services/google-sheet";
import type { Pengurus } from "@/lib/types";
import bcrypt from 'bcryptjs';

/**
 * Authenticates a user based on email and password.
 * @param email The user's email.
 * @param password The user's plain text password.
 * @returns An object with success status, a message, and the user object if successful.
 */
export async function loginAction(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user: Omit<Pengurus, 'password'> | null }> {
  if (!email || !password) {
    return { success: false, message: 'Email dan password harus diisi.', user: null };
  }

  try {
    const pengurusList = await getPengurusDataFromSheet();
    const lowercasedEmail = email.toLowerCase();
    const foundUser = pengurusList.find(p => p.email && p.email.toLowerCase() === lowercasedEmail);

    if (!foundUser) {
      return { success: false, message: 'Email tidak ditemukan.', user: null };
    }
    
    // Defensive check: Ensure password hash from sheet is a valid non-empty string.
    if (!foundUser.password || typeof foundUser.password !== 'string' || foundUser.password.trim() === '') {
        console.error(`User ${foundUser.email} does not have a valid password hash in the sheet.`);
        return { success: false, message: 'Konfigurasi akun bermasalah. Hubungi administrator.', user: null };
    }

    let isPasswordMatch = false;
    try {
        // Specifically wrap the bcrypt comparison as it can throw errors with invalid hashes.
        isPasswordMatch = await bcrypt.compare(password, foundUser.password);
    } catch (compareError) {
        console.error(`Bcrypt compare error for user ${foundUser.email}:`, compareError);
        // Do not expose internal error details to the user.
        return { success: false, message: 'Terjadi kesalahan saat memverifikasi password.', user: null };
    }


    if (!isPasswordMatch) {
      return { success: false, message: 'Password salah.', user: null };
    }

    // For security, remove the password hash from the user object returned to the client.
    const { password: _, ...userToReturn } = foundUser;

    return { success: true, message: 'Login berhasil', user: userToReturn };

  } catch (error) {
    console.error("Error during login action:", error);
    return { success: false, message: 'Terjadi kesalahan pada server.', user: null };
  }
}
