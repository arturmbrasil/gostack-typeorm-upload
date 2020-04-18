import path from 'path';
import fs from 'fs';
import csv from 'csv-parse';
import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';
import AppError from '../errors/AppError';

interface Request {
  filename: string;
}

interface TransactionCSV {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const pathFile = path.join(uploadConfig.directory, filename);
    const transactions: Transaction[] = [];
    const csvTransactions: TransactionCSV[] = [];

    const stream = fs
      .createReadStream(pathFile)
      .on('error', err => {
        throw new AppError(err.message);
      })

      .pipe(csv({ columns: true, trim: true }))
      .on('data', async row => {
        csvTransactions.push(row);
      });

    await new Promise(resolver => {
      fs.promises.unlink(pathFile);
      stream.on('end', resolver);
    });

    const createTransactionService = new CreateTransactionService();

    // eslint-disable-next-line no-restricted-syntax
    for (const item of csvTransactions) {
      // eslint-disable-next-line no-await-in-loop
      const transaction = await createTransactionService.execute(item);

      transactions.push(transaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
