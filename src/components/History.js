/* eslint-disable */
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Box, TableSortLabel, TextField, Grid, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
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

const History = () => {
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
    
    // Add event listener for report updates
    const handleReportUpdate = () => {
      fetchData();
    };
    window.addEventListener('reportUpdated', handleReportUpdate);

    // Cleanup event listener
    return () => {
      window.removeEventListener('reportUpdated', handleReportUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = (report) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    saveAs(blob, `report-${report._id}.json`);
  };

  const handleView = (report) => {
    setSelectedReport(report);
    setPreviewOpen(true);
  };
  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedReport(null);
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
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'ref':
        aValue = getRefName(a).toLowerCase();
        bValue = getRefName(b).toLowerCase();
        break;
      case 'date':
        aValue = new Date(a.sampleCollectionDate);
        bValue = new Date(b.sampleCollectionDate);
        break;
      case 'test':
        aValue = getTestNames(a).toLowerCase();
        bValue = getTestNames(b).toLowerCase();
        break;
      default:
        aValue = '';
        bValue = '';
    }
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 1, mb: 4 }} className="animate-fade-in">
      <Paper className="medical-card" elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" sx={{
          fontWeight: 800, mb: 3,
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Patient History
        </Typography>
        {/* Search/Filter Controls */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Search Patient Name"
                value={searchPatient}
                onChange={e => setSearchPatient(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Search Ref Doctor/Agent"
                value={searchRef}
                onChange={e => setSearchRef(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Search Test Name"
                value={searchTest}
                onChange={e => setSearchTest(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                label="Start Date"
                type="date"
                value={searchStartDate}
                onChange={e => setSearchStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                label="End Date"
                type="date"
                value={searchEndDate}
                onChange={e => setSearchEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortOrder : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Patient Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Age</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Gender</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Mobile</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'date'}
                    direction={sortBy === 'date' ? sortOrder : 'asc'}
                    onClick={() => handleSort('date')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Amount</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  <TableSortLabel
                    active={sortBy === 'ref'}
                    direction={sortBy === 'ref' ? sortOrder : 'asc'}
                    onClick={() => handleSort('ref')}
                  >
                    Ref Doctor/Agent
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  <TableSortLabel
                    active={sortBy === 'test'}
                    direction={sortBy === 'test' ? sortOrder : 'asc'}
                    onClick={() => handleSort('test')}
                  >
                    Test Name(s)
                  </TableSortLabel>
                </TableCell>
                <TableCell>Report</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPatients.map((p, idx) => {
                const report = getReportForPatient(reports, p._id);
                return (
                  <TableRow key={p._id} sx={{ backgroundColor: idx % 2 === 0 ? '#FAFAFA' : '#FFFFFF', '&:hover': { backgroundColor: '#F1F5F9' } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{p.age}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{p.gender}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{p.mobileNumber}</TableCell>
                    <TableCell>
                      {(() => {
                        const d = new Date(p.sampleCollectionDate);
                        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                      })()}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>₹{p.totalAmount}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{getRefName(p)}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{getTestNames(p)}</TableCell>
                    <TableCell>
                      {report && report.reportDisplayData ? (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleView(report)}
                            sx={{ borderRadius: '8px', fontSize: '0.75rem' }}
                          >
                            View
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleDownloadPDF(report)}
                            sx={{ borderRadius: '8px', fontSize: '0.75rem' }}
                          >
                            Download
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">No Report</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPatients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">No patient entries found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {/* PDF Preview Dialog */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Report Preview</DialogTitle>
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
                />
              } 
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClosePreview} sx={{ borderRadius: '8px' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default History; 