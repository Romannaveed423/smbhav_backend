import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { CAServiceCategory } from '../../models/CAServiceCategory';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import csv from 'csv-parser';

// Configure multer for Excel/CSV file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = 'uploads/ca/bulk-import';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `bulk-import-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv', // .csv
  ];
  
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});

// Error handler for multer
export const handleMulterError = (err: any, _req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit',
        error: 'FILE_TOO_LARGE',
      });
    }
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
      error: 'UPLOAD_ERROR',
    });
  }
  next();
};

/**
 * Parse Excel file
 */
const parseExcelFile = (filePath: string): any[] => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

/**
 * Parse CSV file
 */
const parseCSVFile = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: any) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error: any) => reject(error));
  });
};

/**
 * Validate and process categories data
 */
const processCategoriesData = async (rows: any[], importType: 'categories' | 'subcategories'): Promise<{
  valid: any[];
  invalid: Array<{ row: number; data: any; errors: string[] }>;
}> => {
  const valid: any[] = [];
  const invalid: Array<{ row: number; data: any; errors: string[] }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // +2 because row 1 is header, and array is 0-indexed
    const errors: string[] = [];

    // Required fields validation
    if (!row.cat_name || !row.cat_name.toString().trim()) {
      errors.push('Category/Subcategory name (cat_name) is required');
    }

    if (!row.cat_img || !row.cat_img.toString().trim()) {
      errors.push('Category/Subcategory image (cat_img) is required');
    }

    if (importType === 'subcategories') {
      if (!row.parentCategoryId && !row.parentCategoryName) {
        errors.push('Parent Category ID or Name is required for subcategories');
      }
    }

    // Optional fields with defaults
    const order = row.order ? parseInt(row.order.toString()) : 0;
    const status = row.status !== undefined ? (row.status.toString().toLowerCase() === 'active' || row.status === 1 || row.status === '1' ? 1 : 0) : 1;
    const level = importType === 'categories' ? 'category' : (row.level || 'subcategory');
    const description = row.description ? row.description.toString().trim() : undefined;

    if (errors.length > 0) {
      invalid.push({ row: rowNumber, data: row, errors });
      continue;
    }

    valid.push({
      cat_name: row.cat_name.toString().trim(),
      cat_img: row.cat_img.toString().trim(),
      description,
      order,
      status,
      level,
      parentCategoryId: importType === 'subcategories' ? row.parentCategoryId : undefined,
      parentCategoryName: importType === 'subcategories' ? row.parentCategoryName : undefined,
    });
  }

  return { valid, invalid };
};

/**
 * Bulk import categories
 */
