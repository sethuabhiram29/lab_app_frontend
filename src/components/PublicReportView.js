import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Container,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';
import { pdf } from '@react-pdf/renderer';
import PDFPreview from './PDFPreview';
import { ReportDocument } from './CreateReport';
import api from '../api';

const PublicReportView = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/public/${reportId}`);
      setReport(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Report not found or access denied');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!report || !report.reportDisplayData) return;
    
    try {
      const doc = (
        <ReportDocument 
          patient={report.reportDisplayData.patient} 
          testTables={report.reportDisplayData.testTables} 
          isPrinting={true}
          removedImages={new Set(report.reportDisplayData.removedImages || [])}
          tableNotes={report.reportDisplayData.tableNotes || {}}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${report.patient?.name || reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/')}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!report || !report.reportDisplayData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          This report is not available for viewing.
        </Alert>
      </Container>
    );
  }

  return (
    <Box>
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Medical Test Report
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
          <Button 
            color="inherit" 
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ ml: 1 }}
          >
            Print
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 3 }}>
            Medical Test Report
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Patient Information
            </Typography>
            <Typography variant="body1">
              <strong>Name:</strong> {report.reportDisplayData.patient?.name}
            </Typography>
            <Typography variant="body1">
              <strong>Age:</strong> {report.reportDisplayData.patient?.age} years
            </Typography>
            <Typography variant="body1">
              <strong>Gender:</strong> {report.reportDisplayData.patient?.gender}
            </Typography>
            <Typography variant="body1">
              <strong>Report Date:</strong> {(() => {
                const d = new Date(report.reportDate);
                return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
              })()}
            </Typography>
          </Box>

          <PDFPreview 
            document={
              <ReportDocument 
                patient={report.reportDisplayData.patient} 
                testTables={report.reportDisplayData.testTables} 
                isPrinting={true}
                removedImages={new Set(report.reportDisplayData.removedImages || [])} 
                tableNotes={report.reportDisplayData.tableNotes || {}}
              />
            } 
          />
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicReportView; 