import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Autocomplete,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getDoctors, getAgents, getDoctorAnalysis, getAgentAnalysis } from '../api';

function Analysis() {
  const [mode, setMode] = useState('doctor');
  const [doctors, setDoctors] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(() => new Date());
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const defaultSummary = {
    totalAmount: 0,
    totalCommission: 0,
    netAmount: 0,
    testCounts: {}
  };
  const [summary, setSummary] = useState(defaultSummary);

  useEffect(() => {
    getDoctors().then(res => setDoctors(res.data || res)).catch(() => {});
    getAgents().then(res => setAgents(res.data || res)).catch(() => {});
  }, []);

  const handleFetch = async () => {
    setError('');
    setPatients([]);
    setSummary(defaultSummary);

    if (mode === 'doctor' && !selectedDoctor) {
      setError('Please select a doctor');
      return;
    }
    if (mode === 'agent' && !selectedAgent) {
      setError('Please select an agent');
      return;
    }
    if (!startDate || !endDate) {
      setError('Please select a date range');
      return;
    }

    setLoading(true);
    try {
      // Convert to ISO string for API calls
      const formatDate = d => d instanceof Date ? d.toISOString() : d;
      
      let res;
      if (mode === 'doctor') {
        res = await getDoctorAnalysis(selectedDoctor._id, formatDate(startDate), formatDate(endDate));
      } else {
        res = await getAgentAnalysis(selectedAgent._id, formatDate(startDate), formatDate(endDate));
      }

      // Process the response data
      const responseData = res.data || res;  // Handle both formats
      
      if (!responseData?.patients) {
        console.warn('Unexpected response format:', res);
        setError('Received invalid data format from server');
        return;
      }

      console.log('Setting data from response:', responseData);
      
      setPatients(responseData.patients);
      
      // Calculate summary from actual patient data to ensure accuracy
      const calculatedSummary = responseData.patients.reduce((acc, patient) => {
        const totalAmount = Number(patient.totalAmount) || 0;
        const commission = Number(patient.commission) || 0;
        acc.totalAmount += totalAmount;
        acc.totalCommission += commission;
        return acc;
      }, {
        totalAmount: 0,
        totalCommission: 0,
      });
      
      // Use server-provided test counts
      calculatedSummary.testCounts = responseData.summary?.testCounts || {};
      calculatedSummary.netAmount = calculatedSummary.totalAmount - calculatedSummary.totalCommission;
      
      // Round values to 2 decimal places
      calculatedSummary.totalAmount = Math.round(calculatedSummary.totalAmount * 100) / 100;
      calculatedSummary.totalCommission = Math.round(calculatedSummary.totalCommission * 100) / 100;
      calculatedSummary.netAmount = Math.round(calculatedSummary.netAmount * 100) / 100;
      
      setSummary(calculatedSummary);

      // No need to calculate summary as it's provided by the server
      console.log('Data set successfully:', {
        patientCount: responseData.patients.length,
        summary: responseData.summary
      });

    } catch (err) {
      console.error('Analysis fetch error:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(`Failed to fetch analysis data: ${errorMessage}`);
      setPatients([]);
      setSummary(defaultSummary);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 1, mb: 4 }} className="animate-fade-in">
      <Paper className="medical-card" elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" sx={{
          fontWeight: 800, mb: 3,
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Analysis
        </Typography>

        {/* Mode Toggle */}
        <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
          <Button
            variant={mode === 'doctor' ? 'contained' : 'outlined'}
            onClick={() => setMode('doctor')}
            sx={{ px: 4 }}
          >
            By Doctor
          </Button>
          <Button
            variant={mode === 'agent' ? 'contained' : 'outlined'}
            onClick={() => setMode('agent')}
            sx={{ px: 4 }}
          >
            By Agent
          </Button>
        </Box>

        {/* Filters - responsive */}
        <Box
          display="flex"
          gap={2}
          alignItems="center"
          sx={{ mb: 2, flexDirection: { xs: 'column', md: 'row' } }}
        >
          <Box sx={{ flex: 1, width: '100%' }}>
            {mode === 'doctor' ? (
              <Autocomplete
                options={doctors}
                getOptionLabel={option => option?.name || ''}
                value={selectedDoctor}
                onChange={(_, v) => setSelectedDoctor(v)}
                renderInput={params => <TextField {...params} label="Select Doctor" fullWidth />}
              />
            ) : (
              <Autocomplete
                options={agents}
                getOptionLabel={option => option?.name || ''}
                value={selectedAgent}
                onChange={(_, v) => setSelectedAgent(v)}
                renderInput={params => <TextField {...params} label="Select Agent" fullWidth />}
              />
            )}
          </Box>
          <Box sx={{ flex: 1, width: '100%' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                format="dd-MM-yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    inputProps: {
                      placeholder: "DD-MM-YYYY"
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
          <Box sx={{ flex: 1, width: '100%' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                format="dd-MM-yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    inputProps: {
                      placeholder: "DD-MM-YYYY"
                    }
                  }
                }}
              />
            </LocalizationProvider>
          </Box>
          <Box sx={{ flex: { xs: 1, md: 'none' }, width: { xs: '100%', md: 'auto' } }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleFetch}
              disabled={loading}
              fullWidth
              className="btn-glow"
              sx={{ height: 56, px: 4, minWidth: { md: 140 }, fontWeight: 700 }}
            >
              {loading ? 'Loading...' : 'Fetch Data'}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Summary Stat Cards */}
        {patients.length > 0 && (
          <Box sx={{ mt: 3 }} className="animate-fade-in">
            <Box sx={{ display: 'flex', gap: 2.5, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box className="stat-card" sx={{ flex: 1, background: 'var(--gradient-primary)', color: 'white' }}>
                <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 600, mb: 1, position: 'relative', zIndex: 1 }}>Total Amount</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, position: 'relative', zIndex: 1 }}>
                  ₹{(summary.totalAmount || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box className="stat-card" sx={{ flex: 1, background: 'linear-gradient(135deg, #FF1744 0%, #FF5252 100%)', color: 'white' }}>
                <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 600, mb: 1, position: 'relative', zIndex: 1 }}>Total Commission</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, position: 'relative', zIndex: 1 }}>
                  ₹{(summary.totalCommission || 0).toFixed(2)}
                </Typography>
              </Box>
              <Box className="stat-card" sx={{ flex: 1, background: 'linear-gradient(135deg, #00C853 0%, #69F0AE 100%)', color: 'white' }}>
                <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 600, mb: 1, position: 'relative', zIndex: 1 }}>Net Amount</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, position: 'relative', zIndex: 1 }}>
                  ₹{(summary.netAmount || 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Patient Entries Table */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Patient Entries</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', border: '1px solid rgba(0,188,212,0.1)', overflow: 'auto' }}>
              <Table size="small" className="table-medical">
                <TableHead>
                  <TableRow>
                    <TableCell>Patient ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Gender</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Phone</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Commission</TableCell>
                    <TableCell>Net</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.map((p, idx) => (
                    <TableRow key={p._id} sx={{ backgroundColor: idx % 2 === 0 ? 'rgba(0,188,212,0.02)' : 'transparent' }}>
                      <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{p.regNo || '-'}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{p.name || '-'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{p.gender || '-'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{p.mobileNumber || '-'}</TableCell>
                      <TableCell>
                        {p.createdAt ? (() => {
                          const d = new Date(p.createdAt);
                          return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                        })() : '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>₹{(Number(p.totalAmount) || 0).toFixed(2)}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>₹{(Number(p.commission) || 0).toFixed(2)}</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 700 }}>₹{((Number(p.totalAmount) || 0) - (Number(p.commission) || 0)).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Test Summary */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Test Summary</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>Number of each test/pack performed</Typography>
              <TableContainer component={Paper} elevation={0} sx={{ maxWidth: 450, borderRadius: '16px', border: '1px solid rgba(0,188,212,0.1)' }}>
                <Table size="small" className="table-medical">
                  <TableHead>
                    <TableRow>
                      <TableCell>Test/Pack Name</TableCell>
                      <TableCell>Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.testCounts && Object.entries(summary.testCounts || {}).map(([test, count]) => (
                      <TableRow key={test}>
                        <TableCell sx={{ fontWeight: 500 }}>{test}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{count}</TableCell>
                      </TableRow>
                    ))}
                    {(!summary.testCounts || Object.keys(summary.testCounts).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>No tests found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default Analysis;
