import AWS from 'aws-sdk';
import { config } from '../config/env';
import logger from '../utils/logger';

let s3: AWS.S3 | null = null;

if (config.awsAccessKeyId && config.awsSecretAccessKey) {
  AWS.config.update({
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
    region: config.awsRegion,
  });
  s3 = new AWS.S3();
}

export const uploadFile = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<string | null> => {
  if (!s3 || !config.awsBucketName) {
    logger.warn('AWS S3 not configured, file upload would fail');
    // In development, return a placeholder URL
    if (config.nodeEnv === 'development') {
      logger.info(`File upload (dev mode): ${folder}/${file.originalname}`);
      return `https://dev-storage.zozo.com/${folder}/${file.originalname}`;
    }
    return null;
  }

  try {
    const key = `${folder}/${Date.now()}-${file.originalname}`;
    const params: AWS.S3.PutObjectRequest = {
      Bucket: config.awsBucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const result = await s3.upload(params).promise();
    logger.info(`File uploaded: ${result.Location}`);
    return result.Location;
  } catch (error) {
    logger.error('Error uploading file:', error);
    return null;
  }
};

export const deleteFile = async (fileUrl: string): Promise<boolean> => {
  if (!s3 || !config.awsBucketName) {
    return false;
  }

  try {
    // Extract key from URL
    const urlParts = fileUrl.split('/');
    const key = urlParts.slice(-2).join('/'); // Get folder/filename

    await s3.deleteObject({
      Bucket: config.awsBucketName,
      Key: key,
    }).promise();
    return true;
  } catch (error) {
    logger.error('Error deleting file:', error);
    return false;
  }
};

