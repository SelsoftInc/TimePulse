/**
 * S3 Service - Handles file uploads, downloads, and deletions
 */

const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, S3_CONFIG } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class S3Service {
  /**
   * Upload file to S3
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} originalName - Original file name
   * @param {string} mimeType - File MIME type
   * @param {string} timesheetId - Timesheet ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} File metadata with S3 key
   */
  static async uploadFile(fileBuffer, originalName, mimeType, timesheetId, tenantId) {
    try {
      // Validate file size
      if (fileBuffer.length > S3_CONFIG.maxFileSize) {
        throw new Error(`File size exceeds maximum allowed size of ${S3_CONFIG.maxFileSize / 1024 / 1024}MB`);
      }

      // Validate file type
      const ext = path.extname(originalName).toLowerCase();
      if (!S3_CONFIG.allowedExtensions.includes(ext)) {
        throw new Error(`File type ${ext} is not allowed. Allowed types: ${S3_CONFIG.allowedExtensions.join(', ')}`);
      }

      // Generate unique S3 key
      const fileId = uuidv4();
      const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const s3Key = `timesheets/${tenantId}/${timesheetId}/${fileId}-${sanitizedName}`;

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: S3_CONFIG.bucket,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          originalName: originalName,
          timesheetId: timesheetId,
          tenantId: tenantId,
        },
      });

      await s3Client.send(command);

      // Return file metadata
      return {
        id: fileId,
        originalName: originalName,
        fileName: sanitizedName,
        mimeType: mimeType,
        size: fileBuffer.length,
        s3Key: s3Key,
        url: null, // Will be generated on-demand with presigned URL
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Get presigned URL for file download (valid for 1 hour)
   * @param {string} s3Key - S3 object key
   * @returns {Promise<string>} Presigned URL
   */
  static async getDownloadUrl(s3Key) {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_CONFIG.bucket,
        Key: s3Key,
      });

      // Generate presigned URL valid for 1 hour
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return url;
    } catch (error) {
      console.error('S3 get download URL error:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   * @param {string} s3Key - S3 object key
   * @returns {Promise<void>}
   */
  static async deleteFile(s3Key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: S3_CONFIG.bucket,
        Key: s3Key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Delete multiple files from S3
   * @param {Array<string>} s3Keys - Array of S3 object keys
   * @returns {Promise<void>}
   */
  static async deleteFiles(s3Keys) {
    try {
      await Promise.all(s3Keys.map(key => this.deleteFile(key)));
    } catch (error) {
      console.error('S3 bulk delete error:', error);
      throw new Error(`Failed to delete files: ${error.message}`);
    }
  }

  /**
   * Validate file before upload
   * @param {Object} file - Multer file object
   * @returns {Object} Validation result
   */
  static validateFile(file) {
    const errors = [];

    // Check file size
    if (file.size > S3_CONFIG.maxFileSize) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${S3_CONFIG.maxFileSize / 1024 / 1024}MB`);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!S3_CONFIG.allowedExtensions.includes(ext)) {
      errors.push(`File type ${ext} is not allowed. Allowed types: ${S3_CONFIG.allowedExtensions.join(', ')}`);
    }

    // Check MIME type
    if (!S3_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`MIME type ${file.mimetype} is not allowed`);
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }
}

module.exports = S3Service;

