import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const VALIDATION_PATTERNS = {
    PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    AADHAAR: /^[0-9]{12}$/,
    STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
};

export const validatePAN = (pan) => VALIDATION_PATTERNS.PAN.test(pan);

/**
 * Validates Aadhaar number (12 digits).
 * Handles input with or without spaces, stripping them before check.
 */
export const validateAadhaar = (aadhaar) => {
    if (!aadhaar) return false;
    return VALIDATION_PATTERNS.AADHAAR.test(aadhaar.replace(/\s/g, ""));
};

export const validateStrongPassword = (password) => VALIDATION_PATTERNS.STRONG_PASSWORD.test(password);