export const bulkImportCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      throw createError('File is required', 400, 'VALIDATION_ERROR');
    }

    const filePath = file.path;
    const fileExt = path.extname(file.originalname).toLowerCase();
    let rows: any[] = [];

    // Parse file based on extension
    try {
      if (fileExt === '.csv') {
        rows = await parseCSVFile(filePath);
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        rows = parseExcelFile(filePath);
      } else {
        throw createError('Unsupported file format', 400, 'VALIDATION_ERROR');
      }
    } catch (parseError) {
      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw createError('Error parsing file. Please check the file format.', 400, 'PARSE_ERROR');
    }

    if (rows.length === 0) {
      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw createError('File is empty or has no data', 400, 'VALIDATION_ERROR');
    }

    // Process and validate data
    const { valid, invalid } = await processCategoriesData(rows, 'categories');

    if (valid.length === 0) {
      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.status(400).json({
        success: false,
        message: 'No valid categories found in file',
        data: {
          totalRows: rows.length,
          valid: 0,
          invalid: invalid.length,
          errors: invalid,
        },
      });
      return;
    }

    // Insert valid categories
    const insertedCategories = await CAServiceCategory.insertMany(
      valid.map((item) => ({
        cat_name: item.cat_name,
        cat_img: item.cat_img,
        description: item.description,
        order: item.order,
        status: item.status,
        level: item.level,
      })),
      { ordered: false }
    );

    // Clean up file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: `Successfully imported ${insertedCategories.length} categories`,
      data: {
        totalRows: rows.length,
        imported: insertedCategories.length,
        failed: invalid.length,
        errors: invalid.length > 0 ? invalid : undefined,
        },
      });
      return;
    } catch (error) {
    // Clean up file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * Bulk import subcategories
 */
export const bulkImportSubcategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const file = req.file;

    if (!file) {
      throw createError('File is required', 400, 'VALIDATION_ERROR');
    }

    const filePath = file.path;
    const fileExt = path.extname(file.originalname).toLowerCase();
    let rows: any[] = [];

    // Parse file based on extension
    try {
      if (fileExt === '.csv') {
        rows = await parseCSVFile(filePath);
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        rows = parseExcelFile(filePath);
      } else {
        throw createError('Unsupported file format', 400, 'VALIDATION_ERROR');
      }
    } catch (parseError) {
      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw createError('Error parsing file. Please check the file format.', 400, 'PARSE_ERROR');
    }

    if (rows.length === 0) {
      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw createError('File is empty or has no data', 400, 'VALIDATION_ERROR');
    }

    // Process and validate data
    const { valid, invalid } = await processCategoriesData(rows, 'subcategories');

    if (valid.length === 0) {
      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.status(400).json({
        success: false,
        message: 'No valid subcategories found in file',
        data: {
          totalRows: rows.length,
          valid: 0,
          invalid: invalid.length,
          errors: invalid,
        },
      });
      return;
    }

    // Resolve parent category IDs
    const categoryMap = new Map<string, mongoose.Types.ObjectId>();
    const categories = await CAServiceCategory.find({ level: 'category' }).select('_id cat_name');
    categories.forEach((cat) => {
      categoryMap.set(cat.cat_name.toLowerCase().trim(), cat._id);
    });

    // Process subcategories with parent category resolution
    const subcategoriesToInsert: any[] = [];
    const unresolved: Array<{ row: number; data: any; error: string }> = [];

    for (let i = 0; i < valid.length; i++) {
      const item = valid[i];
      let parentCategoryId: mongoose.Types.ObjectId | undefined;

      if (item.parentCategoryId) {
        try {
          parentCategoryId = new mongoose.Types.ObjectId(item.parentCategoryId);
        } catch (error) {
          // Try to find by name
          if (item.parentCategoryName) {
            const parentId = categoryMap.get(item.parentCategoryName.toLowerCase().trim());
            if (parentId) {
              parentCategoryId = parentId;
            } else {
              unresolved.push({
                row: i + 2,
                data: item,
                error: `Parent category "${item.parentCategoryName}" not found`,
              });
              continue;
            }
          } else {
            unresolved.push({
              row: i + 2,
              data: item,
              error: 'Invalid parent category ID',
            });
            continue;
          }
        }
      } else if (item.parentCategoryName) {
        const parentId = categoryMap.get(item.parentCategoryName.toLowerCase().trim());
        if (parentId) {
          parentCategoryId = parentId;
        } else {
          unresolved.push({
            row: i + 2,
            data: item,
            error: `Parent category "${item.parentCategoryName}" not found`,
          });
          continue;
        }
      } else {
        unresolved.push({
          row: i + 2,
          data: item,
          error: 'Parent category ID or Name is required',
        });
        continue;
      }

      // Verify parent category exists
      const parentExists = await CAServiceCategory.findById(parentCategoryId);
      if (!parentExists) {
        unresolved.push({
          row: i + 2,
          data: item,
          error: 'Parent category not found',
        });
        continue;
      }

      subcategoriesToInsert.push({
        cat_name: item.cat_name,
        cat_img: item.cat_img,
        description: item.description,
        order: item.order,
        status: item.status,
        level: item.level,
        parentCategoryId,
      });
    }

    if (subcategoriesToInsert.length === 0) {
      // Clean up file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.status(400).json({
        success: false,
        message: 'No valid subcategories found after resolving parent categories',
        data: {
          totalRows: rows.length,
          valid: 0,
          invalid: invalid.length + unresolved.length,
          errors: [...invalid, ...unresolved],
        },
      });
      return;
    }

    // Insert valid subcategories
    const insertedSubcategories = await CAServiceCategory.insertMany(subcategoriesToInsert, { ordered: false });

    // Clean up file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: `Successfully imported ${insertedSubcategories.length} subcategories`,
      data: {
        totalRows: rows.length,
        imported: insertedSubcategories.length,
        failed: invalid.length + unresolved.length,
        errors: invalid.length + unresolved.length > 0 ? [...invalid, ...unresolved] : undefined,
      },
    });
  } catch (error) {
    // Clean up file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

