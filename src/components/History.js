/* eslint-disable */
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Box, TableSortLabel, TextField, Grid, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Slide
} from '@mui/material';
import {
  Close as CloseIcon,
  PictureAsPdfOutlined as PdfIcon,
  RemoveRedEyeOutlined as ViewIcon,
  HistoryOutlined as HistoryIcon
} from '@mui/icons-material';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { getPatients, getReports } from '../api';
import { saveAs } from 'file-saver';
import PDFPreview from './PDFPreview';
import { ReportDocument } from './CreateReport';
import { pdf } from '@react-pdf/renderer';

const getReportForPatient = (reports, patientId) => {
  return reports.find(r => r.patient && r.patient._id === patientId);
};

const getTestNames = (patient) => {
  if (!patient.selectedTests) return '';
  return patient.selectedTests.map(t => t.test?.name || '').join(', ');
};

const getRefName = (p) => {
  if (p.refDoctor && p.refDoctor.name) return p.refDoctor.name;
  if (p.refAgent && p.refAgent.name) return p.refAgent.name;
  return '-';
};

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

const History = () => {
  const prefersReduced = useReducedMotion();
  const [patients, setPatients] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  // Search/filter states
  const [searchPatient, setSearchPatient] = useState('');
  const [searchRef, setSearchRef] = useState('');
  const [searchTest, setSearchTest] = useState('');
  const [searchStartDate, setSearchStartDate] = useState('');
  const [searchEndDate, setSearchEndDate] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const patientsData = await getPatients();
    const reportsData = await getReports({ printed: true });
    setPatients(patientsData || []);
    setReports(reportsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const handleReportUpdate = () => fetchData();
    window.addEventListener('reportUpdated', handleReportUpdate);
    return () => window.removeEventListener('reportUpdated', handleReportUpdate);
  }, []);

  const handleView = (report) => {
    setSelectedReport(report);
    setPreviewOpen(true);
  };
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setTimeout(() => setSelectedReport(null), 300);
  };
  
  const handleDownloadPDF = async (report) => {
    if (!report || !report.reportDisplayData) return;
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
    a.download = `report-${report._id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Filtering logic
  const filteredPatients = patients.filter((p) => {
    const patientNameMatch = p.name.toLowerCase().includes(searchPatient.toLowerCase());
    const refNameMatch = getRefName(p).toLowerCase().includes(searchRef.toLowerCase());
    const testNameMatch = getTestNames(p).toLowerCase().includes(searchTest.toLowerCase());
    const date = new Date(p.sampleCollectionDate);
    const startDateMatch = searchStartDate ? date >= new Date(searchStartDate) : true;
    const endDateMatch = searchEndDate ? date <= new Date(searchEndDate) : true;
    return patientNameMatch && refNameMatch && testNameMatch && startDateMatch && endDateMatch;
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case 'name':
        aValue = a.name?.toLowerCase() || ''; bValue = b.name?.toLowerCase() || ''; break;
      case 'ref':
        aValue = getRefName(a).toLowerCase(); bValue = getRefName(b).toLowerCase(); break;
      case 'date':
        aValue = new Date(a.sampleCollectionDate); bValue = new Date(b.sampleCollectionDate); break;
      case 'test':
        aValue = getTestNames(a).toLowerCase(); bValue = getTestNames(b).toLowerCase(); break;
      default:
        aValue = ''; bValue = '';
    }
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (column) => {
    if (sortBy === column) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortOrder('asc'); }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 1, mb: 4 }}>
      <motion.div initial={prefersReduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
        <Paper elevation={0} sx={{ 
          p: { xs: 3, sm: 4 }, 
          borderRadius: 'var(--radius-2xl)', 
          background: 'var(--surface-paper)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          
          {/* ── Header ────────────────────────────────────────────── */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, rgba(15,110,86,0.1) 0%, rgba(11,31,58,0.1) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HistoryIcon sx={{ color: 'var(--color-primary)', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', mb: 0.5 }}>
                Patient History
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                View and download past printed reports.
              </Typography>
            </Box>
          </Box>

          {/* ── Search/Filter Controls ────────────────────────────── */}
          <Box sx={{ mb: 4, p: 3, borderRadius: 'var(--radius-xl)', background: 'var(--surface-light)', border: '1px solid var(--border-light)' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField label="Search Patient Name" value={searchPatient} onChange={e => setSearchPatient(e.target.value)} fullWidth variant="filled" InputProps={{ disableUnderline: true }} sx={glassFieldSx} size="small" />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField label="Search Ref Doctor/Agent" value={searchRef} onChange={e => setSearchRef(e.target.value)} fullWidth variant="filled" InputProps={{ disableUnderline: true }} sx={glassFieldSx} size="small" />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField label="Search Test Name" value={searchTest} onChange={e => setSearchTest(e.target.value)} fullWidth variant="filled" InputProps={{ disableUnderline: true }} sx={glassFieldSx} size="small" />
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <TextField label="Start Date" type="date" value={searchStartDate} onChange={e => setSearchStartDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth variant="filled" InputProps={{ disableUnderline: true }} sx={glassFieldSx} size="small" />
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <TextField label="End Date" type="date" value={searchEndDate} onChange={e => setSearchEndDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth variant="filled" InputProps={{ disableUnderline: true }} sx={glassFieldSx} size="small" />
              </Grid>
            </Grid>
          </Box>

          {/* ── Table ─────────────────────────────────────────────── */}
          <TableContainer sx={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <Table size="medium">
              <TableHead sx={{ background: 'var(--surface-light)' }}>
                <TableRow>
                  <TableCell sx={thSx}>
                    <TableSortLabel active={sortBy === 'name'} direction={sortBy === 'name' ? sortOrder : 'asc'} onClick={() => handleSort('name')}>
                      Patient Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ ...thSx, display: { xs: 'none', md: 'table-cell' } }}>Age/Gender</TableCell>
                  <TableCell sx={{ ...thSx, display: { xs: 'none', sm: 'table-cell' } }}>Mobile</TableCell>
                  <TableCell sx={thSx}>
                    <TableSortLabel active={sortBy === 'date'} direction={sortBy === 'date' ? sortOrder : 'asc'} onClick={() => handleSort('date')}>
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ ...thSx, display: { xs: 'none', sm: 'table-cell' } }}>Amount</TableCell>
                  <TableCell sx={{ ...thSx, display: { xs: 'none', lg: 'table-cell' } }}>Ref Doctor/Agent</TableCell>
                  <TableCell sx={{ ...thSx, display: { xs: 'none', lg: 'table-cell' } }}>Tests</TableCell>
                  <TableCell align="right" sx={thSx}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody component={motion.tbody} variants={prefersReduced ? false : containerVariants} initial="hidden" animate="visible">
                {sortedPatients.map((p, idx) => {
                  const report = getReportForPatient(reports, p._id);
                  return (
                    <TableRow 
                      component={motion.tr} variants={prefersReduced ? false : rowVariants}
                      key={p._id} 
                      hover
                      sx={{ 
                        transition: 'all 0.2s',
                        '&:hover': { background: 'var(--surface-light) !important', transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', zIndex: 1, position: 'relative' }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'var(--text-secondary)' }}>{p.age} / {p.gender}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'var(--text-secondary)' }}>{p.mobileNumber || '-'}</TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)' }}>
                        {(() => {
                          const d = new Date(p.sampleCollectionDate);
                          return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                        })()}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'var(--text-secondary)' }}>₹{p.totalAmount}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, color: 'var(--text-secondary)' }}>{getRefName(p)}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, color: 'var(--text-secondary)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getTestNames(p)}</TableCell>
                      <TableCell align="right">
                        {report && report.reportDisplayData ? (
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="outlined" size="small"
                                onClick={() => handleView(report)}
                                startIcon={<ViewIcon />}
                                sx={{ borderRadius: 'var(--radius-md)', textTransform: 'none', fontWeight: 600, borderColor: 'rgba(15,110,86,0.3)', color: 'var(--color-primary)' }}
                              >
                                View
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant="contained" size="small"
                                onClick={() => handleDownloadPDF(report)}
                                startIcon={<PdfIcon />}
                                sx={{ borderRadius: 'var(--radius-md)', textTransform: 'none', fontWeight: 600, background: 'var(--color-secondary)', boxShadow: 'none' }}
                              >
                                Download
                              </Button>
                            </motion.div>
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontStyle: 'italic', px: 1 }}>No Report</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredPatients.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <HistoryIcon sx={{ fontSize: 40, color: 'var(--text-muted)', mb: 1, opacity: 0.5 }} />
                      <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>No historical reports found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </motion.div>

      {/* ── PDF Preview Dialog ────────────────────────────────────── */}
      <Dialog 
        open={previewOpen} onClose={handleClosePreview} 
        maxWidth="lg" fullWidth 
        TransitionComponent={Transition}
        PaperProps={{ sx: { borderRadius: 'var(--radius-2xl)', overflow: 'hidden', minHeight: '80vh' } }}
        sx={{ backdropFilter: 'blur(8px)' }}
      >
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-light)' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Report Preview</Typography>
          <IconButton onClick={handleClosePreview} sx={{ color: 'var(--text-secondary)' }}><CloseIcon /></IconButton>
        </Box>
        <DialogContent sx={{ p: 0, bgcolor: '#f1f5f9' }}>
          {selectedReport && selectedReport.reportDisplayData && (
            <PDFPreview 
              document={
                <ReportDocument 
                  patient={selectedReport.reportDisplayData.patient} 
                  testTables={selectedReport.reportDisplayData.testTables} 
                  isPrinting={false}
                  removedImages={new Set(selectedReport.reportDisplayData.removedImages || [])}
                  tableNotes={selectedReport.reportDisplayData.tableNotes || {}}
                />
              } 
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

const thSx = {
  fontWeight: 700,
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid var(--border-light)'
};

const glassFieldSx = {
  '& .MuiFilledInput-root': {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-light)',
    transition: 'all 0.2s',
    '&:hover': { backgroundColor: '#fff', borderColor: 'var(--color-primary)' },
    '&.Mui-focused': { backgroundColor: '#fff', borderColor: 'var(--color-primary)', boxShadow: '0 0 0 3px rgba(15,110,86,0.15)' },
  },
  '& .MuiInputLabel-root': { color: 'var(--text-muted)', fontSize: '0.85rem' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-primary)' },
};

export default History;