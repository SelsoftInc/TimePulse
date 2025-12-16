/**
 * File Upload Service - Handles S3 file uploads for timesheet attachments
 */

import axios from 'axios';
import { API_BASE } from '../config/api';

/**
 * Upload a file to S3 for a timesheet
 * @param {File} file - File to upload
 * @param {string} timesheetId - Timesheet ID
 * @param {string} tenantId - Tenant ID
 * @param {Function} onProgress - Progress callback (optional)
 * @returns {Promise<Object>} File metadata
 */
export const uploadFileToS3 = async (file, timesheetId, tenantId, onProgress = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(
      `${API_BASE}/api/timesheets/${timesheetId}/upload?tenantId=${tenantId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'},
        onUploadProgress: onProgress
          ? (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          : undefined}
    );

    if (response.data.success) {
      return response.data.file;
    } else {
      throw new Error(response.data.message || 'Upload failed');
    }
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to upload file'
    );
  }
};

/**
 * Get download URL for a file
 * @param {string} timesheetId - Timesheet ID
 * @param {string} fileId - File ID
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<string>} Presigned download URL
 */
export const getFileDownloadUrl = async (timesheetId, fileId, tenantId) => {
  try {
    const response = await axios.get(
      `${API_BASE}/api/timesheets/${timesheetId}/files/${fileId}/download?tenantId=${tenantId}`
    );

    if (response.data.success) {
      return response.data.downloadUrl;
    } else {
      throw new Error(response.data.message || 'Failed to get download URL');
    }
  } catch (error) {
    console.error('Get download URL error:', error);
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to get download URL'
    );
  }
};

/**
 * Delete a file from S3
 * @param {string} timesheetId - Timesheet ID
 * @param {string} fileId - File ID
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<void>}
 */
export const deleteFileFromS3 = async (timesheetId, fileId, tenantId) => {
  try {
    const response = await axios.delete(
      `${API_BASE}/api/timesheets/${timesheetId}/files/${fileId}?tenantId=${tenantId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete file');
    }
  } catch (error) {
    console.error('Delete file error:', error);
    throw new Error(
      error.response?.data?.message || error.message || 'Failed to delete file'
    );
  }
};

/**
 * Download a file
 * @param {string} timesheetId - Timesheet ID
 * @param {string} fileId - File ID
 * @param {string} tenantId - Tenant ID
 * @param {string} fileName - File name for download
 */
export const downloadFile = async (timesheetId, fileId, tenantId, fileName) => {
  try {
    const downloadUrl = await getFileDownloadUrl(timesheetId, fileId, tenantId);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Download file error:', error);
    throw error;
  }
};

