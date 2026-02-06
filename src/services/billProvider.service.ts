import mongoose from 'mongoose';

export interface ProviderPaymentRequest {
  serviceType: string;
  providerCode: string;
  accountNumber: string;
  amount: number;
  metadata?: Record<string, any>;
}

export interface ProviderPaymentResponse {
  success: boolean;
  providerTransactionId?: string;
  message?: string;
  raw?: any;
}

/**
 * BillProviderService
 *
 * This service is a thin abstraction over the actual bill/recharge provider integration.
 * In this codebase it currently implements a mock provider that always succeeds, so that
 * the rest of the system (transactions, logs, admin tools) can be fully tested without
 * a real third-party API.
 *
 * To integrate a real provider:
 * - Replace the implementation of `processPayment` with real HTTP calls.
 * - Map provider-specific error codes to `success: false` and a meaningful `message`.
 */
export class BillProviderService {
  async processPayment(request: ProviderPaymentRequest): Promise<ProviderPaymentResponse> {
    // In production, call the real provider here.
    // For now, simulate a fast successful response with a pseudo transaction ID.
    const providerTransactionId = new mongoose.Types.ObjectId().toHexString();

    return {
      success: true,
      providerTransactionId,
      message: 'Mock provider: payment processed successfully',
      raw: {
        simulated: true,
        request,
      },
    };
  }
}

export const billProviderService = new BillProviderService();

