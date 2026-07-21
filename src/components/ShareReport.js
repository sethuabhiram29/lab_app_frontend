/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import { useGoogleDrive } from '../contexts/GoogleDriveContext';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { pdf } from '@react-pdf/renderer';
import { getReports, updateReport, saveUpdationLinks } from '../api';
import { openDB } from 'idb';
import PDFPreview from './PDFPreview';
import LinkIcon from '@mui/icons-material/Link';
import DownloadIcon from '@mui/icons-material/Download';
import { ReportDocument } from './CreateReport';
import UpdateIcon from '@mui/icons-material/Update';
import PreviewIcon from '@mui/icons-material/Preview';
import { updatePdfFile } from '../utils/driveUpdater';

// Google Drive Configuration
const GOOGLE_CLIENT_ID = '1051032038727-00igqktf00j88sgta3tr2ap3f2ut7qrl.apps.googleusercontent.com';

// Helper to generate consistent ReportDocument for all usages
function getReportDocumentFor(report, forPrinting = false) {
  return (
    <ReportDocument
      patient={report.reportDisplayData.patient}
      testTables={report.reportDisplayData.testTables}
      isPrinting={forPrinting}
      removedImages={new Set(report.reportDisplayData.removedImages || [])}
      tableNotes={report.reportDisplayData.tableNotes || {}}
    />
  );
}

const ShareReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updationLinksMap, setUpdationLinksMap] = useState({});

  // Helper to get local date (fixes timezone offset issue)
  const getLocalTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchReports = useCallback(async () => {
  try {
    setLoading(true);
    const data = await getReports();
    console.log('Raw reports data:', data?.map(r => ({
      patientId: r.reportDisplayData?.patient?._id,
      patientName: r.reportDisplayData?.patient?.name,
      updationLinks: r.reportDisplayData?.patient?.updationLinks
    })));
    const createdReports = (data || []).filter(report => 
      report.reportDisplayData && 
      report.testResults && 
      report.testResults.length > 0
    );
    // Build updation links map from patient data and local storage
    const updationLinksObj = {};
    
    // First get server-side links
    for (const report of createdReports) {
      const patient = report.reportDisplayData?.patient;
      if (patient?._id && patient.updationLinks) {
        updationLinksObj[patient._id] = patient.updationLinks;
        console.log('Found server updation links for patient:', patient.name, patient.updationLinks);
      }
      
      // Then check local storage for each patient
      if (patient?._id) {
        const localData = await getLocalLinks(patient._id);
        if (localData?.updationLinks) {
          // Merge with existing links or create new entry
          updationLinksObj[patient._id] = {
            ...updationLinksObj[patient._id],
            ...localData.updationLinks
          };
          console.log('Found local updation links for patient:', patient.name, localData.updationLinks);
        }
      }
    }

    setUpdationLinksMap(updationLinksObj);
    setReports(createdReports);
    setError(null);
  } catch (err) {
    setError('Failed to fetch reports');
    console.error('Error fetching reports:', err);
  } finally {
    setLoading(false);
  }
}, []);

  // Function to view PDF report
  const handleViewPdf = async (report) => {
    if (!report.reportDisplayData || !report.reportDisplayData.patient) {
      setSnackbar({
        open: true,
        message: 'Report data not found. Please refresh the page and try again.',
        severity: 'error'
      });
      return;
    }

    try {
      // Generate PDF document
      const pdfDoc = (
        <ReportDocument 
          patient={report.reportDisplayData.patient} 
          testTables={report.reportDisplayData.testTables}
          isPrinting={false}
          removedImages={new Set(report.reportDisplayData.removedImages || [])} 
          tableNotes={report.reportDisplayData.tableNotes || {}}
          qrImage={report.reportDisplayData.qrImage}
        />
      );

      // Create blob and show preview
      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(pdfDoc).toBlob();
      const url = URL.createObjectURL(blob);
      
      // Open PDF in new window for preview
      window.open(url, '_blank');

      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 5000);

    } catch (error) {
      console.error('Error generating PDF:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate PDF preview',
        severity: 'error'
      });
    }
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setSelectedReport(null);
  };

  // Function to get stored report links from IndexedDB
  const getStoredReportLinks = async (patientId) => {
    try {
      const db = await openDB('reportsDB', 1);
      const storedData = await db.get('reports', patientId);
      return storedData;
    } catch (error) {
      console.error('Error fetching report data from IndexedDB:', error);
      return null;
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchReports();

    // Add event listener for report updates
    const handleReportUpdate = () => {
      fetchReports();
    };
    window.addEventListener('reportUpdated', handleReportUpdate);

    // Cleanup event listener
    return () => {
      window.removeEventListener('reportUpdated', handleReportUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to get links from local IndexedDB
  const getLocalLinks = async (patientId) => {
    try {
      const db = await openDB('reportsDB', 1);
      const reportData = await db.get('reports', patientId);
      return reportData || null;
    } catch (error) {
      console.error('Error fetching from local DB:', error);
      return null;
    }
  };

  const [selectedDate, setSelectedDate] = useState(getLocalTodayString());
  const [localLinks, setLocalLinks] = useState({});

  // Always reset selectedDate to today when component mounts
  useEffect(() => {
    setSelectedDate(getLocalTodayString());
  }, []);
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadPreviewOpen, setUploadPreviewOpen] = useState(false);
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [whatsAppRecipient, setWhatsAppRecipient] = useState('patient');
  const [emailRecipient, setEmailRecipient] = useState('patient');
  const [whatsAppReport, setWhatsAppReport] = useState(null);
  const [emailReport, setEmailReport] = useState(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [sharingLoading, setSharingLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [uploadingToDrive, setUploadingToDrive] = useState(false);
  const { driveAuthorized, tokenClient, driveAuthError, handleSignIn, handleSignOut, initializeTokenClient } = useGoogleDrive();
  const [driveAuthChecked, setDriveAuthChecked] = useState(false);
  const [gisLoading, setGisLoading] = useState(false);

  const updateGoogleDriveFile = async (fileId, pdfBlob) => {
    try {
      const token = localStorage.getItem('googleDriveAccessToken');
      if (!token) {
        throw new Error('Not authenticated with Google Drive');
      }

      // Update the file content
      const updateResponse = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/pdf',
          },
          body: pdfBlob
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to update file');
      }

      return await updateResponse.json();
    } catch (error) {
      console.error('Error updating file:', error);
      throw error;
    }
  };

  const uploadToDriveAndGetLinks = async (pdfBlob, fileName) => {
    try {
      const token = localStorage.getItem('googleDriveAccessToken');
      if (!token) throw new Error('No access token available');

      // Upload file to Drive
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify({
        name: fileName,
        mimeType: 'application/pdf'
      })], { type: 'application/json' }));
      form.append('file', pdfBlob);

      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');
      const file = await uploadResponse.json();

      // Update file permissions (make it accessible via link)
      await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });

      // Get shareable links
      const viewLink = `https://drive.google.com/file/d/${file.id}/view`;
      const downloadLink = `https://drive.google.com/uc?export=download&id=${file.id}`;

      return { viewLink, downloadLink, fileId: file.id };
    } catch (error) {
      console.error('Error uploading to Drive:', error);
      throw error;
    }
  };

  const handleUploadToDrive = async (report) => {
    if (!report.reportDisplayData || !report.reportDisplayData.patient) {
      setSnackbar({
        open: true,
        message: 'Report data not found',
        severity: 'error'
      });
      return;
    }

    try {
      // Set uploading state
      const updatedReports = reports.map(r => 
        r._id === report._id ? { ...r, uploading: true } : r
      );
      setReports(updatedReports);

      // Create PDF document
      const pdfDoc = (
        <ReportDocument 
          patient={report.reportDisplayData.patient}
          testTables={report.reportDisplayData.testTables || []}
          isPrinting={false}
          removedImages={new Set(report.reportDisplayData.removedImages || [])} 
          tableNotes={report.reportDisplayData.tableNotes || {}}
          qrImage={report.reportDisplayData.qrImage}
          key={`upload-${Date.now()}`}
        />
      );

      // Convert to PDF blob
      const pdfBlob = await pdf(pdfDoc).toBlob();

      // Upload to Drive and get links
      const fileName = `${report.reportDisplayData.patient.name}_${report.reportDisplayData.patient.testNo}.pdf`;
      const { viewLink: vLink, downloadLink: dLink } = await uploadToDriveAndGetLinks(pdfBlob, fileName);
      
      // Set links to variables to match working implementation
      const viewLink = vLink;
      const downloadLink = dLink;

      console.log('Upload successful, got links:', { viewLink, downloadLink });

      // Update patient document with new links
      // Debug patient data structure
      console.log('Full report object:', report);
      
      // Get patient data - check all possible paths
      let patientData;
      if (report.patient && report.patient._id) {
        patientData = report.patient;
      } else if (report.reportDisplayData && report.reportDisplayData.patient && report.reportDisplayData.patient._id) {
        patientData = report.reportDisplayData.patient;
      } else if (report.patientId) {
        patientData = {
          _id: report.patientId,
          name: report.patientName || 'Unknown Patient'
        };
      }

      console.log('Found patient data:', patientData);

      if (!patientData || !patientData._id) {
        throw new Error('Could not find valid patient ID in report. Available data: ' + 
          JSON.stringify({
            reportId: report._id,
            hasPatient: !!report.patient,
            hasDisplayData: !!report.reportDisplayData,
            patientId: report.patientId
          }));
      }

      try {
        // Use the same structure as the working implementation
        const result = await saveUpdationLinks(patientData._id, {
          viewLink,
          downloadLink,
          updatedAt: new Date(),
          patientName: patientData.name
        });
        console.log('Save result:', result);

        // Set success message
        setSnackbar({
          open: true,
          message: 'Updation links saved to server for this patient.',
          severity: 'success'
        });

        // Reload the page to show updated links
        window.location.reload();
      } catch (err) {
        console.error('Detailed error saving links:', err);
        throw new Error('Failed to save updation links to server: ' + (err.response?.data?.error || err.message || 'Unknown error'));
      }

      // Set success message
      setSnackbar({
        open: true,
        message: 'Updation links saved to server for this patient.',
        severity: 'success'
      });

      // Update the UI to reflect changes
      await fetchReports();

    } catch (error) {
      console.error('Error:', error);
      if (error.message?.includes('401')) {
        handleSignOut();
        handleDriveAuth();
      }
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred while processing your request',
        severity: 'error'
      });
    } finally {
      // Clear uploading state
      const updatedReports = reports.map(r => 
        r._id === report._id ? { ...r, uploading: false } : r
      );
      setReports(updatedReports);
    }
  };

  const handleUpdatePdf = async (report) => {
    if (!report.reportDisplayData || !report.reportDisplayData.patient) {
      setSnackbar({
        open: true,
        message: 'Report data not found',
        severity: 'error'
      });
      return;
    }

    if (!report.patient?.updationLinks?.viewLink) {
      setSnackbar({
        open: true,
        message: 'No existing view link found to update',
        severity: 'error'
      });
      return;
    }

    try {
      // Extract fileId from viewLink
      const fileId = report.patient.updationLinks.viewLink.split('/')[5];
      if (!fileId) {
        throw new Error('Could not extract file ID from view link');
      }

      // Set updating state
      const updatedReports = reports.map(r => 
        r._id === report._id ? { ...r, updating: true } : r
      );
      setReports(updatedReports);

      // Create PDF document
      const printDoc = (
        <ReportDocument 
          patient={report.reportDisplayData.patient}
          testTables={report.reportDisplayData.testTables || []}
          isPrinting={false}
          removedImages={new Set(report.reportDisplayData.removedImages || [])}
          tableNotes={report.reportDisplayData.tableNotes || {}}
        />
      );
      
      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(printDoc).toBlob();
      
      // Update the file in Google Drive
      await updateGoogleDriveFile(fileId, blob);

      setSnackbar({
        open: true,
        message: 'PDF updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating PDF:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Error updating PDF. Please try again.',
        severity: 'error'
      });
    } finally {
      // Reset updating state
      const updatedReports = reports.map(r => 
        r._id === report._id ? { ...r, updating: false } : r
      );
      setReports(updatedReports);
    }
  };

  // Initialize Google Drive integration on component mount
  // Function to verify token validity
  const verifyToken = async (token) => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token);
      return response.ok;
    } catch {
      return false;
    }
  };

  // Periodic token validation
  useEffect(() => {
    if (driveAuthorized) {
      const validateInterval = setInterval(async () => {
        const token = localStorage.getItem('googleDriveAccessToken');
        if (token) {
          const isValid = await verifyToken(token);
          if (!isValid) {
            handleSignOut();
          }
        }
      }, 300000); // Check every 5 minutes

      return () => clearInterval(validateInterval);
    }
  }, [driveAuthorized, handleSignOut]);

  useEffect(() => {
    const init = async () => {
      try {
        setGisLoading(true);
        
        // Load the Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        document.body.appendChild(script);

        // Wait for script to load
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });

        // Initialize token client using the context
        initializeTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.file',
          prompt: 'select_account'
        });
      } catch (error) {
        console.error('Google Identity Services initialization error:', error);
      } finally {
        setGisLoading(false);
        setDriveAuthChecked(true);
      }
    };

    init();

    // No need to sign out on unmount since we're using shared context
    return () => {};
  }, [handleSignOut, initializeTokenClient]);

  const handleDriveAuth = async () => {
    try {
      setGisLoading(true);
      await handleSignIn();
    } catch (error) {
      console.error('Error during Google auth:', error);
    } finally {
      setGisLoading(false);
    }
  };

  const handleDriveUpload = async (report) => {
    if (!driveAuthorized || !tokenClient) {
      setError('Google Drive authorization required. Please sign in.');
      handleDriveAuth();
      return;
    }

    try {
      setUploadingToDrive(true);
      setError('');
      console.log('Starting Drive upload for report:', report._id);
      
      // Check auth state first
      if (!driveAuthorized) {
        console.log('Not authorized, requesting sign in');
        handleDriveAuth();
        throw new Error('Authorization required. Please try again after signing in.');
      }

      // Check access token
      const accessToken = localStorage.getItem('googleDriveAccessToken');
      if (!accessToken) {
        handleSignOut();
        handleDriveAuth();
        throw new Error('Authorization required. Please try again after signing in.');
      }

      // Generate PDF blob
      const pdfDoc = getReportDocumentFor(report, false); // Set to false to include background
      const pdfBlob = await pdf(pdfDoc).toBlob();

      // Create form data and metadata
      const metadata = {
        name: `Report_${report.reportDisplayData.patient?.name || 'Patient'}_${report.reportDisplayData.patient?.regNo || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`,
        mimeType: 'application/pdf'
      };
      
      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', pdfBlob);

      // Upload to Drive API
      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        
        // Handle auth errors specifically
        if (uploadResponse.status === 401) {
          handleSignOut(); // This will clean up auth state
          throw new Error('Google Drive authorization failed. Please try again.');
        }
        
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
      }
      
      const fileData = await uploadResponse.json();
      const fileId = fileData.id;

      // Make the file publicly accessible
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });

      // Generate public links
      const viewLink = `https://drive.google.com/file/d/${fileId}/view`;
      const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;

      // Update report with Drive info
      await updateReport(report._id, {
        driveFileId: fileId,
        driveViewLink: viewLink,
        driveDownloadLink: downloadLink,
        uploadStatus: 'uploaded'
      });

      // Refresh reports list
      await fetchReports();
      setSnackbar({
        open: true,
        message: 'Report uploaded to Google Drive successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      setSnackbar({
        open: true,
        message: 'Failed to upload report: ' + (error.message || 'Unknown error'),
        severity: 'error'
      });
      
      if (error.message?.includes('401')) {
        handleSignOut(); // This will clean up auth state
        handleDriveAuth();
      }
    } finally {
      setUploadingToDrive(false);
    }
  };

  const handleView = (report) => {
    setSelectedReport(report);
    setPreviewOpen(true);

    // Display Drive link status
    if (report.driveViewLink) {
      const fileId = report.driveFileId || extractFileIdFromDriveLink(report.driveViewLink);
      setSnackbar({
        open: true,
        message: `Drive Link Found - File ID: ${fileId}`,
        severity: 'info'
      });
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedReport(null);
  };

  // Function to show preview before updating PDF in Drive
  const handleUpdateCurrentPreview = async () => {
    if (!selectedReport) return;

    try {
      setSnackbar({
        open: true,
        message: 'Preparing preview of content to upload...',
        severity: 'info'
      });

      // Show the upload preview dialog
      setUploadPreviewOpen(true);
      return; // Stop here until user confirms from the dialog
    } catch (error) {
      console.error('Error preparing upload:', error);
      setSnackbar({
        open: true,
        message: `Failed to prepare upload: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setUploadingToDrive(false);
    }
  };
  
  // Separate function to handle the actual upload after preview confirmation
  const handleConfirmUpload = async () => {
    if (!selectedReport) return;

    try {
      setUploadingToDrive(true);

      // Get the view link from QR data
      // QR code contains the Drive view link when Drive is authorized
      if (!selectedReport.reportDisplayData?.qrImage) {
        setSnackbar({
          open: true,
          message: 'No QR code found with Drive link. Please generate QR first.',
          severity: 'error'
        });
        return;
      }

      // Extract file ID from the QR data (which contains the view link)
      const qrData = atob(selectedReport.reportDisplayData.qrImage.split(',')[1]);
      const fileId = extractFileIdFromDriveLink(qrData);
      
      if (!fileId) {
        setSnackbar({
          open: true,
          message: 'No Drive link found in QR. Please regenerate QR with Drive link.',
          severity: 'error'
        });
        return;
      }

      // 2. Check authentication
      const accessToken = tokenClient?.access_token || localStorage.getItem('googleDriveAccessToken');
      if (!accessToken) {
        setSnackbar({
          open: true,
          message: 'Drive authentication required. Please sign in.',
          severity: 'warning'
        });
        handleDriveAuth();
        return;
      }
      
      // Get the current state of the report for upload
      const pdfDoc = (
        <ReportDocument 
          patient={selectedReport.reportDisplayData.patient} 
          testTables={selectedReport.reportDisplayData.testTables} 
          isPrinting={false}
          removedImages={new Set(selectedReport.reportDisplayData.removedImages || [])} 
          tableNotes={selectedReport.reportDisplayData.tableNotes || {}}
          qrImage={selectedReport.reportDisplayData.qrImage}
          key={`preview-${Date.now()}`} // Force fresh render
        />
      );
      
      // Generate the PDF blob for upload
      const pdfBlob = await pdf(pdfDoc).toBlob();
      
      // Create a temporary URL for the PDF blob to preview
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open the PDF in a new window/tab for preview
      window.open(pdfUrl, '_blank');
      
      setSnackbar({
        open: true,
        message: 'PDF generated successfully, updating in Drive...',
        severity: 'info'
      });
      
      // Clean up the temporary URL after a short delay
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);

      // 4. Update file in Drive
      // Create a new PDF with all report data including QR
      const finalPdfDoc = (
        <ReportDocument 
          patient={selectedReport.reportDisplayData.patient} 
          testTables={selectedReport.reportDisplayData.testTables} 
          isPrinting={false}
          removedImages={new Set(selectedReport.reportDisplayData.removedImages || [])} 
          tableNotes={selectedReport.reportDisplayData.tableNotes || {}}
          qrImage={selectedReport.reportDisplayData.qrImage}
        />
      );
      
      // Generate the final PDF blob for upload
      const finalPdfBlob = await pdf(finalPdfDoc).toBlob();

      // Update file in Drive using the driveUpdater utility
      await updatePdfFile(fileId, finalPdfBlob, accessToken, {
        fileName: selectedReport.reportDisplayData.patient.name + '_report.pdf'
      });

      // Show success with verification details
      setSnackbar({
        open: true,
        message: `File successfully updated in Drive!`,
        severity: 'success'
      });

    } catch (error) {
      console.error('Error updating preview in Drive:', error);
      setSnackbar({
        open: true,
        message: `Failed to update file: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setUploadingToDrive(false);
    }
  };

  const extractFileIdFromDriveLink = (link) => {
    try {
      if (!link) return null;
      // Handle both view and download links
      if (link.includes('/file/d/')) {
        // Format: https://drive.google.com/file/d/FILE_ID/view
        const match = link.match(/\/file\/d\/(.*?)(\/|$)/);
        return match ? match[1] : null;
      } else if (link.includes('id=')) {
        // Format: https://drive.google.com/open?id=FILE_ID
        const match = link.match(/[?&]id=(.*?)(&|$)/);
        return match ? match[1] : null;
      }
    } catch (error) {
      console.error('Error extracting file ID:', error);
    }
    return null;
  };

  const handleUpdateInDrive = async (report) => {
    if (!driveAuthorized || !tokenClient) {
      setError('Google Drive authorization required. Please sign in.');
      handleDriveAuth();
      return;
    }

    if (!report.driveViewLink) {
      setSnackbar({ open: true, message: 'No Drive link found. Please upload to Drive first.', severity: 'error' });
      return;
    }

    try {
      setUploadingToDrive(true);
      setSnackbar({ open: true, message: 'Starting Drive update...', severity: 'info' });

      // Get the file ID from the stored link or directly from the report
      const fileId = report.driveFileId || extractFileIdFromDriveLink(report.driveViewLink);
      console.log('File ID extraction:', {
        fromDriveFileId: report.driveFileId,
        fromViewLink: extractFileIdFromDriveLink(report.driveViewLink),
        finalFileId: fileId
      });
      
      if (!fileId) {
        throw new Error('Could not find file ID. Drive file ID and view link are missing.');
      }

      // First check if we need to refresh the token
      const accessToken = tokenClient?.access_token || localStorage.getItem('googleDriveAccessToken');
      if (!accessToken) {
        console.log('No access token found, requesting new one');
        handleSignOut(); // This will clean up auth state
        handleDriveAuth();
        throw new Error('Authorization required. Please try again after signing in.');
      }

      // Generate new PDF blob
      console.log('Generating PDF for report:', {
        reportId: report._id,
        hasDisplayData: !!report.reportDisplayData,
        patientName: report.reportDisplayData?.patient?.name || 'Unknown',
        driveFileId: report.driveFileId,
        driveViewLink: report.driveViewLink
      });
      
      // Add delay to ensure proper rendering
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pdfDoc = getReportDocumentFor(report, false);
      console.log('PDF document generated, converting to blob...');
      
      let pdfBlob;
      try {
          pdfBlob = await pdf(pdfDoc).toBlob();
        console.log('PDF blob created successfully:', {
          size: pdfBlob.size,
          type: pdfBlob.type
        });
      } catch (pdfError) {
        console.error('Error generating PDF blob:', pdfError);
        throw new Error(`Failed to generate PDF: ${pdfError.message}`);
      }

      // Update file in Drive using update endpoint
      setSnackbar({
        open: true,
        message: `Step 1/4: Verifying Drive file (ID: ${fileId})...`,
        severity: 'info'
      });

      // First verify the file exists
      const checkFileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!checkFileResponse.ok) {
        throw new Error(`File not found in Drive. Status: ${checkFileResponse.status}`);
      }

      const fileInfo = await checkFileResponse.json();
      console.log('Found existing file in Drive:', fileInfo);
      
      setSnackbar({
        open: true,
        message: `Step 2/4: Found file "${fileInfo.name}" in Drive`,
        severity: 'info'
      });

      // Update the file
      setSnackbar({
        open: true,
        message: `Step 3/4: Uploading updated PDF (${(pdfBlob.size / 1024).toFixed(1)}KB)...`,
        severity: 'info'
      });

      const updateResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/pdf',
        },
        body: pdfBlob
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Update failed: ${updateResponse.status} ${errorText}`);
      }

      const updatedFileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,modifiedTime,size`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const updatedFile = await updatedFileResponse.json();
      console.log('Updated file info:', updatedFile);

      setSnackbar({
        open: true,
        message: (
          <Box>
            Step 4/4: Success! File updated ({(updatedFile.size / 1024).toFixed(1)}KB)
            <br />
            Modified at: {new Date(updatedFile.modifiedTime).toLocaleTimeString()}
            <br />
            <Link 
              href={`https://drive.google.com/file/d/${fileId}/view`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'inherit', textDecoration: 'underline' }}
            >
              View on Drive →
            </Link>
          </Box>
        ),
        severity: 'success'
      });

      if (!updateResponse.ok) {
        const errorResponse = await updateResponse.text();
        if (updateResponse.status === 401) {
          handleSignOut(); // This will clean up auth state and show error
          throw new Error('Google Drive authorization failed. Please try again.');
        }
        throw new Error(`Update failed: ${updateResponse.status} ${errorResponse}`);
      }

      setSnackbar({
        open: true,
        message: 'Report updated in Google Drive successfully',
        severity: 'success'
      });

    } catch (error) {
      console.error('Error updating file in Drive:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update report: ' + (error.message || 'Unknown error'),
        severity: 'error'
      });
      
      if (error.message?.includes('401')) {
        handleSignOut(); // This will clean up auth state
        handleDriveAuth();
      }
    } finally {
      setUploadingToDrive(false);
    }
  };

  const handleShareEmail = (report) => {
    console.log('Selected report for email:', report); // Log the selected report
    setEmailReport(report);
    setEmailDialogOpen(true);
  };

  const handleEmailSend = async () => {
    if (!emailReport) return;
    
    let email = '';
    if (emailRecipient === 'custom') {
      email = customEmail.trim();
    } else if (emailRecipient === 'doctor') {
      email = emailReport.reportDisplayData.patient?.refDoctor?.email || '';
    } else {
      email = emailReport.reportDisplayData.patient?.email || '';
    }

    if (!email || !email.includes('@') || !email.includes('.')) {
      setSnackbar({ open: true, message: 'Please enter a valid email address', severity: 'error' });
      return;
    }

    setSharingLoading(true);
    setSnackbar({ open: true, message: 'Preparing report for email...', severity: 'info' });
    try {
      // Check if report has Drive links
      if (!emailReport.driveViewLink || !emailReport.driveDownloadLink) {
        setSnackbar({ open: true, message: 'Please upload the report to Drive first', severity: 'warning' });
        setSharingLoading(false);
        return;
      }

      console.log('Email Report Data:', emailReport); // Log full report data
      const viewLink = emailReport.driveViewLink;
      const downloadLink = emailReport.driveDownloadLink;
      console.log('Drive links for email:', { viewLink, downloadLink }); // Debug log
      const emailBody = `Dear ${emailReport.reportDisplayData.patient?.name || 'Patient'},

Your medical test report is ready for viewing and download.

📋 *Report Details:*
- Patient: ${emailReport.reportDisplayData.patient?.name || 'N/A'}
- Reg No: ${emailReport.reportDisplayData.patient?.regNo || 'N/A'}
- Date: ${(() => {
    const d = new Date(emailReport.reportDisplayData.patient?.sampleCollectionDate || Date.now());
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  })()}

📥 *View Your Report:*
View online: ${viewLink}

📥 *Download Your Report:*
Download link: ${downloadLink}

⚠ *Important:* This report is for your personal use only. Please do not share it with others.

If you have any questions about your report, please contact us.

Best regards,
Your Diagnostic Center`;

      // Here you would send the email using your backend API
      // For demonstration, let's open the default email client
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent('Your Medical Test Report')}&body=${encodeURIComponent(emailBody)}`;
      window.open(mailtoUrl, '_blank');
      setSnackbar({ open: true, message: 'Email prepared with Google Drive links!', severity: 'success' });
      setEmailDialogOpen(false);
      setEmailReport(null);
      setCustomEmail('');
    } catch (err) {
      console.error('Error preparing email:', err);
      setSnackbar({ open: true, message: 'Failed to prepare email. Please try again.', severity: 'error' });
    } finally {
      setSharingLoading(false);
    }
  };

  const handleShareWhatsApp = (report) => {
    console.log('Selected report for WhatsApp:', report); // Log the selected report
    setWhatsAppReport(report);
    setWhatsAppDialogOpen(true);
  };

  const handleWhatsAppSend = async () => {
    if (!whatsAppReport) return;
    let number = '';
    if (whatsAppRecipient === 'custom') {
      number = customPhone.replace(/[^0-9]/g, '');
      if (!number) {
        setSnackbar({ open: true, message: 'Please enter a phone number', severity: 'error' });
        return;
      }
      number = number.replace(/^91/, '');
      number = '91' + number;
    } else if (whatsAppRecipient === 'doctor') {
      number = whatsAppReport.reportDisplayData.patient?.refDoctor?.contact || '';
      number = number.replace(/[^0-9]/g, '');
      if (number && !number.startsWith('91')) {
        number = '91' + number;
      }
    } else {
      number = whatsAppReport.reportDisplayData.patient?.mobileNumber || '';
      number = number.replace(/[^0-9]/g, '');
      if (number && !number.startsWith('91')) {
        number = '91' + number;
      }
    }
    if (!number || number.length < 10) {
      setSnackbar({ open: true, message: 'Please enter a valid phone number', severity: 'error' });
      return;
    }
    setSharingLoading(true);
    try {
      // Check if report has updation links
      if (!whatsAppReport.patient?.updationLinks?.viewLink || !whatsAppReport.patient?.updationLinks?.downloadLink) {
        setSnackbar({ open: true, message: 'No links available for this report', severity: 'warning' });
        setSharingLoading(false);
        return;
      }

      console.log('WhatsApp Report Data:', whatsAppReport); // Log full report data
      const viewLink = whatsAppReport.patient.updationLinks.viewLink;
      const downloadLink = whatsAppReport.patient.updationLinks.downloadLink;
      console.log('Drive links for WhatsApp:', { viewLink, downloadLink }); // Debug log
      let message = `Dear ${whatsAppReport.reportDisplayData.patient?.name || 'Patient'},\n\nYour medical test report is ready for viewing and download.\n\n📋 *Report Details:*\n- Patient: ${whatsAppReport.reportDisplayData.patient?.name || 'N/A'}\n- Reg No: ${whatsAppReport.reportDisplayData.patient?.regNo || 'N/A'}\n- Date: ${(() => {
    const d = new Date(whatsAppReport.reportDisplayData.patient?.sampleCollectionDate || Date.now());
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  })()}\n\n📥 *View Your Report:*\nView online: ${viewLink}\n\n📥 *Download Your Report:*\nDownload link: ${downloadLink}\n\n⚠ *Important:* This report is for your personal use only. Please do not share it with others.\n\nIf you have any questions about your report, please contact us.\n\nBest regards,\nYour Diagnostic Center`;
      const whatsappUrl = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      setSnackbar({ open: true, message: 'WhatsApp opened with Google Drive links!', severity: 'success' });
      setWhatsAppDialogOpen(false);
      setWhatsAppReport(null);
      setCustomPhone('');
    } catch (err) {
      console.error('Error opening WhatsApp:', err);
      setSnackbar({ open: true, message: 'Failed to prepare WhatsApp message. Please try again.', severity: 'error' });
    } finally {
      setSharingLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Filter and sort reports by selected date (show latest first)
  const filteredReports = reports
    .filter(r => {
      const reportDate = new Date(r.reportDisplayData?.patient?.sampleCollectionDate || r.createdAt);
      const reportDateString = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}-${String(reportDate.getDate()).padStart(2, '0')}`;
      return reportDateString === selectedDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.reportDisplayData?.patient?.sampleCollectionDate || a.createdAt);
      const dateB = new Date(b.reportDisplayData?.patient?.sampleCollectionDate || b.createdAt);
      return dateB - dateA;
    });

  return (
    <Box p={3}>
      <Typography variant="h5" sx={{ mb: 3 }}>Share Report</Typography>

      {/* Date Picker */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <TextField
          type="date"
          label="Select Date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => setSelectedDate(getLocalTodayString())}
        >
          Today
        </Button>
      </Box>


      {driveAuthChecked && !driveAuthorized && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="body1" color="warning.main">
              Google Drive is not connected. Please sign in to enable report uploads.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDriveAuth}
              disabled={!tokenClient}
            >
              Sign in to Google Drive
            </Button>
          </Box>
          {driveAuthError && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {driveAuthError}
            </Typography>
          )}
        </Paper>
      )}

      {driveAuthChecked && driveAuthorized && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Connected to Google Drive
        </Alert>
      )}

      {filteredReports.length === 0 ? (
        <Alert severity="info">No reports found for this date. Please create a report first or select another date.</Alert>
      ) : (
        <>
          {/* Only render the table if there are standard reports */}
          {filteredReports.some(r => r.reportDisplayData && Object.keys(r.reportDisplayData).length > 0) && (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Patient ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Patient Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Links</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredReports.filter(report => {
                    const hasDisplay = !!report.reportDisplayData && Object.keys(report.reportDisplayData).length > 0;
                    return hasDisplay;
                  }).map(report => {
    const patient = report.patient;
    const patientName = patient?.name || 'Unknown Patient';
    const patientId = patient?.regNo || '-';
    const patientMongoId = patient?._id;
    
    // Debug log for patient data
    console.log('Patient Data:', {
      patientName,
      patientId,
      mongoId: patientMongoId,
      hasUpdationLinks: !!patient?.updationLinks,
      updationLinksContent: {
        viewLink: patient?.updationLinks?.viewLink,
        downloadLink: patient?.updationLinks?.downloadLink,
        updatedAt: patient?.updationLinks?.updatedAt,
        patientName: patient?.updationLinks?.patientName
      },
      reportData: {
        patient: report.reportDisplayData?.patient,
        hasPatient: !!report.reportDisplayData?.patient,
        reportId: report._id
      }
    });                    // Debug logging
                    console.log('ShareReport Debug:', {
                      patientMongoId,
                      patientName,
                      patientId,
                      hasUpdationLinks: !!updationLinksMap[patientMongoId],
                      updationLinks: updationLinksMap[patientMongoId],
                      allLinks: updationLinksMap
                    });
                    
                    const reportDate = report.patient?.sampleCollectionDate || report.createdAt
                      ? new Date(report.reportDisplayData.patient?.sampleCollectionDate || report.createdAt).toLocaleDateString()
                      : '-';
                    
                    return (
                      <TableRow key={report._id}>
                        <TableCell>{patientId}</TableCell>
                        <TableCell>
                          <Typography variant="body1">{patientName}</Typography>
                        </TableCell>
                        <TableCell>{reportDate}</TableCell>
                        <TableCell>
                          {patient?.updationLinks ? (
                            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                              {patient.updationLinks.viewLink && (
                                <Link 
                                  href={patient.updationLinks.viewLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  sx={{ fontSize: '0.8rem', color: 'success.main', display: 'flex', alignItems: 'center' }}
                                >
                                  <LinkIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                                  View
                                </Link>
                              )}
                              {patient.updationLinks.downloadLink && (
                                <Link 
                                  href={patient.updationLinks.downloadLink}
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  sx={{ fontSize: '0.8rem', color: 'primary.main', display: 'flex', alignItems: 'center', ml: 1 }}
                                >
                                  <DownloadIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                                  Download
                                </Link>
                              )}
                              {patient.updationLinks.updatedAt && (
                                <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary', ml: 1 }}>
                                  ({new Date(patient.updationLinks.updatedAt).toLocaleDateString()})
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              No links available
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              onClick={() => handleShareWhatsApp(report)} 
                              startIcon={uploadingToDrive ? <CircularProgress size={14} /> : null}
                            >
                              {uploadingToDrive ? 'Preparing...' : 'WhatsApp'}
                            </Button>
                            <Box display="flex" gap={1}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleViewPdf(report)}
                                color="primary"
                                startIcon={<PreviewIcon />}
                              >
                                View
                              </Button>
                              {report.patient?.updationLinks?.viewLink ? (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleUpdatePdf(report)}
                                  color="warning"
                                  disabled={!report.reportDisplayData || !driveAuthorized}
                                  startIcon={report.updating ? <CircularProgress size={14} /> : <UpdateIcon />}
                                >
                                  {report.updating ? 'Updating...' : 'Update PDF'}
                                </Button>
                              ) : (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleUploadToDrive(report)}
                                  color="success"
                                  disabled={!report.reportDisplayData || !driveAuthorized}
                                  startIcon={report.uploading ? <CircularProgress size={14} /> : <CloudUploadIcon />}
                                >
                                  {report.uploading ? 'Uploading...' : 'Upload to Drive'}
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Print all note-only messages as plain text after the table */}
          {filteredReports.filter(r => r.note && (!r.reportDisplayData || Object.keys(r.reportDisplayData).length === 0)).map((report) => (
            <div key={report._id} style={{ marginTop: 8, marginBottom: 8, fontSize: '1rem', color: '#333' }}>
              {report.note}
            </div>
          ))}
        </>
      )}
      
      {/* Email Dialog */}
      {/* PDF Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handlePreviewClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Report Preview
          <IconButton
            onClick={handlePreviewClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            ×
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <PDFPreview 
              document={
                <ReportDocument 
                  patient={selectedReport.reportDisplayData.patient}
                  testTables={selectedReport.reportDisplayData.testTables || []}
                  isPrinting={false}
                  removedImages={new Set(selectedReport.reportDisplayData.removedImages || [])}
                  tableNotes={selectedReport.reportDisplayData.tableNotes || {}}
                />
              }
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Report via Email</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Send to</FormLabel>
            <RadioGroup
              value={emailRecipient}
              onChange={e => setEmailRecipient(e.target.value)}
            >
              <FormControlLabel value="patient" control={<Radio />} label="Patient" />
              <FormControlLabel value="doctor" control={<Radio />} label="Doctor" />
              <FormControlLabel value="custom" control={<Radio />} label="Custom Email" />
            </RadioGroup>
          </FormControl>
          {emailRecipient === 'custom' && (
            <TextField
              fullWidth
              label="Email Username"
              value={customEmail.replace(/@gmail\.com$/, '')} // Remove @gmail.com when displaying
              onChange={(e) => {
                const username = e.target.value.trim().replace(/@gmail\.com$/, '');
                // Store the complete email
                setCustomEmail(username ? `${username}@gmail.com` : '');
              }}
              onBlur={(e) => {
                const username = e.target.value.trim().replace(/@gmail\.com$/, '');
                if (username && !/^[a-zA-Z0-9._-]+$/.test(username)) {
                  setSnackbar({
                    open: true,
                    message: 'Please enter a valid Gmail username (letters, numbers, dots, and dashes only)',
                    severity: 'warning'
                  });
                }
              }}
              error={customEmail && !/^[a-zA-Z0-9._-]+@gmail\.com$/.test(customEmail)}
              helperText={(customEmail && !/^[a-zA-Z0-9._-]+@gmail\.com$/.test(customEmail)) ? 
                "Please enter a valid Gmail username" : 
                `Will be sent to: ${customEmail || 'username@gmail.com'}`}
              sx={{ mb: 2 }}
              placeholder="Enter Gmail username (e.g., username)"
              InputProps={{
                endAdornment: <span style={{color: 'rgba(0, 0, 0, 0.6)'}}>@gmail.com</span>,
              }}
            />
          )}
          {(sharingLoading || uploadingToDrive) && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {uploadingToDrive ? 'Uploading PDF to Google Drive...' : 'Sending email...'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)} disabled={sharingLoading || uploadingToDrive}>Cancel</Button>
          <Button 
            onClick={handleEmailSend} 
            variant="contained" 
            disabled={sharingLoading || uploadingToDrive}
            startIcon={(sharingLoading || uploadingToDrive) ? <CircularProgress size={20} /> : null}
          >
            {uploadingToDrive ? 'Uploading to Drive...' : sharingLoading ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={whatsAppDialogOpen} onClose={() => setWhatsAppDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Report via WhatsApp</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Share with</FormLabel>
            <RadioGroup
              value={whatsAppRecipient}
              onChange={e => setWhatsAppRecipient(e.target.value)}
            >
              <FormControlLabel value="patient" control={<Radio />} label="Patient" />
              <FormControlLabel value="doctor" control={<Radio />} label="Doctor" />
              <FormControlLabel value="custom" control={<Radio />} label="Custom Phone" />
            </RadioGroup>
          </FormControl>
          {whatsAppRecipient === 'custom' && (
            <TextField
              fullWidth
              label="Phone Number"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              placeholder="e.g., 1234567890"
              sx={{ mb: 2 }}
            />
          )}
          {(sharingLoading || uploadingToDrive) && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {uploadingToDrive ? 'Uploading PDF to Google Drive...' : 'Preparing WhatsApp message...'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWhatsAppDialogOpen(false)} disabled={sharingLoading || uploadingToDrive}>Cancel</Button>
          <Button 
            onClick={handleWhatsAppSend} 
            variant="contained" 
            disabled={sharingLoading || uploadingToDrive}
            startIcon={(sharingLoading || uploadingToDrive) ? <CircularProgress size={20} /> : null}
          >
            {uploadingToDrive ? 'Uploading to Drive...' : sharingLoading ? 'Opening...' : 'Open WhatsApp'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Upload Preview Dialog */}
      <Dialog open={uploadPreviewOpen} onClose={() => setUploadPreviewOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Content Being Uploaded
          <IconButton
            onClick={() => setUploadPreviewOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            ×
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedReport && selectedReport.reportDisplayData && (
            <PDFPreview
              document={
                <ReportDocument 
                  patient={selectedReport.reportDisplayData.patient} 
                  testTables={selectedReport.reportDisplayData.testTables} 
                  isPrinting={false}
                  removedImages={new Set(selectedReport.reportDisplayData.removedImages || [])} 
                  tableNotes={selectedReport.reportDisplayData.tableNotes || {}}
                  qrImage={selectedReport.reportDisplayData.qrImage}
                  key={`upload-preview-${Date.now()}`}
                />
              }
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadPreviewOpen(false)} color="primary">Close</Button>
          <Button onClick={() => {
            setUploadPreviewOpen(false);
            handleConfirmUpload();
          }} color="primary" variant="contained">
            Proceed with Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="lg" fullWidth>
        <DialogTitle>
          Report Preview
          <IconButton
            onClick={handleClosePreview}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            ×
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedReport && selectedReport.reportDisplayData && (
            <>
              {/* Drive Link Status */}
              {selectedReport.driveViewLink && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Drive Link: {selectedReport.driveViewLink}
                  </Typography>
                  <Typography variant="body2">
                    File ID: {selectedReport.driveFileId || extractFileIdFromDriveLink(selectedReport.driveViewLink)}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Report {selectedReport._id} - {selectedReport.reportDisplayData.patient?.name} 
                    ({new Date(selectedReport.reportDate).toLocaleString()})
                  </Typography>
                </Alert>
              )}
              
              <Box sx={{ position: 'relative' }}>
                <PDFPreview 
                  document={
                    <ReportDocument 
                      patient={selectedReport.reportDisplayData.patient} 
                      testTables={selectedReport.reportDisplayData.testTables}
                      isPrinting={false}
                      removedImages={new Set(selectedReport.reportDisplayData.removedImages || [])} 
                      tableNotes={selectedReport.reportDisplayData.tableNotes || {}}
                      qrImage={selectedReport.reportDisplayData.qrImage}
                      key={`preview-${selectedReport._id}-${Date.now()}`}
                    />
                  } 
                />
                {uploadingToDrive && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: 'rgba(255,255,255,0.8)' 
                    }}
                  >
                    <Box 
                      sx={{ 
                        textAlign: 'center',
                        backgroundColor: 'white',
                        p: 3,
                        borderRadius: 1,
                        boxShadow: 1
                      }}
                    >
                      <CircularProgress size={40} sx={{ mb: 2 }} />
                      <Typography variant="h6">
                        Updating in Drive...
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This may take a few moments
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {selectedReport?.driveViewLink && (
            <>
              <Button
                onClick={() => window.open(selectedReport.driveViewLink, '_blank')}
                startIcon={<LinkIcon />}
                sx={{ mr: 'auto' }}
              >
                Open in Drive
              </Button>
              <Button
                onClick={handleUpdateCurrentPreview}
                variant="contained"
                color="primary"
                disabled={uploadingToDrive || !driveAuthorized}
                startIcon={uploadingToDrive ? <CircularProgress size={20} /> : null}
                sx={{ mr: 1 }}
              >
                {uploadingToDrive ? 'Updating...' : 'Update in Drive'}
              </Button>
            </>
          )}
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShareReport;