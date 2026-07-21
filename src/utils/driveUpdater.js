/**
 * Simple PDF File Updater for Google Drive
 * Updates existing PDF content while preserving file ID and shareable links
 */

/**
 * Update PDF file on Google Drive
 * @param {string} fileId - The Google Drive file ID to update
 * @param {File|Blob} newContent - The new PDF file content
 * @param {string} accessToken - Your OAuth access token
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Updated file information
 */
async function updatePdfFile(fileId, newContent, accessToken, options = {}) {
  try {
    // Create form data for multipart upload
    const formData = new FormData();
    
    // Add metadata
    const metadata = {
      mimeType: 'application/pdf'
    };
    
    if (options.fileName) {
      metadata.name = options.fileName;
    }
    
    formData.append('metadata', new Blob([JSON.stringify(metadata)], {
      type: 'application/json'
    }));
    
    // Add file content
    formData.append('file', newContent);
    
    // Make the update request
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Update failed: ${error.error?.message || response.statusText}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error updating file:', error);
    throw error;
  }
}

/**
 * Update PDF from base64 data
 * @param {string} fileId - Google Drive file ID
 * @param {string} base64Data - Base64 encoded PDF data
 * @param {string} accessToken - OAuth access token
 * @param {string} fileName - Optional file name
 * @returns {Promise<Object>} - Update result
 */
async function updateFromBase64(fileId, base64Data, accessToken, fileName = 'document.pdf') {
  // Convert base64 to blob
  const byteCharacters = atob(base64Data.split(',')[1]); // Handle data URI format
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  
  return await updatePdfFile(fileId, blob, accessToken, { fileName });
}

export { updatePdfFile, updateFromBase64 };
