declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer';

  export interface CloudinaryStorageOptions {
    cloudinary: any;
    params?: any | ((req: any, file: any) => Promise<any>);
  }

  export class CloudinaryStorage implements StorageEngine {
    constructor(options: CloudinaryStorageOptions);
    _handleFile(
      req: any,
      file: any,
      cb: (error?: any, info?: Partial<Express.Multer.File>) => void
    ): void;
    _removeFile(
      req: any,
      file: Express.Multer.File,
      cb: (error: Error | null) => void
    ): void;
  }
}
