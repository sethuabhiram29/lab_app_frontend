// google-drive-oauth.js
const { google } = require('googleapis');
const multer = require('multer');

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

class GoogleDriveOAuth {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID; // Optional folder ID
  }

  // Generate authorization URL
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  // Set tokens from stored credentials
  setTokens(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Refresh access token if needed
  async refreshTokenIfNeeded() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  // Upload file to Google Drive
  async uploadFile(fileBuffer, fileName, mimeType = 'application/pdf') {
    try {
      const fileMetadata = {
        name: fileName,
        parents: this.folderId ? [this.folderId] : undefined,
      };

      const media = {
        mimeType: mimeType,
        body: require('stream').Readable.from(fileBuffer),
      };

      // Upload file
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
      });

      const fileId = response.data.id;

      // Set file permissions to be publicly viewable
      await this.drive.permissions.create({
        fileId: fileId,
        resource: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Generate download and view links
      const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const viewLink = `https://drive.google.com/file/d/${fileId}/view`;

      return {
        fileId: fileId,
        downloadLink: downloadLink,
        viewLink: viewLink,
        fileName: fileName
      };

    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Delete file from Google Drive
  async deleteFile(fileId) {
    try {
      await this.drive.files.delete({
        fileId: fileId,
      });
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

module.exports = { GoogleDriveOAuth, upload };

// routes/reports.js (Express router)
const express = require('express');
const router = express.Router();
const { GoogleDriveOAuth, upload } = require('../services/google-drive-oauth');

const driveOAuth = new GoogleDriveOAuth();

// In-memory token storage (in production, use database)
let storedTokens = null;

// Route to initiate Google Drive authorization
router.get('/auth/google-drive', (req, res) => {
  const authUrl = driveOAuth.getAuthUrl();
  res.json({ authUrl });
});

// Route to handle OAuth callback
router.get('/auth/google-drive/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    const tokens = await driveOAuth.getTokens(code);
    
    // Store tokens (in production, save to database)
    storedTokens = tokens;
    
    res.json({ 
      success: true, 
      message: 'Google Drive authorization successful!',
      tokens: tokens // In production, don't send tokens to client
    });
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
});

// Check if Google Drive is authorized
router.get('/auth/status', (req, res) => {
  const isAuthorized = storedTokens && storedTokens.access_token;
  res.json({ isAuthorized });
});

// Upload report to Google Drive
router.post('/upload-to-drive', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if we have valid tokens
    if (!storedTokens || !storedTokens.access_token) {
      return res.status(401).json({ 
        error: 'Google Drive not authorized',
        needsAuth: true 
      });
    }

    // Set the stored tokens
    driveOAuth.setTokens(storedTokens);

    const { reportId, patientName } = req.body;
    const fileName = req.file.originalname || `Report_${patientName}_${Date.now()}.pdf`;

    try {
      // Upload to Google Drive
      const result = await driveOAuth.uploadFile(
        req.file.buffer,
        fileName,
        'application/pdf'
      );

      // Optional: Update your database with Google Drive info
      if (reportId) {
        // await updateReportWithDriveInfo(reportId, result);
      }

      res.json({
        success: true,
        fileId: result.fileId,
        downloadLink: result.downloadLink,
        viewLink: result.viewLink,
        fileName: result.fileName
      });

    } catch (uploadError) {
      // If upload fails due to expired token, try to refresh
      if (uploadError.code === 401 && storedTokens.refresh_token) {
        try {
          const newTokens = await driveOAuth.refreshTokenIfNeeded();
          storedTokens = { ...storedTokens, ...newTokens };
          
          // Retry upload with refreshed token
          const result = await driveOAuth.uploadFile(
            req.file.buffer,
            fileName,
            'application/pdf'
          );

          res.json({
            success: true,
            fileId: result.fileId,
            downloadLink: result.downloadLink,
            viewLink: result.viewLink,
            fileName: result.fileName
          });

        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          res.status(401).json({ 
            error: 'Authorization expired, please re-authorize',
            needsAuth: true 
          });
        }
      } else {
        throw uploadError;
      }
    }

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    res.status(500).json({
      error: 'Failed to upload file to Google Drive',
      details: error.message
    });
  }
});

// Delete file from Google Drive
router.delete('/drive-file/:fileId', async (req, res) => {
  try {
    if (!storedTokens || !storedTokens.access_token) {
      return res.status(401).json({ 
        error: 'Google Drive not authorized',
        needsAuth: true 
      });
    }

    driveOAuth.setTokens(storedTokens);
    
    const { fileId } = req.params;
    await driveOAuth.deleteFile(fileId);
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      error: 'Failed to delete file from Google Drive',
      details: error.message
    });
  }
});

module.exports = router;