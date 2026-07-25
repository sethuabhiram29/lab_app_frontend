/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button,
  FormControl, Select, MenuItem, Autocomplete,
  List, ListItem, ListItemText, Checkbox, Container, Alert,
  IconButton, Dialog, DialogContent, Slide
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  Close as CloseIcon,
  LocalHospital as TestIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import api from '../api';

// ── Framer Motion variants ────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  }
};

const underlineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: { 
    scaleX: 1, opacity: 1, 
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 } 
  }
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function PatientEntry() {
  const prefersReduced = useReducedMotion();
  const [formData, setFormData] = useState({
    name: '', age: '', gender: '', mobileNumber: '',
    email: '', emailUsername: '', sampleCollectionDate: new Date(),
    refDoctor: null, refAgent: null, totalAmount: '', advancePaid: '',
    selectedTests: [],
  });

  const [doctors, setDoctors] = useState([]);
  const [agents, setAgents] = useState([]);
  const [tests, setTests] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTestId, setActiveTestId] = useState(null);
  const [showTestSelection, setShowTestSelection] = useState(false);
  const [activePackId, setActivePackId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      let doctorsArr = [], agentsArr = [], testsArr = [];
      let errorMsg = '';
      try {
        const doctorsRes = await api.get('/doctors');
        doctorsArr = Array.isArray(doctorsRes.data) ? doctorsRes.data : (Array.isArray(doctorsRes) ? doctorsRes : []);
        setDoctors(doctorsArr);
      } catch (err) {
        errorMsg += 'Failed to fetch doctors. ';
      }
      try {
        const agentsRes = await api.get('/agents');
        agentsArr = Array.isArray(agentsRes.data) ? agentsRes.data : (Array.isArray(agentsRes) ? agentsRes : []);
        setAgents(agentsArr);
      } catch (err) {
        errorMsg += 'Failed to fetch agents. ';
      }
      try {
        const testsRes = await api.get('/tests');
        testsArr = Array.isArray(testsRes.data) ? testsRes.data : (Array.isArray(testsRes) ? testsRes : []);
        setTests(testsArr);
      } catch (err) {
        errorMsg += 'Failed to fetch tests. ';
      }

      if (errorMsg) setError(errorMsg);
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTestSelection = (test) => {
    setFormData(prev => {
      const isSelected = prev.selectedTests.some(t => t.test._id === test._id);
      if (isSelected) {
        const newSelectedTests = prev.selectedTests.filter(t => t.test._id !== test._id);
        return { ...prev, selectedTests: newSelectedTests };
      } else {
        const subtests = (test.subtests || []).map((s, idx) => ({ ...s, id: s._id || idx + '' + test._id, selected: false }));
        const packs = (test.packs || []).map((p, pIdx) => ({
          ...p,
          id: p._id || pIdx + '' + test._id,
          selected: false,
          subtests: (p.subtests || []).map((s, sIdx) => ({ ...s, id: s._id || pIdx + '' + sIdx + '_' + test._id }))
        }));
        const newTest = { test, subtests, packs };
        return { ...prev, selectedTests: [...prev.selectedTests, newTest] };
      }
    });
  };

  const handleSubtestSelection = (testId, subtestId, packId = null) => {
    setFormData(prev => {
      const newSelectedTests = prev.selectedTests.map(t => {
        if (t.test._id === testId) {
          if (packId) {
            const newPacks = t.packs.map(p => {
              if (p._id === packId) {
                const newSubtests = p.subtests.map(s =>
                  s._id === subtestId ? { ...s, selected: !s.selected } : s
                );
                return { ...p, subtests: newSubtests };
              }
              return p;
            });
            return { ...t, packs: newPacks };
          } else {
            const newSubtests = t.subtests.map(s =>
              s._id === subtestId ? { ...s, selected: !s.selected } : s
            );
          return { ...t, subtests: newSubtests };
          }
        }
        return t;
      });
      return { ...prev, selectedTests: newSelectedTests };
    });
  };

  const handlePackSelection = (testId, packId) => {
    setFormData(prev => {
      const newSelectedTests = prev.selectedTests.map(t => {
        if (t.test._id === testId) {
          const newPacks = t.packs.map(p => {
            if (p._id === packId) {
              return { ...p, selected: !p.selected };
            }
            return p;
          });
          return { ...t, packs: newPacks };
        }
        return t;
      });
      return { ...prev, selectedTests: newSelectedTests };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!formData.name || !formData.age || !formData.gender || !formData.totalAmount) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const dueAmount = formData.totalAmount - (formData.advancePaid || 0);

      const selectedTestsPayload = formData.selectedTests
        .filter(t => {
          const hasSelectedSubtest = t.subtests && t.subtests.some(s => s.selected);
          const hasSelectedPack = t.packs && t.packs.some(p => p.selected);
          return hasSelectedSubtest || hasSelectedPack;
        })
        .map(t => {
          const directSubtests = (t.subtests || []).filter(s => s.selected);
          const selectedPacks = (t.packs || []).filter(p => p.selected).map(p => ({
            name: p.name,
            subtests: (p.subtests || []).map(s => ({ name: s.name, unit: s.unit, reference: s.reference, _id: s._id }))
          }));
        return {
          test: t.test._id,
          subtests: directSubtests.map(s => ({ name: s.name, unit: s.unit, reference: s.reference, _id: s._id })),
          packs: selectedPacks
        };
      });

      const patientData = {
        name: formData.name.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        mobileNumber: formData.mobileNumber.trim(),
        email: formData.email.trim(),
        sampleCollectionDate: formData.sampleCollectionDate,
        refDoctor: formData.refDoctor?._id || null,
        refAgent: formData.refAgent?._id || null,
        totalAmount: Number(formData.totalAmount),
        advancePaid: Number(formData.advancePaid) || 0,
        dueAmount,
        selectedTests: selectedTestsPayload
      };

      const response = await api.post('/patients', patientData);
      setSuccess(`Patient entry created successfully. Reg No: ${response.data.regNo}`);
      setFormData({
        name: '', age: '', gender: '', mobileNumber: '', email: '', emailUsername: '',
        sampleCollectionDate: new Date(), refDoctor: null, refAgent: null,
        totalAmount: '', advancePaid: '', selectedTests: []
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create patient entry';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const dueAmount = Number(formData.totalAmount || 0) - Number(formData.advancePaid || 0);

  const selectedTestCount = formData.selectedTests.filter(selectedTest => {
    const hasSelectedDirect = selectedTest.subtests && selectedTest.subtests.some(s => s.selected);
    const hasSelectedPack = selectedTest.packs && selectedTest.packs.some(pack => pack.subtests && pack.subtests.some(sub => sub.selected));
    return hasSelectedDirect || hasSelectedPack;
  }).length;

  return (
    <Container maxWidth="lg" sx={{ mb: 6, position: 'relative' }}>
      
      {/* ── Alerts ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ marginBottom: 16 }}>
            <Alert severity="error" sx={{ borderRadius: 'var(--radius-md)' }}>{error}</Alert>
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ marginBottom: 16 }}>
            <Alert severity="success" sx={{ borderRadius: 'var(--radius-md)' }}>{success}</Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Box component="form" onSubmit={handleSubmit}>
        
        {/* ── Header ────────────────────────────────────────────── */}
        <Box sx={{ mb: 4, position: 'relative', display: 'inline-block' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', mb: 0.5 }}>
            Patient Entry
          </Typography>
          <motion.div
            variants={prefersReduced ? false : underlineVariants}
            initial="hidden" animate="visible"
            style={{
              height: '4px',
              background: 'var(--gradient-brand)',
              borderRadius: '2px',
              width: '100%',
              transformOrigin: 'left center'
            }}
          />
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 1 }}>
            Register new patient and select diagnostic tests.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          
          {/* ═══════ LEFT COLUMN: Form Area ═══════ */}
          <Grid item xs={12} lg={8}>
            <motion.div variants={prefersReduced ? false : containerVariants} initial="hidden" animate="visible">
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 5 },
                  borderRadius: 'var(--radius-3xl)',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.6)',
                  boxShadow: '0 24px 48px rgba(11,31,58,0.05), inset 0 2px 4px rgba(255,255,255,0.8)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* ── Section Label ── */}
                <motion.div variants={itemVariants}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />
                    <Typography variant="overline" sx={{ fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
                      Patient Information
                    </Typography>
                  </Box>
                </motion.div>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <motion.div variants={itemVariants}>
                      <TextField
                        label="Full Name *" name="name"
                        value={formData.name} onChange={handleInputChange}
                        fullWidth required variant="filled"
                        InputProps={{ disableUnderline: true }}
                        sx={glassFieldSx}
                      />
                    </motion.div>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <motion.div variants={itemVariants}>
                      <TextField
                        label="Age *" name="age"
                        value={formData.age} onChange={handleInputChange}
                        fullWidth required variant="filled"
                        InputProps={{ disableUnderline: true }}
                        sx={glassFieldSx}
                      />
                    </motion.div>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <motion.div variants={itemVariants}>
                      <FormControl fullWidth required variant="filled" sx={glassFieldSx}>
                        <Select
                          name="gender" value={formData.gender}
                          onChange={handleInputChange} disableUnderline
                          displayEmpty
                        >
                          <MenuItem value="" disabled>Gender *</MenuItem>
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                          <MenuItem value="Others">Others</MenuItem>
                        </Select>
                      </FormControl>
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <motion.div variants={itemVariants}>
                      <TextField
                        label="Mobile Number" name="mobileNumber"
                        value={formData.mobileNumber} onChange={handleInputChange}
                        fullWidth variant="filled"
                        InputProps={{ disableUnderline: true }}
                        sx={glassFieldSx}
                      />
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <motion.div variants={itemVariants}>
                      <TextField
                        label="Email (Username)" name="emailUsername"
                        value={formData.emailUsername}
                        onChange={(e) => {
                          const username = e.target.value.trim().replace(/@gmail\.com$/, '');
                          setFormData({ ...formData, emailUsername: username, email: username ? `${username}@gmail.com` : '' });
                        }}
                        fullWidth variant="filled"
                        InputProps={{
                          disableUnderline: true,
                          endAdornment: <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>@gmail.com</span>,
                        }}
                        sx={glassFieldSx}
                        helperText={formData.email ? `Email: ${formData.email}` : ''}
                      />
                    </motion.div>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <motion.div variants={itemVariants}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Collection Date"
                          value={formData.sampleCollectionDate}
                          onChange={(date) => setFormData({ ...formData, sampleCollectionDate: date })}
                          renderInput={(params) => (
                            <TextField {...params} fullWidth variant="filled" InputProps={{ disableUnderline: true }} sx={glassFieldSx} />
                          )}
                        />
                      </LocalizationProvider>
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <motion.div variants={itemVariants}>
                      <Autocomplete
                        options={doctors} getOptionLabel={(opt) => opt.name}
                        value={formData.refDoctor}
                        isOptionEqualToValue={(opt, val) => opt && val && opt._id === val._id}
                        onChange={(e, val) => setFormData({ ...formData, refDoctor: val })}
                        renderInput={(params) => (
                          <TextField {...params} label="Ref. Doctor" variant="filled" InputProps={{ ...params.InputProps, disableUnderline: true }} sx={glassFieldSx} />
                        )}
                      />
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <motion.div variants={itemVariants}>
                      <Autocomplete
                        options={agents} getOptionLabel={(opt) => opt.name}
                        value={formData.refAgent}
                        isOptionEqualToValue={(opt, val) => opt && val && opt._id === val._id}
                        onChange={(e, val) => setFormData({ ...formData, refAgent: val })}
                        renderInput={(params) => (
                          <TextField {...params} label="Ref. Agent" variant="filled" InputProps={{ ...params.InputProps, disableUnderline: true }} sx={glassFieldSx} />
                        )}
                      />
                    </motion.div>
                  </Grid>
                </Grid>

                {/* ── Financial Section ── */}
                <motion.div variants={itemVariants}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 5, mb: 3 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-secondary)' }} />
                    <Typography variant="overline" sx={{ fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
                      Financial Details
                    </Typography>
                  </Box>
                </motion.div>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <motion.div variants={itemVariants}>
                      <TextField
                        label="Total Amount *" name="totalAmount" type="number"
                        value={formData.totalAmount} onChange={handleInputChange}
                        fullWidth required variant="filled"
                        InputProps={{ disableUnderline: true }}
                        sx={glassFieldSx}
                      />
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <motion.div variants={itemVariants}>
                      <TextField
                        label="Advance Paid" name="advancePaid" type="number"
                        value={formData.advancePaid} onChange={handleInputChange}
                        fullWidth variant="filled"
                        InputProps={{ disableUnderline: true }}
                        sx={glassFieldSx}
                      />
                    </motion.div>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <motion.div variants={itemVariants}>
                      <TextField
                        label="Due Amount" value={dueAmount}
                        fullWidth variant="filled"
                        InputProps={{ disableUnderline: true, readOnly: true }}
                        sx={{
                          ...glassFieldSx,
                          '& .MuiFilledInput-root': {
                            bgcolor: dueAmount > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                          }
                        }}
                      />
                    </motion.div>
                  </Grid>
                </Grid>

                <motion.div variants={itemVariants}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 5 }}>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit" 
                        disabled={loading}
                        className="btn-primary"
                        sx={{ px: 4, py: 1.5 }}
                      >
                        {loading ? 'Saving...' : 'Save Patient Entry'}
                      </Button>
                    </motion.div>
                  </Box>
                </motion.div>

              </Paper>
            </motion.div>
          </Grid>

          {/* ═══════ RIGHT COLUMN: Selected Tests ═══════ */}
          <Grid item xs={12} lg={4}>
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
              style={{ position: 'sticky', top: 100 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 'var(--radius-3xl)',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.3) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 24px 48px rgba(11,31,58,0.05), inset 0 2px 4px rgba(255,255,255,0.6)',
                  height: { xs: 'auto', lg: 'calc(100vh - 140px)' },
                  maxHeight: { xs: '600px', lg: 'none' },
                  display: 'flex', flexDirection: 'column'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                    Selected Tests
                  </Typography>
                  <Box sx={{ background: 'var(--surface-dark)', color: '#fff', px: 1.5, py: 0.5, borderRadius: 'var(--radius-pill)', fontSize: '0.75rem', fontWeight: 700 }}>
                    {selectedTestCount} Tests
                  </Box>
                </Box>

                <Button
                  className="btn-outline"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={() => setShowTestSelection(true)}
                  sx={{ mb: 3 }}
                >
                  Add / Edit Tests
                </Button>

                <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.1)', borderRadius: 10 } }}>
                  <AnimatePresence>
                    {selectedTestCount === 0 ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Box sx={{ textAlign: 'center', py: 8, opacity: 0.5 }}>
                          <TestIcon sx={{ fontSize: 48, color: 'var(--text-muted)', mb: 1 }} />
                          <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>No tests selected yet</Typography>
                        </Box>
                      </motion.div>
                    ) : (
                      formData.selectedTests
                        .filter(st => (st.subtests && st.subtests.some(s => s.selected)) || (st.packs && st.packs.some(p => p.subtests && p.subtests.some(s => s.selected))))
                        .map((st) => (
                          <motion.div
                            key={st.test._id}
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            layout
                            style={{ marginBottom: 12 }}
                          >
                            <Box sx={{
                              background: '#fff',
                              borderRadius: 'var(--radius-md)',
                              p: 2,
                              border: '1px solid var(--border-light)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CheckCircleOutlineIcon sx={{ color: 'var(--color-primary)', fontSize: 18, mr: 1 }} />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                  {st.test.name}
                                </Typography>
                              </Box>
                              
                              {/* Packs */}
                              {st.packs && st.packs.filter(p => p.subtests && p.subtests.some(s => s.selected)).map(pack => (
                                <Box key={pack._id} sx={{ ml: 3.5, mb: 1 }}>
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-secondary)' }}>📦 {pack.name}</Typography>
                                  {pack.subtests.filter(s => s.selected).map(sub => (
                                    <Typography key={sub._id} sx={{ fontSize: '0.75rem', color: 'var(--text-secondary)', ml: 1.5 }}>
                                      · {sub.name} {sub.unit && `(${sub.unit})`}
                                    </Typography>
                                  ))}
                                </Box>
                              ))}

                              {/* Direct Subtests */}
                              {st.subtests && st.subtests.some(s => s.selected) && (
                                <Box sx={{ ml: 3.5 }}>
                                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)' }}>🧪 Direct Subtests</Typography>
                                  {st.subtests.filter(s => s.selected).map(sub => (
                                    <Typography key={sub._id} sx={{ fontSize: '0.75rem', color: 'var(--text-secondary)', ml: 1.5 }}>
                                      · {sub.name} {sub.unit && `(${sub.unit})`}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                            </Box>
                          </motion.div>
                        ))
                    )}
                  </AnimatePresence>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Box>

      {/* ── Test Selection Modal ────────────────────────────────────── */}
      <Dialog
        fullWidth maxWidth="lg"
        open={showTestSelection}
        onClose={() => setShowTestSelection(false)}
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            borderRadius: 'var(--radius-2xl)',
            background: 'var(--surface-paper)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.15)',
            minHeight: '70vh',
            overflow: 'hidden',
          }
        }}
        sx={{
          backdropFilter: 'blur(8px)',
        }}
      >
        <Box sx={{ px: 4, py: 3, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.5)' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Select Diagnostic Tests</Typography>
          <IconButton onClick={() => setShowTestSelection(false)} sx={{ color: 'var(--text-secondary)' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, bgcolor: 'var(--surface-light)' }}>
          
          {/* Col 1: Tests */}
          <Box sx={{ flex: 1, width: '100%', borderRight: { xs: 'none', md: '1px solid var(--border-light)' }, borderBottom: { xs: '1px solid var(--border-light)', md: 'none' }, bgcolor: '#fff' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid var(--border-light)', bgcolor: 'rgba(0,0,0,0.02)' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>1. Select a Test</Typography>
            </Box>
            <List sx={{ p: 0, overflowY: 'auto', height: 'calc(70vh - 100px)' }}>
              {tests.map((test) => {
                const selectedTest = formData.selectedTests.find(t => t.test._id === test._id);
                const isSelected = selectedTest && ((selectedTest.subtests && selectedTest.subtests.some(s => s.selected)) || (selectedTest.packs && selectedTest.packs.some(p => p.subtests && p.subtests.some(s => s.selected))));
                const isActive = activeTestId === test._id;
                return (
                  <ListItem
                    button key={test._id}
                    onClick={() => {
                      setActiveTestId(test._id);
                      setActivePackId(null);
                      if (!formData.selectedTests.some(t => t.test._id === test._id)) handleTestSelection(test);
                    }}
                    sx={{
                      borderBottom: '1px solid var(--border-light)',
                      bgcolor: isActive ? 'rgba(15,110,86,0.06)' : 'transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontWeight: isActive || isSelected ? 700 : 500, color: isActive ? 'var(--color-primary)' : 'var(--text-primary)' }}>
                            {test.name}
                          </Typography>
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                <CheckCircleOutlineIcon sx={{ color: 'var(--color-primary)', fontSize: 18 }} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>

          {/* Col 2: Subtests & Packs */}
          <Box sx={{ flex: 1, width: '100%', borderRight: { xs: 'none', md: '1px solid var(--border-light)' }, borderBottom: { xs: '1px solid var(--border-light)', md: 'none' }, bgcolor: '#fff', minHeight: { xs: '300px', md: 'auto' } }}>
            {activeTestId ? (
              <>
                <Box sx={{ p: 2, borderBottom: '1px solid var(--border-light)', bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>2. Direct Subtests & Packs</Typography>
                </Box>
                <List sx={{ p: 0, overflowY: 'auto', height: 'calc(70vh - 100px)' }}>
                  {/* ... logic for subtests ... */}
                  {(() => {
                    const test = tests.find(t => t._id === activeTestId);
                    const selectedTest = formData.selectedTests.find(t => t.test._id === activeTestId);
                    if (test && Array.isArray(test.subtests) && test.subtests.length > 0) {
                      return [
                        <Box key="header-subtests" sx={{ p: 1.5, bgcolor: 'rgba(15,110,86,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>DIRECT SUBTESTS</Typography>
                          <Button size="small" sx={{ fontSize: '0.7rem' }} onClick={() => {
                            const allSel = test.subtests.every(sub => selectedTest.subtests.find(s => s._id === sub._id && s.selected));
                            test.subtests.forEach(sub => { if (allSel || !selectedTest.subtests.find(s => s._id === sub._id && s.selected)) handleSubtestSelection(test._id, sub._id); });
                          }}>{test.subtests.every(sub => selectedTest.subtests.find(s => s._id === sub._id && s.selected)) ? 'Deselect All' : 'Select All'}</Button>
                        </Box>,
                        ...test.subtests.map((sub) => (
                          <ListItem key={sub._id} sx={{ pl: 3, borderBottom: '1px solid var(--border-light)' }}>
                            <Checkbox 
                              checked={!!(selectedTest && selectedTest.subtests && selectedTest.subtests.find(s => s._id === sub._id && s.selected))} 
                              onChange={() => handleSubtestSelection(test._id, sub._id)} size="small" 
                              sx={{ '&.Mui-checked': { color: 'var(--color-primary)' } }}
                            />
                            <ListItemText primary={sub.name + (sub.unit ? ` (${sub.unit})` : '')} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                          </ListItem>
                        ))
                      ];
                    }
                    return null;
                  })()}
                  {/* ... logic for packs ... */}
                  {(() => {
                    const test = tests.find(t => t._id === activeTestId);
                    const selectedTest = formData.selectedTests.find(t => t.test._id === activeTestId);
                    if (test && Array.isArray(test.packs) && test.packs.length > 0) {
                      return [
                        <Box key="header-packs" sx={{ p: 1.5, bgcolor: 'rgba(11,31,58,0.04)' }}>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-secondary)' }}>TEST PACKS</Typography>
                        </Box>,
                        ...test.packs.map((pack) => {
                          const selectedPack = selectedTest && selectedTest.packs && selectedTest.packs.find(p => p._id === pack._id);
                          const isActivePack = activePackId === pack._id;
                          const hasSelectedSubs = selectedPack && selectedPack.subtests && selectedPack.subtests.some(s => s.selected);
                          return (
                            <ListItem 
                              button key={pack._id} 
                              onClick={() => { 
                                setActivePackId(pack._id); 
                                if (!(selectedPack && selectedPack.selected)) handlePackSelection(test._id, pack._id); 
                              }}
                              sx={{ 
                                bgcolor: isActivePack ? 'rgba(11,31,58,0.06)' : 'transparent',
                                borderBottom: '1px solid var(--border-light)' 
                              }}
                            >
                              <ListItemText 
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: hasSelectedSubs ? 700 : 500, color: hasSelectedSubs ? 'var(--color-secondary)' : 'inherit' }}>
                                      {pack.name}
                                    </Typography>
                                    {hasSelectedSubs && <CheckCircleOutlineIcon sx={{ color: 'var(--color-secondary)', fontSize: 16 }} />}
                                  </Box>
                                } 
                              />
                            </ListItem>
                          );
                        })
                      ];
                    }
                    return null;
                  })()}
                </List>
              </>
            ) : (
              <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a test first</Typography>
              </Box>
            )}
          </Box>

          {/* Col 3: Pack Subtests */}
          <Box sx={{ flex: 1, width: '100%', bgcolor: 'rgba(0,0,0,0.01)', minHeight: { xs: '300px', md: 'auto' } }}>
            {activeTestId && activePackId ? (() => {
              const test = tests.find(t => t._id === activeTestId);
              const pack = test && test.packs ? test.packs.find(p => p._id === activePackId) : null;
              const selectedTest = formData.selectedTests.find(t => t.test._id === activeTestId);
              const selectedPack = selectedTest && selectedTest.packs && selectedTest.packs.find(p => p._id === activePackId);
              if (pack && selectedPack && selectedPack.selected) {
                const allSelected = pack.subtests && pack.subtests.length > 0 && pack.subtests.every(sub => selectedPack.subtests.find(s => s._id === sub._id && s.selected));
                return (
                  <>
                    <Box sx={{ p: 2, borderBottom: '1px solid var(--border-light)', bgcolor: 'rgba(0,0,0,0.02)' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>3. Select in {pack.name}</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-light)' }}>
                      <Button size="small" onClick={() => {
                          if (allSelected) pack.subtests.forEach(sub => handleSubtestSelection(activeTestId, sub._id, activePackId));
                          else pack.subtests.forEach(sub => { if (!selectedPack.subtests.find(s => s._id === sub._id && s.selected)) handleSubtestSelection(activeTestId, sub._id, activePackId); });
                        }}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </Button>
                    </Box>
                    <List sx={{ p: 0, overflowY: 'auto', height: 'calc(70vh - 146px)' }}>
                      {(pack.subtests || []).map((sub) => (
                        <ListItem key={sub._id} sx={{ pl: 3, borderBottom: '1px solid var(--border-light)' }}>
                          <Checkbox 
                            checked={!!(selectedPack && selectedPack.subtests && selectedPack.subtests.find(s => s._id === sub._id && s.selected))} 
                            onChange={() => handleSubtestSelection(activeTestId, sub._id, activePackId)} size="small" 
                            sx={{ '&.Mui-checked': { color: 'var(--color-secondary)' } }}
                          />
                          <ListItemText primary={sub.name + (sub.unit ? ` (${sub.unit})` : '')} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                );
              }
              return (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a pack to view subtests</Typography>
                </Box>
              );
            })() : (
              <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a pack first</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <Box sx={{ p: 2, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', bgcolor: '#fff' }}>
          <Button className="btn-primary" onClick={() => setShowTestSelection(false)}>
            Done
          </Button>
        </Box>
      </Dialog>
    </Container>
  );
}

// ── Reusable Styles ──────────────────────────────────────────────────────────
const glassFieldSx = {
  '& .MuiFilledInput-root': {
    backgroundColor: 'rgba(255,255,255,0.6)',
    backdropFilter: 'blur(12px)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(255,255,255,0.4)',
    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5), 0 2px 8px rgba(0,0,0,0.02)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.8)',
      borderColor: 'rgba(15,110,86,0.3)',
      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 12px rgba(15,110,86,0.08)',
    },
    '&.Mui-focused': {
      backgroundColor: '#fff',
      borderColor: 'var(--color-primary)',
      boxShadow: '0 0 0 4px rgba(15,110,86,0.15)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'var(--text-secondary)',
    fontWeight: 500,
    fontSize: '0.9rem',
    transition: 'all 0.2s',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'var(--color-primary)',
    fontWeight: 700,
  },
};

export default PatientEntry;