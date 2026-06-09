import axiosInstance from './axios';
import { API_ENDPOINTS } from '../utils/constants/endpoints';

/**
 * Wallet API service for managing wallet operations.
 */
export const walletApi = {
    /**
     * Gets the current user's wallet.
     * Creates a new wallet if one doesn't exist.
     */
    getWallet: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.WALLET.ME);
        return response.data;
    },

    /**
     * Sends an OTP for wallet operations.
     * @param {string} purpose - Purpose of the OTP (ADD_FUNDS, WITHDRAW)
     * @param {number} amount - Optional transaction amount
     */
    sendOtp: async (purpose, amount = null) => {
        const response = await axiosInstance.post(API_ENDPOINTS.WALLET.SEND_OTP, {
            purpose,
            amount
        });
        return response.data;
    },

    /**
     * Adds funds to the wallet after OTP verification.
     * @param {number} amount - Amount to add
     * @param {string} otp - OTP for verification
     * @param {string} paymentMethod - Payment method (UPI, CARD, NETBANKING)
     * @param {string} description - Optional description
     */
    addFunds: async (amount, otp, paymentMethod, description = '') => {
        const response = await axiosInstance.post(API_ENDPOINTS.WALLET.ADD_FUNDS, {
            amount: parseFloat(amount),
            otp,
            paymentMethod: paymentMethod.toUpperCase(),
            description
        });
        return response.data;
    },

    /**
     * Withdraws funds from the wallet after OTP verification.
     * @param {number} amount - Amount to withdraw
     * @param {string} otp - OTP for verification
     * @param {number} bankAccountId - Bank account ID to withdraw to
     */
    withdrawFunds: async (amount, otp, bankAccountId) => {
        const response = await axiosInstance.post(API_ENDPOINTS.WALLET.WITHDRAW, {
            amount: parseFloat(amount),
            otp,
            bankAccountId
        });
        return response.data;
    },

    /**
     * Gets the transaction history for the wallet.
     * @param {number} page - Page number (0-indexed)
     * @param {number} size - Page size
     */
    getTransactions: async (page = 0, size = 10) => {
        const response = await axiosInstance.get(API_ENDPOINTS.WALLET.TRANSACTIONS, {
            params: { page, size }
        });
        return response.data;
    },
};

/**
 * Bank Account API service for managing linked bank accounts.
 */
export const bankAccountApi = {
    /**
     * Gets all bank accounts linked to the user.
     */
    getBankAccounts: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.BANK_ACCOUNT.BASE);
        return response.data;
    },

    /**
     * Gets the primary bank account.
     */
    getPrimaryBankAccount: async () => {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.BANK_ACCOUNT.PRIMARY);
            return response.data;
        } catch (error) {
            // Return null if no primary account (204 No Content)
            if (error.response?.status === 204) {
                return null;
            }
            throw error;
        }
    },

    /**
     * Links a new bank account.
     * @param {Object} bankDetails - Bank account details
     * @param {string} bankDetails.bankName - Bank name
     * @param {string} bankDetails.accountNumber - Account number
     * @param {string} bankDetails.ifscCode - IFSC code
     * @param {string} bankDetails.holderName - Account holder name
     */
    linkBankAccount: async (bankDetails) => {
        const response = await axiosInstance.post(API_ENDPOINTS.BANK_ACCOUNT.LINK, {
            bankName: bankDetails.bankName,
            accountNumber: bankDetails.accountNumber,
            ifscCode: bankDetails.ifscCode.toUpperCase(),
            holderName: bankDetails.holderName
        });
        return response.data;
    },

    /**
     * Deletes a bank account.
     * @param {number} id - Bank account ID
     */
    deleteBankAccount: async (id) => {
        await axiosInstance.delete(API_ENDPOINTS.BANK_ACCOUNT.DELETE(id));
    },

    /**
     * Sets a bank account as the primary account.
     * @param {number} id - Bank account ID to set as primary
     */
    setPrimaryBankAccount: async (id) => {
        const response = await axiosInstance.put(API_ENDPOINTS.BANK_ACCOUNT.SET_PRIMARY(id));
        return response.data;
    },
};
