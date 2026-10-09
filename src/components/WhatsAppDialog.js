/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Paper,
  Slide,
  Tooltip
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  QrCode2 as QrCodeIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Person as PersonIcon,
  LocalHospital as DoctorIcon,
  PhoneIphone as PhoneIcon,
  LinkOff as LinkOffIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { pdf } from '@react-pdf/renderer';
import { ReportDocument } from './CreateReport';
import {
  getWhatsAppStatus,
  getWhatsAppQR,
  sendWhatsAppReport,
  disconnectWhatsApp,
  reconnectWhatsApp
} from '../api';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Helper to convert blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const WhatsAppDialog = ({ open, onClose, report, onSentSuccess }) => {
  const [statusData, setStatusData] = useState({
    status: 'connecting',
    connected: false,
    phone: null,
    pushName: null,
    qr: null
  });
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipientType, setRecipientType] = useState('patient');
  const [customPhone, setCustomPhone] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [polling, setPolling] = useState(true);
  const pollTimerRef = useRef(null);

  // Extract patient and doctor details from report
  const patient = report?.reportDisplayData?.patient || report?.patient || {};
  const patientPhone = patient.mobileNumber || patient.phone || '';
  const refDoctor = patient.refDoctor || {};
  const doctorPhone = typeof refDoctor === 'object' ? (refDoctor.contact || refDoctor.phone || '') : '';
  const doctorName = typeof refDoctor === 'object' ? (refDoctor.name || '') : String(refDoctor);

  // Pre-fill caption on report change
  useEffect(() => {
    if (report) {
      const pName = patient.name || 'Patient';
      const regNo = patient.regNo ? ` (Reg No: ${patient.regNo})` : '';
      setCaption(
        `Dear ${pName},\n\nYour diagnostic test report${regNo} from *Sri Sai Durga Diagnostics* is attached as a PDF.\n\nFor any queries, please feel free to reach out to our laboratory.\n\nThank you for choosing *Sri Sai Durga Diagnostics*.`
      );
    }
  }, [report]);

  // Fetch status & QR code
  const fetchStatus = async () => {
    try {
      const data = await getWhatsAppStatus();
      setStatusData(data);
      if (data.connected) {
        setError('');
      }
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
    }
  };

  // Poll status while open until connected
  useEffect(() => {
    if (!open) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    fetchStatus();
    pollTimerRef.current = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [open]);

  // Refresh QR
  const handleRefreshQR = async () => {
    setLoadingStatus(true);
    setError('');
    try {
      await reconnectWhatsApp();
      await fetchStatus();
    } catch (err) {
      setError('Failed to refresh QR code');
    } finally {
      setLoadingStatus(false);
    }
  };

  // Disconnect / Unlink account
  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to unlink this WhatsApp account?')) return;
    setLoadingStatus(true);
    setError('');
    try {
      await disconnectWhatsApp();
      await fetchStatus();
      setSuccess('WhatsApp unlinked. Scan new QR code to pair another number.');
    } catch (err) {
      setError('Failed to unlink WhatsApp');
    } finally {
      setLoadingStatus(false);
    }
  };

  // Resolve target phone number
  const getSelectedPhone = () => {
    if (recipientType === 'patient') return patientPhone;
    if (recipientType === 'doctor') return doctorPhone;
    return customPhone;
  };

  // Handle Send Report PDF
  const handleSendReport = async () => {
    setError('');
    setSuccess('');
    const phone = getSelectedPhone();
    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      setError('Please provide a valid 10-digit mobile number for recipient.');
      return;
    }

    if (!report?.reportDisplayData) {
      setError('Report display data is missing. Please save or view the report first.');
      return;
    }

    setSending(true);

    try {
      // 1. Generate PDF Document blob from reportDisplayData
      const pdfDoc = (
        <ReportDocument
          patient={report.reportDisplayData.patient}
          testTables={report.reportDisplayData.testTables || []}
          isPrinting={false}
          removedImages={new Set(report.reportDisplayData.removedImages || [])}
          tableNotes={report.reportDisplayData.tableNotes || {}}
          qrImage={report.reportDisplayData.qrImage}
          reportDate={report.reportDate}
        />
      );

      const pdfBlob = await pdf(pdfDoc).toBlob();
      const base64Data = await blobToBase64(pdfBlob);

      // Clean file name
      const safePatientName = (patient.name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
      const safeRegNo = (patient.regNo || 'Report').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${safePatientName}_${safeRegNo}_Report.pdf`;

      // 2. Send via Backend WhatsApp Baileys Service
      const result = await sendWhatsAppReport({
        recipientType,
        phone,
        reportId: report._id,
        pdfBase64: base64Data,
        fileName,
        caption
      });

      setSuccess(`Report PDF successfully sent to ${phone} via WhatsApp!`);
      if (onSentSuccess) onSentSuccess(result);

      // Auto close after brief success display
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2500);

    } catch (err) {
      console.error('Error sending WhatsApp report:', err);
      setError(err.response?.data?.message || err.message || 'Failed to send PDF report via WhatsApp.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={sending ? null : onClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 24px 48px rgba(15, 110, 86, 0.2)'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #0F6E56 0%, #0B5240 100%)',
          color: '#fff',
          px: 3,
          py: 2.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              background: '#25D366',
              color: '#fff',
              width: 38,
              height: 38,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)'
            }}
          >
            <WhatsAppIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>
              Send Report via WhatsApp
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem' }}>
              Direct PDF dispatch powered by Baileys Multi-Device
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} disabled={sending} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 3 }}>
        {/* Status Badge */}
        <Box
          sx={{
            mb: 2.5,
            p: 1.5,
            borderRadius: '16px',
            background: statusData.connected ? 'rgba(37, 211, 102, 0.1)' : 'rgba(234, 179, 8, 0.1)',
            border: `1px solid ${statusData.connected ? 'rgba(37, 211, 102, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: statusData.connected ? '#10B981' : '#F59E0B',
                boxShadow: `0 0 0 3px ${statusData.connected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
              }}
            />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                {statusData.connected
                  ? `Connected: +${statusData.phone || ''} (${statusData.pushName || 'Lab'})`
                  : 'WhatsApp Device Not Linked'}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                {statusData.connected
                  ? 'Ready to dispatch PDF reports instantly'
                  : 'Scan the QR code below using WhatsApp on your phone'}
              </Typography>
            </Box>
          </Box>

          {statusData.connected && (
            <Tooltip title="Unlink this WhatsApp account">
              <IconButton size="small" onClick={handleDisconnect} disabled={loadingStatus} sx={{ color: '#EF4444' }}>
                <LinkOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
            {success}
          </Alert>
        )}

        {/* Pairing View if Not Connected */}
        {!statusData.connected ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 2,
              px: 2,
              borderRadius: '20px',
              background: '#ffffff',
              border: '1px solid rgba(15, 110, 86, 0.15)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
              Link Lab WhatsApp Device
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 2, fontSize: '0.82rem' }}>
              Open WhatsApp on your phone → Settings / 3 dots → <b>Linked Devices</b> → <b>Link a Device</b> → Scan this QR code:
            </Typography>

            {statusData.qr ? (
              <Box sx={{ display: 'inline-block', p: 1.5, background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                <img src={statusData.qr} alt="WhatsApp QR Code" style={{ width: 220, height: 220, display: 'block' }} />
              </Box>
            ) : (
              <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={36} sx={{ color: '#0F6E56' }} />
                <Typography variant="caption" sx={{ color: '#64748B' }}>
                  Generating active QR code session...
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefreshQR}
                disabled={loadingStatus}
                sx={{ borderRadius: '100px', textTransform: 'none', borderColor: '#CBD5E1', color: '#475569' }}
              >
                Refresh QR Code
              </Button>
            </Box>
          </Box>
        ) : (
          /* Report Sending View if Connected */
          <Box>
            {/* Report Document Chip */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2.5,
                borderRadius: '16px',
                background: 'rgba(15, 110, 86, 0.04)',
                border: '1px solid rgba(15, 110, 86, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PdfIcon sx={{ color: '#EF4444', fontSize: 28 }} />
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>
                    {patient.name || 'Patient'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Reg: {patient.regNo || 'N/A'} · Age: {patient.age || 'N/A'} · Gender: {patient.gender || 'N/A'}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label="PDF Report"
                size="small"
                sx={{ background: 'rgba(15, 110, 86, 0.1)', color: '#0F6E56', fontWeight: 700 }}
              />
            </Paper>

            {/* Recipient Selector */}
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Select Recipient
            </Typography>
            <RadioGroup
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value)}
              sx={{ mt: 1, mb: 2, gap: 1 }}
            >
              {/* Option 1: Patient */}
              <Paper
                elevation={0}
                onClick={() => setRecipientType('patient')}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: '14px',
                  border: recipientType === 'patient' ? '2px solid #0F6E56' : '1px solid #E2E8F0',
                  background: recipientType === 'patient' ? 'rgba(15, 110, 86, 0.05)' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormControlLabel
                    value="patient"
                    control={<Radio size="small" sx={{ color: '#0F6E56', '&.Mui-checked': { color: '#0F6E56' } }} />}
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                          Patient: {patient.name || 'Patient'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Mobile: {patientPhone ? `+91 ${patientPhone}` : 'No phone saved'}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
                <PersonIcon sx={{ color: '#0F6E56', opacity: 0.7 }} />
              </Paper>

              {/* Option 2: Doctor */}
              <Paper
                elevation={0}
                onClick={() => setRecipientType('doctor')}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: '14px',
                  border: recipientType === 'doctor' ? '2px solid #0F6E56' : '1px solid #E2E8F0',
                  background: recipientType === 'doctor' ? 'rgba(15, 110, 86, 0.05)' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormControlLabel
                    value="doctor"
                    control={<Radio size="small" sx={{ color: '#0F6E56', '&.Mui-checked': { color: '#0F6E56' } }} />}
                    label={
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                          Doctor: {doctorName || 'Referred Doctor'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
                          Contact: {doctorPhone ? `+91 ${doctorPhone}` : 'No doctor contact saved'}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
                <DoctorIcon sx={{ color: '#3B82F6', opacity: 0.7 }} />
              </Paper>

              {/* Option 3: Custom Number */}
              <Paper
                elevation={0}
                onClick={() => setRecipientType('custom')}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: '14px',
                  border: recipientType === 'custom' ? '2px solid #0F6E56' : '1px solid #E2E8F0',
                  background: recipientType === 'custom' ? 'rgba(15, 110, 86, 0.05)' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  transition: 'all 0.2s'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    value="custom"
                    control={<Radio size="small" sx={{ color: '#0F6E56', '&.Mui-checked': { color: '#0F6E56' } }} />}
                    label={
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                        Custom Mobile Number
                      </Typography>
                    }
                  />
                  <PhoneIcon sx={{ color: '#8B5CF6', opacity: 0.7 }} />
                </Box>
                {recipientType === 'custom' && (
                  <TextField
                    size="small"
                    placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        background: '#fff'
                      }
                    }}
                  />
                )}
              </Paper>
            </RadioGroup>

            {/* Editable Caption / Message */}
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              WhatsApp Message Caption
            </Typography>
            <TextField
              multiline
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              fullWidth
              sx={{
                mt: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px',
                  background: '#fff',
                  fontSize: '0.85rem'
                }
              }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1, borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
        <Button
          onClick={onClose}
          disabled={sending}
          sx={{ borderRadius: '100px', color: '#64748B', fontWeight: 600, textTransform: 'none' }}
        >
          Cancel
        </Button>

        {statusData.connected ? (
          <Button
            variant="contained"
            startIcon={sending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <SendIcon />}
            onClick={handleSendReport}
            disabled={sending}
            sx={{
              background: '#25D366',
              color: '#fff',
              fontWeight: 800,
              borderRadius: '100px',
              px: 3.5,
              py: 1.2,
              textTransform: 'none',
              boxShadow: '0 8px 20px rgba(37, 211, 102, 0.3)',
              '&:hover': {
                background: '#1EBE5D',
                boxShadow: '0 10px 24px rgba(37, 211, 102, 0.45)'
              }
            }}
          >
            {sending ? 'Sending PDF via WhatsApp...' : 'Send Report PDF'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={fetchStatus}
            disabled={loadingStatus}
            sx={{
              background: '#0F6E56',
              color: '#fff',
              fontWeight: 700,
              borderRadius: '100px',
              px: 3,
              textTransform: 'none'
            }}
          >
            I Have Scanned QR
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WhatsAppDialog;
