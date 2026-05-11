import { auth } from '../lib/firebase';

/**
 * Real Paynow Service for ExamKraft
 * Connects to the Express backend for secure payment initiation and verification.
 */

export const PaymentService = {
  /**
   * Initiates a payment via Paynow
   */
  async initiatePayment(userId: string, email: string, topicId: string, amount: number, subjectId: string, topicTitle: string) {
    try {
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch('/api/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          email,
          topicId,
          amount,
          subjectId,
          topicTitle
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Payment initiation failed');
      }

      return {
        success: true,
        redirectUrl: data.redirectUrl
      };
    } catch (error) {
      console.error("Payment initiation failed", error);
      throw error;
    }
  },

  /**
   * Verify payment status
   */
  async verifyPayment(reference: string, userId: string, topicId: string, subjectId: string) {
    try {
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reference,
          userId,
          topicId,
          subjectId
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Payment verification failed", error);
      throw error;
    }
  }
};
