/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import { useGoogleDrive } from '../contexts/GoogleDriveContext';
import {
  Box,
  Container,
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
import {
  Search as SearchIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Event as EventIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  CloudQueue as CloudQueueIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { Avatar, InputAdornment, OutlinedInput, Chip } from '@mui/material';
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
import CloseIcon from '@mui/icons-material/Close';
import { updatePdfFile } from '../utils/driveUpdater';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Slide } from '@mui/material';

// ── Framer Motion Variants ───────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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
  const prefersReduced = useReducedMotion();
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

  // Calculate stats for the summary cards
  const totalReports = filteredReports.length;
  const withLinks = filteredReports.filter(r => r.patient?.updationLinks?.viewLink || r.patient?.updationLinks?.downloadLink).length;
  const pendingLinks = totalReports - withLinks;

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };
  const scaleUp = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'url(/share_bg_light.png) center/cover no-repeat fixed', pb: 8 }}>
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: { xs: 4, md: 8 } }}>
        <AnimatePresence>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            
            {/* Header Section */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 6, gap: 3 }}>
              <motion.div variants={fadeUp}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.1em', mb: 1, textTransform: 'uppercase' }}>
                  DISPATCH
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 900, color: '#0F172A', mb: 1, fontSize: { xs: '2rem', md: '2.5rem' }, letterSpacing: '-0.02em', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Share Report
                </Typography>
                <Typography sx={{ color: 'var(--text-secondary)', maxWidth: 500, fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Distribute patient reports securely via WhatsApp, Email, or direct links. Connect Google Drive to enable cloud sharing.
                </Typography>
              </motion.div>

              <motion.div variants={scaleUp}>
                {driveAuthChecked && (
                  driveAuthorized ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={<CheckCircleOutlineIcon sx={{ color: '#8B5CF6 !important' }} />}
                        label="Google Drive Connected"
                        sx={{ background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontWeight: 700, borderRadius: '100px', border: '1px solid rgba(139,92,246,0.2)' }}
                      />
                    </Box>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<CloudQueueIcon />}
                      onClick={handleDriveAuth}
                      disabled={!tokenClient}
                      sx={{
                        background: '#8B5CF6', color: '#fff', fontWeight: 700, px: 4, py: 1.5,
                        borderRadius: '100px', textTransform: 'none', fontSize: '0.95rem',
                        boxShadow: '0 8px 24px rgba(139,92,246,0.3)',
                        '&:hover': { background: '#7C3AED', boxShadow: '0 12px 32px rgba(139,92,246,0.4)' },
                      }}
                    >
                      Connect Google Drive
                    </Button>
                  )
                )}
              </motion.div>
            </Box>

            {/* Stats Cards Section */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 6 }}>
              {[
                { title: 'TOTAL REPORTS', value: totalReports, delay: 0 },
                { title: 'WITH LINKS', value: withLinks, delay: 0.1 },
                { title: 'PENDING UPLOAD', value: pendingLinks, delay: 0.2 },
                { title: 'SHARED TODAY', value: '-', delay: 0.3 }
              ].map((stat, idx) => (
                <motion.div key={idx} variants={scaleUp} custom={stat.delay}>
                  <Box sx={{
                    p: 3, borderRadius: '24px', background: 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 100%)',
                    backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)', position: 'relative', overflow: 'hidden'
                  }}>
                    <Box sx={{
                      position: 'absolute', top: 0, right: 0, bottom: 0, left: '50%',
                      background: 'radial-gradient(circle at center right, rgba(139,92,246,0.1) 0%, transparent 70%)', zIndex: 0
                    }} />
                    <Typography sx={{ position: 'relative', zIndex: 1, fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography sx={{ position: 'relative', zIndex: 1, fontSize: '2.5rem', fontWeight: 900, color: '#0F172A', fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Box>

            {/* Main Table Container */}
            <motion.div variants={fadeUp}>
              <Box sx={{
                borderRadius: '32px', background: 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 100%)', backdropFilter: 'blur(24px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.6)', overflow: 'hidden', mb: 4
              }}>
                {/* Table Toolbar */}
                <Box sx={{ p: 3, px: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(30,41,59,0.05)', gap: 3 }}>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' } }}>
                    <TextField
                      type="date"
                      size="small"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '100px', background: '#F8FAFC', fontWeight: 600, width: 160 } }}
                    />
                    <Button 
                      onClick={() => setSelectedDate(getLocalTodayString())}
                      sx={{ borderRadius: '100px', px: 3, color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.3)', fontWeight: 600, '&:hover': { background: 'rgba(139,92,246,0.05)' } }}
                    >
                      Today
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', md: 'auto' } }}>
                    <OutlinedInput
                      size="small"
                      placeholder="Search patient..."
                      startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: 'var(--text-secondary)' }} /></InputAdornment>}
                      sx={{ borderRadius: '100px', width: { xs: '100%', md: 240 }, background: '#F8FAFC' }}
                    />
                  </Box>

                </Box>

                {/* Table Content */}
                {filteredReports.length === 0 ? (
                  <Box p={6} textAlign="center">
                    <Typography color="textSecondary">No reports found for this date.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 800 }}>
                      <TableHead>
                        <TableRow sx={{ '& th': { borderBottom: 'none', py: 3 } }}>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', pl: 5 }}>ID</TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em' }}>PATIENT</TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em' }}>DATE</TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em' }}>DRIVE LINKS</TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', align: 'right', pr: 5 }}>ACTIONS</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence>
                          {filteredReports.filter(report => {
                            const hasDisplay = !!report.reportDisplayData && Object.keys(report.reportDisplayData).length > 0;
                            return hasDisplay;
                          }).map((report, idx) => {
                            const patient = report.patient;
                            const patientName = patient?.name || 'Unknown Patient';
                            const patientId = patient?.regNo || '-';
                            const simpleId = (patientId || '').toString().replace(/^0+/, '');
                            const reportDate = patient?.sampleCollectionDate || report.createdAt
                              ? (() => {
                                  const d = new Date(report.reportDisplayData?.patient?.sampleCollectionDate || report.createdAt);
                                  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                                })()
                              : '-';
                            
                            const hasLinks = !!(patient?.updationLinks?.viewLink || patient?.updationLinks?.downloadLink);

                            return (
                              <motion.tr
                                key={report._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ 
                                  scale: 1.005,
                                  backgroundColor: 'rgba(139,92,246,0.03)',
                                  boxShadow: 'inset 4px 0 0 #8B5CF6'
                                }}
                                style={{ 
                                  borderBottom: '1px solid rgba(30,41,59,0.03)',
                                  transition: 'background-color 0.2s ease, box-shadow 0.2s ease'
                                }}
                              >
                                <TableCell sx={{ pl: 5, borderBottom: 'none' }}>
                                  <Typography sx={{ fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.85rem' }}># {simpleId || idx+1}</Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: 'none' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ bgcolor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', fontWeight: 800, fontSize: '0.9rem', width: 40, height: 40 }}>
                                      {patientName.substring(0,2).toUpperCase()}
                                    </Avatar>
                                    <Box>
                                      <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{patientName}</Typography>
                                      <Typography sx={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Patient ID • {patientId}</Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ borderBottom: 'none' }}>
                                  <Typography sx={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{reportDate}</Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: 'none' }}>
                                  {hasLinks ? (
                                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                                      {patient.updationLinks.viewLink && (
                                        <Link 
                                          href={patient.updationLinks.viewLink} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          sx={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', fontWeight: 800, textDecoration: 'none', background: 'rgba(16,185,129,0.1)', px: 1.5, py: 0.5, borderRadius: '100px' }}
                                        >
                                          <LinkIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} /> View
                                        </Link>
                                      )}
                                      {patient.updationLinks.downloadLink && (
                                        <Link 
                                          href={patient.updationLinks.downloadLink}
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          sx={{ fontSize: '0.75rem', color: '#3B82F6', display: 'flex', alignItems: 'center', fontWeight: 800, textDecoration: 'none', background: 'rgba(59,130,246,0.1)', px: 1.5, py: 0.5, borderRadius: '100px' }}
                                        >
                                          <DownloadIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} /> Download
                                        </Link>
                                      )}
                                    </Box>
                                  ) : (
                                    <Chip
                                      icon={<RadioButtonUncheckedIcon sx={{ color: 'var(--text-muted) !important' }} />}
                                      label="No links"
                                      size="small"
                                      sx={{ background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, borderRadius: '100px', border: '1px solid var(--border-light)' }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell align="right" sx={{ pr: 5, borderBottom: 'none' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<PreviewIcon sx={{ fontSize: '1rem' }} />}
                                      onClick={() => handleViewPdf(report)}
                                      sx={{ borderRadius: '100px', color: 'var(--text-secondary)', borderColor: 'var(--border-light)', fontWeight: 700, textTransform: 'none', '&:hover': { background: '#F8FAFC' } }}
                                    >
                                      View
                                    </Button>
                                    <Button 
                                      variant="contained" 
                                      size="small" 
                                      onClick={() => handleShareWhatsApp(report)} 
                                      startIcon={<WhatsAppIcon sx={{ fontSize: '1rem' }} />}
                                      sx={{ borderRadius: '100px', background: '#22C55E', color: '#fff', fontWeight: 700, textTransform: 'none', boxShadow: 'none', '&:hover': { background: '#16A34A', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' } }}
                                    >
                                      WhatsApp
                                    </Button>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      onClick={() => handleEmailShare(report)}
                                      startIcon={<EmailIcon sx={{ fontSize: '1rem' }} />}
                                      sx={{ borderRadius: '100px', background: '#8B5CF6', color: '#fff', fontWeight: 700, textTransform: 'none', boxShadow: 'none', '&:hover': { background: '#7C3AED', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' } }}
                                    >
                                      Email
                                    </Button>
                                  </Box>
                                </TableCell>
                              </motion.tr>
                            );
                          })}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Dialogs */}
        <Dialog open={whatsAppDialogOpen} onClose={() => setWhatsAppDialogOpen(false)} PaperProps={{ sx: { borderRadius: '24px' } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Share via WhatsApp</DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>Select Recipient</FormLabel>
              <RadioGroup value={whatsAppRecipient} onChange={(e) => { setWhatsAppRecipient(e.target.value); setCustomPhone(''); }}>
                <FormControlLabel value="patient" control={<Radio color="primary" />} label={`Patient (${whatsAppReport?.reportDisplayData.patient?.mobileNumber || 'N/A'})`} />
                <FormControlLabel value="doctor" control={<Radio color="primary" />} label={`Doctor (${whatsAppReport?.reportDisplayData.patient?.refDoctor?.contact || 'N/A'})`} />
                <FormControlLabel value="custom" control={<Radio color="primary" />} label="Custom Number" />
              </RadioGroup>
            </FormControl>
            {whatsAppRecipient === 'custom' && (
              <TextField fullWidth margin="normal" label="Custom Phone Number (10 digits)" value={customPhone} onChange={(e) => setCustomPhone(e.target.value)} placeholder="Enter 10 digit mobile number" size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setWhatsAppDialogOpen(false)} sx={{ borderRadius: '100px', fontWeight: 700 }}>Cancel</Button>
            <Button onClick={handleWhatsAppSend} variant="contained" disabled={sharingLoading} sx={{ background: '#22C55E', color: '#fff', borderRadius: '100px', fontWeight: 700, '&:hover': { background: '#16A34A' } }}>
              {sharingLoading ? 'Preparing...' : 'Open WhatsApp'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} PaperProps={{ sx: { borderRadius: '24px' } }}>
          <DialogTitle sx={{ fontWeight: 800 }}>Share via Email</DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>Select Recipient</FormLabel>
              <RadioGroup value={emailRecipient} onChange={(e) => { setEmailRecipient(e.target.value); setCustomEmail(''); }}>
                <FormControlLabel value="patient" control={<Radio color="primary" />} label={`Patient (${emailReport?.reportDisplayData.patient?.email || 'N/A'})`} />
                <FormControlLabel value="doctor" control={<Radio color="primary" />} label={`Doctor (${emailReport?.reportDisplayData.patient?.refDoctor?.email || 'N/A'})`} />
                <FormControlLabel value="custom" control={<Radio color="primary" />} label="Custom Email" />
              </RadioGroup>
            </FormControl>
            {emailRecipient === 'custom' && (
              <TextField fullWidth margin="normal" label="Custom Email Address" value={customEmail} onChange={(e) => setCustomEmail(e.target.value)} placeholder="Enter email address" size="small" type="email" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={() => setEmailDialogOpen(false)} sx={{ borderRadius: '100px', fontWeight: 700 }}>Cancel</Button>
            <Button onClick={handleEmailSend} variant="contained" disabled={sharingLoading} sx={{ background: '#8B5CF6', color: '#fff', borderRadius: '100px', fontWeight: 700, '&:hover': { background: '#7C3AED' } }}>
              {sharingLoading ? 'Preparing...' : 'Open Email Client'}
            </Button>
          </DialogActions>
        </Dialog>

        {previewOpen && (
          <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '24px' } }}>
            <DialogTitle sx={{ fontWeight: 800 }}>Report Preview <IconButton onClick={() => setPreviewOpen(false)} sx={{ float: 'right' }}><CloseIcon /></IconButton></DialogTitle>
            <DialogContent>
              {selectedReport && getReportDocumentFor(selectedReport, false) && (
                <PDFPreview document={getReportDocumentFor(selectedReport, false)} />
              )}
            </DialogContent>
          </Dialog>
        )}

        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
        </Snackbar>

      </Container>
    </Box>
  );
}

export default ShareReport;
