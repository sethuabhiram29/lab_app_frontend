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
import {
  Search as SearchIcon,
  GetApp as DownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { Avatar, InputAdornment, OutlinedInput, Chip } from '@mui/material';
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

  // Calculate stats for the summary cards
  const totalRecords = filteredPatients.length;
  const recentRecords = filteredPatients.filter(p => new Date(p.sampleCollectionDate) > new Date(Date.now() - 30*24*60*60*1000)).length;
  const matchCount = sortedPatients.length;

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
    <Box sx={{ minHeight: '100vh', background: 'var(--surface-light)', pb: 8 }}>
      {/* Top Header Background Gradient */}
      <Box sx={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: '40vh',
        background: 'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(220,38,38,0.1) 100%)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: { xs: 4, md: 8 } }}>
        <AnimatePresence>
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            
            {/* Header Section */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 6, gap: 3 }}>
              <motion.div variants={fadeUp}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.1em', mb: 1, textTransform: 'uppercase' }}>
                  ARCHIVE
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 900, color: '#0F172A', mb: 1, fontSize: { xs: '2rem', md: '2.5rem' }, letterSpacing: '-0.02em', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Report History
                </Typography>
                <Typography sx={{ color: 'var(--text-secondary)', maxWidth: 500, fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Search and access previously generated patient reports. Filter by date, patient name, or referring doctor.
                </Typography>
              </motion.div>
            </Box>

            {/* Stats Cards Section */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 6 }}>
              {[
                { title: 'TOTAL RECORDS', value: totalRecords, delay: 0 },
                { title: 'RECENT (30 DAYS)', value: recentRecords, delay: 0.1 },
                { title: 'MATCHING SEARCH', value: matchCount, delay: 0.2 },
                { title: 'PRINTED TODAY', value: '-', delay: 0.3 }
              ].map((stat, idx) => (
                <motion.div key={idx} variants={scaleUp} custom={stat.delay}>
                  <Box sx={{
                    p: 3, borderRadius: '24px', background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.8)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden'
                  }}>
                    <Box sx={{
                      position: 'absolute', top: 0, right: 0, bottom: 0, left: '50%',
                      background: 'radial-gradient(circle at center right, rgba(239,68,68,0.1) 0%, transparent 70%)', zIndex: 0
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
                borderRadius: '32px', background: '#fff', boxShadow: '0 24px 64px rgba(0,0,0,0.06)',
                border: '1px solid rgba(30,41,59,0.05)', overflow: 'hidden', mb: 4
              }}>
                {/* Table Toolbar */}
                <Box sx={{ p: 3, px: 4, display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(30,41,59,0.05)', gap: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <OutlinedInput
                        fullWidth size="small" placeholder="Patient Name..."
                        value={searchPatient} onChange={e => setSearchPatient(e.target.value)}
                        startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: 'var(--text-secondary)' }} /></InputAdornment>}
                        sx={{ borderRadius: '100px', background: '#F8FAFC' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <OutlinedInput
                        fullWidth size="small" placeholder="Ref Doctor/Agent..."
                        value={searchRef} onChange={e => setSearchRef(e.target.value)}
                        startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: 'var(--text-secondary)' }} /></InputAdornment>}
                        sx={{ borderRadius: '100px', background: '#F8FAFC' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <OutlinedInput
                        fullWidth size="small" placeholder="Test Name..."
                        value={searchTest} onChange={e => setSearchTest(e.target.value)}
                        startAdornment={<InputAdornment position="start"><SearchIcon sx={{ color: 'var(--text-secondary)' }} /></InputAdornment>}
                        sx={{ borderRadius: '100px', background: '#F8FAFC' }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        type="date" fullWidth size="small" label="Start Date"
                        value={searchStartDate} onChange={e => setSearchStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '100px', background: '#F8FAFC' } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <TextField
                        type="date" fullWidth size="small" label="End Date"
                        value={searchEndDate} onChange={e => setSearchEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '100px', background: '#F8FAFC' } }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Table Content */}
                {loading ? (
                   <Box p={6} textAlign="center"><Typography color="textSecondary">Loading history...</Typography></Box>
                ) : sortedPatients.length === 0 ? (
                  <Box p={6} textAlign="center">
                    <Typography color="textSecondary">No reports found matching your criteria.</Typography>
                  </Box>
                ) : (
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 800 }}>
                      <TableHead>
                        <TableRow sx={{ '& th': { borderBottom: 'none', py: 3 } }}>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', pl: 5 }}>ID</TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                            <TableSortLabel active={sortBy === 'name'} direction={sortOrder} onClick={() => handleSort('name')}>PATIENT</TableSortLabel>
                          </TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                            <TableSortLabel active={sortBy === 'date'} direction={sortOrder} onClick={() => handleSort('date')}>DATE</TableSortLabel>
                          </TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                            <TableSortLabel active={sortBy === 'ref'} direction={sortOrder} onClick={() => handleSort('ref')}>REF BY</TableSortLabel>
                          </TableCell>
                          <TableCell sx={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', align: 'right', pr: 5 }}>ACTIONS</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence>
                          {sortedPatients.map((patient, idx) => {
                            const report = getReportForPatient(reports, patient._id);
                            if (!report) return null; // Only show patients with a printed report

                            const simpleId = (patient.regNo || '').toString().replace(/^0+/, '');
                            const reportDate = new Date(patient.sampleCollectionDate).toLocaleDateString();

                            return (
                              <motion.tr
                                key={patient._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ 
                                  scale: 1.005,
                                  backgroundColor: 'rgba(239,68,68,0.03)',
                                  boxShadow: 'inset 4px 0 0 #EF4444'
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
                                    <Avatar sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#EF4444', fontWeight: 800, fontSize: '0.9rem', width: 40, height: 40 }}>
                                      {patient.name.substring(0,2).toUpperCase()}
                                    </Avatar>
                                    <Box>
                                      <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{patient.name}</Typography>
                                      <Typography sx={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Patient ID • {patient.regNo}</Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ borderBottom: 'none' }}>
                                  <Typography sx={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{reportDate}</Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: 'none' }}>
                                  <Typography sx={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{getRefName(patient)}</Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ pr: 5, borderBottom: 'none' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<VisibilityIcon sx={{ fontSize: '1rem' }} />}
                                      onClick={() => handleView(report)}
                                      sx={{ borderRadius: '100px', color: 'var(--text-secondary)', borderColor: 'var(--border-light)', fontWeight: 700, textTransform: 'none', '&:hover': { background: '#F8FAFC' } }}
                                    >
                                      View
                                    </Button>
                                    <Button 
                                      variant="contained" 
                                      size="small" 
                                      onClick={() => handleDownloadPDF(report)} 
                                      startIcon={<DownloadIcon sx={{ fontSize: '1rem' }} />}
                                      sx={{ borderRadius: '100px', background: '#EF4444', color: '#fff', fontWeight: 700, textTransform: 'none', boxShadow: 'none', '&:hover': { background: '#DC2626', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' } }}
                                    >
                                      Download PDF
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

        {previewOpen && selectedReport && (
          <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
              Report Preview
              <IconButton onClick={handleClosePreview}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <PDFPreview document={<ReportDocument 
                  patient={selectedReport.reportDisplayData.patient} 
                  testTables={selectedReport.reportDisplayData.testTables} 
                  isPrinting={false}
                  removedImages={new Set(selectedReport.reportDisplayData.removedImages || [])}
                  tableNotes={selectedReport.reportDisplayData.tableNotes || {}}
                />} />
            </DialogContent>
          </Dialog>
        )}

      </Container>
    </Box>
  );
}

export default History;
