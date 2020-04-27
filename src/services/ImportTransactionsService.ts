import path from 'path';
import fs from 'fs';
import { getCustomRepository, getRepository } from 'typeorm';

import upload from '../config/upload';
import loadCSV from '../utils/loadcvs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CsvImportToTransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface TransactionDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: Category;
}

class ImportTransactionsService {
  async execute(fileName: string): Promise<Transaction[]> {
    const filePath = path.resolve(upload.directory, fileName);

    const linesToImportInTransactions = await loadCSV(filePath);

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const categoriesAlreadyExists: Category[] = await categoryRepository.find();

    const transactionsObjToCreate: TransactionDTO[] = [];

    linesToImportInTransactions.forEach(async lineToImport => {
      let categoryExist = categoriesAlreadyExists.find(category => {
        return category.title === lineToImport.category;
      });

      if (!categoryExist) {
        const newCategory = categoryRepository.create({
          title: lineToImport.category,
        });

        categoryExist = await categoryRepository.save(newCategory);
      }

      transactionsObjToCreate.push({
        title: lineToImport.title,
        type: lineToImport.type,
        value: lineToImport.value,
        category: categoryExist,
      });
    });

    const transactions = transactionsRepository.create(transactionsObjToCreate);

    await transactionsRepository.save(transactions);

    await fs.promises.unlink(filePath);

    return transactions;
  }
}

export default ImportTransactionsService;
