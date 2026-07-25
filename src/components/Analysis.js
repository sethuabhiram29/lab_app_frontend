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
import { motion, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';

const CountUp = ({ value, prefix = '₹', decimals = 2 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const obj = { val: displayValue };
    gsap.to(obj, {
      val: value,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => setDisplayValue(obj.val)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <>{prefix}{displayValue.toFixed(decimals)}</>;
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

function Analysis() {
  const prefersReduced = useReducedMotion();
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
    <Container maxWidth="lg" sx={{ mt: 1, mb: 4 }}>
      <motion.div initial={prefersReduced ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, background: 'transparent' }}>
        <Typography variant="h4" sx={{
          fontWeight: 800, mb: 3,
          color: 'var(--text-primary)',
        }}>
          Analysis
        </Typography>

        {/* Mode Toggle */}
        <Box sx={{ mb: 4, display: 'inline-flex', p: 0.5, background: 'var(--surface-light)', borderRadius: 'var(--radius-xl)', position: 'relative' }}>
          {['doctor', 'agent'].map(m => (
            <Box
              key={m}
              onClick={() => setMode(m)}
              sx={{ px: 4, py: 1.5, cursor: 'pointer', position: 'relative', zIndex: 1, color: mode === m ? 'white' : 'var(--text-secondary)', fontWeight: 600, textTransform: 'capitalize' }}
            >
              {mode === m && (
                <motion.div
                  layoutId="analysisModePill"
                  style={{ position: 'absolute', inset: 0, background: 'var(--color-primary)', borderRadius: 'var(--radius-lg)', zIndex: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              By {m}
            </Box>
          ))}
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Box sx={{ display: 'flex', gap: 3, mb: 5, mt: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box sx={{ flex: 1, p: 3, borderRadius: 'var(--radius-2xl)', background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.05) 100%)', border: '1px solid rgba(34,197,94,0.2)', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(34,197,94,0.1)', borderRadius: '50%', filter: 'blur(20px)' }} />
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 600, mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Amount</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#16a34a' }}>
                  <CountUp value={summary.totalAmount || 0} />
                </Typography>
              </Box>
              <Box sx={{ flex: 1, p: 3, borderRadius: 'var(--radius-2xl)', background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(239,68,68,0.05) 100%)', border: '1px solid rgba(239,68,68,0.2)', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(239,68,68,0.1)', borderRadius: '50%', filter: 'blur(20px)' }} />
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 600, mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Commission</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#dc2626' }}>
                  <CountUp value={summary.totalCommission || 0} />
                </Typography>
              </Box>
              <Box sx={{ flex: 1, p: 3, borderRadius: 'var(--radius-2xl)', background: 'linear-gradient(135deg, rgba(15,110,86,0.1) 0%, rgba(15,110,86,0.05) 100%)', border: '1px solid rgba(15,110,86,0.2)', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: 'rgba(15,110,86,0.1)', borderRadius: '50%', filter: 'blur(20px)' }} />
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontWeight: 600, mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Amount</Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                  <CountUp value={summary.netAmount || 0} />
                </Typography>
              </Box>
            </Box>

            {/* Patient Entries Table */}
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'var(--text-primary)' }}>Patient Entries</Typography>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ background: 'var(--surface-light)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Patient ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Name</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gender</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Commission</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Net</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody component={motion.tbody} variants={prefersReduced ? false : containerVariants} initial="hidden" animate="visible">
                  {patients.map((p, idx) => (
                    <TableRow 
                      component={motion.tr} variants={prefersReduced ? false : rowVariants}
                      key={p._id} 
                      hover
                      sx={{ transition: 'all 0.2s', '&:hover': { background: 'var(--surface-light) !important' } }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: 'var(--color-primary)' }}>{p.regNo || '-'}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name || '-'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'var(--text-secondary)' }}>{p.gender || '-'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'var(--text-secondary)' }}>{p.mobileNumber || '-'}</TableCell>
                      <TableCell sx={{ color: 'var(--text-secondary)' }}>
                        {p.createdAt ? (() => {
                          const d = new Date(p.createdAt);
                          return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                        })() : '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{(Number(p.totalAmount) || 0).toFixed(2)}</TableCell>
                      <TableCell sx={{ color: '#dc2626', fontWeight: 600 }}>₹{(Number(p.commission) || 0).toFixed(2)}</TableCell>
                      <TableCell sx={{ color: '#16a34a', fontWeight: 700 }}>₹{((Number(p.totalAmount) || 0) - (Number(p.commission) || 0)).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Test Summary */}
            <Box sx={{ mt: 5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>Test Summary</Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5, mb: 2 }}>Number of each test/pack performed</Typography>
              <TableContainer component={Paper} elevation={0} sx={{ maxWidth: 450, borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                <Table>
                  <TableHead sx={{ background: 'var(--surface-light)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Test/Pack Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody component={motion.tbody} variants={prefersReduced ? false : containerVariants} initial="hidden" animate="visible">
                    {summary.testCounts && Object.entries(summary.testCounts || {}).map(([test, count]) => (
                      <TableRow component={motion.tr} variants={prefersReduced ? false : rowVariants} key={test}>
                        <TableCell sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{test}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'var(--color-primary)' }}>{count}</TableCell>
                      </TableRow>
                    ))}
                    {(!summary.testCounts || Object.keys(summary.testCounts).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'var(--text-secondary)' }}>No tests found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </motion.div>
        )}
      </Paper>
      </motion.div>
    </Container>
  );
}

export default Analysis;
