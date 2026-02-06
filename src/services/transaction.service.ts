import Transaction from '../models/Transaction';
import { ITransaction } from '../models/Transaction';

export const createTransaction = async (data: {
  userId: any;
  type: string;
  amount: number;
  status?: string;
  description?: string;
  relatedEntity?: { type: string; id: any };
  metadata?: any;
  balanceBefore: number;
  balanceAfter: number;
}): Promise<ITransaction> => {
  return await Transaction.create(data);
};

