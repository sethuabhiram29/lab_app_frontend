/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button,
  FormControl, Select, MenuItem, Autocomplete,
  List, ListItem, ListItemText, Checkbox, Container, Alert,
  IconButton, Dialog, DialogContent, Slide, Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  Close as CloseIcon,
  LocalHospital as TestIcon,
  Add as AddIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Science as ScienceIcon,
  VerifiedUser as VerifiedIcon,
  ArrowForward as ArrowForwardIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import api from '../api';

// ── Framer Motion variants ────────────────────────────────────────────────────
const sectionReveal = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const fieldReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }
};

const heroTextReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
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

  const handleReset = () => {
    setFormData({
      name: '', age: '', gender: '', mobileNumber: '', email: '', emailUsername: '',
      sampleCollectionDate: new Date(), refDoctor: null, refAgent: null,
      totalAmount: '', advancePaid: '', selectedTests: []
    });
    setError('');
    setSuccess('');
  };

  const dueAmount = Number(formData.totalAmount || 0) - Number(formData.advancePaid || 0);

  const selectedTestCount = formData.selectedTests.filter(selectedTest => {
    const hasSelectedDirect = selectedTest.subtests && selectedTest.subtests.some(s => s.selected);
    const hasSelectedPack = selectedTest.packs && selectedTest.packs.some(pack => pack.subtests && pack.subtests.some(sub => sub.selected));
    return hasSelectedDirect || hasSelectedPack;
  }).length;

  return (
    <Box sx={{
      minHeight: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      bgcolor: '#F8FAFC',
    }}>
      {/* ── Background Image ─────────────────────────────────── */}
      <Box sx={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url(/patient_entry_bg_light.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 1,
        zIndex: 0,
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.2)', // Very subtle overall lightening, no heavy gradient
        }
      }} />

      <Box sx={{ position: 'relative', zIndex: 1, pt: 3, pb: 6, px: 3, width: '100%' }}>
        
        {/* ── Alerts ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ marginBottom: 16 }}>
              <Alert severity="error" sx={{ borderRadius: 'var(--radius-md)', bgcolor: 'rgba(239,68,68,0.15)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)', '& .MuiAlert-icon': { color: '#EF4444' } }}>{error}</Alert>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ marginBottom: 16 }}>
              <Alert severity="success" sx={{ borderRadius: 'var(--radius-md)', bgcolor: 'rgba(16,185,129,0.15)', color: '#6EE7B7', border: '1px solid rgba(16,185,129,0.3)', '& .MuiAlert-icon': { color: '#10B981' } }}>{success}</Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── NABL Badge ──────────────────────────────────────── */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}
        >
          <Chip
            icon={<VerifiedIcon sx={{ color: '#10B981 !important', fontSize: 16 }} />}
            label="NABL CERTIFIED"
            sx={{
              bgcolor: 'rgba(16,185,129,0.1)',
              color: '#10B981',
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 'var(--radius-pill)',
            }}
          />
        </motion.div>

        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>

          {/* ── Main Two-Column Layout ── */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr', lg: '60fr 40fr' }, gap: 3, width: '100%' }}>

            {/* ═══════ LEFT COLUMN ═══════ */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>

              {/* ── Patient Information Card ── */}
              <motion.div
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                <Paper elevation={0} sx={darkCardSx}>
                  {/* Card Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PersonIcon sx={{ color: '#10B981', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>Patient Information</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Identity, contact & collection metadata.</Typography>
                    </Box>
                  </Box>

                  <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(12, 1fr)', 
                      gap: 2 
                    }}>
                      <Box sx={{ gridColumn: 'span 12' }}>
                        <motion.div variants={fieldReveal}>
                          <Typography sx={fieldLabelSx}>FULL NAME</Typography>
                          <TextField
                            name="name" value={formData.name} onChange={handleInputChange}
                            fullWidth required variant="filled" placeholder="Mahesh Kumar"
                            InputProps={{ disableUnderline: true }}
                            sx={darkFieldSx}
                          />
                        </motion.div>
                      </Box>
                      
                      <Box sx={{ gridColumn: 'span 6' }}>
                        <motion.div variants={fieldReveal}>
                          <Typography sx={fieldLabelSx}>AGE</Typography>
                          <TextField
                            name="age" value={formData.age} onChange={handleInputChange}
                            fullWidth required variant="filled" placeholder="24"
                            InputProps={{ disableUnderline: true }}
                            sx={darkFieldSx}
                          />
                        </motion.div>
                      </Box>
                      
                      <Box sx={{ gridColumn: 'span 6' }}>
                        <motion.div variants={fieldReveal}>
                          <Typography sx={fieldLabelSx}>GENDER</Typography>
                          <FormControl fullWidth required variant="filled" sx={darkFieldSx}>
                            <Select
                              name="gender" value={formData.gender}
                              onChange={handleInputChange} disableUnderline
                              displayEmpty
                              sx={{ color: formData.gender ? '#E2E8F0' : '#475569' }}
                            >
                              <MenuItem value="" disabled>Select</MenuItem>
                              <MenuItem value="Male">Male</MenuItem>
                              <MenuItem value="Female">Female</MenuItem>
                              <MenuItem value="Others">Others</MenuItem>
                            </Select>
                          </FormControl>
                        </motion.div>
                      </Box>

                      <Box sx={{ gridColumn: 'span 12' }}>
                        <motion.div variants={fieldReveal}>
                          <Typography sx={fieldLabelSx}>MOBILE NUMBER</Typography>
                          <TextField
                            name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange}
                            fullWidth variant="filled" placeholder="+91 98765 43210"
                            InputProps={{ disableUnderline: true }}
                            sx={darkFieldSx}
                          />
                        </motion.div>
                      </Box>
                      
                      <Box sx={{ gridColumn: 'span 12' }}>
                        <motion.div variants={fieldReveal}>
                          <Typography sx={fieldLabelSx}>EMAIL (USERNAME)</Typography>
                          <TextField
                            name="emailUsername" value={formData.emailUsername}
                            onChange={(e) => {
                              const username = e.target.value.trim().replace(/@gmail\.com$/, '');
                              setFormData({ ...formData, emailUsername: username, email: username ? `${username}@gmail.com` : '' });
                            }}
                            fullWidth variant="filled" placeholder="name@gmail.com"
                            InputProps={{
                              disableUnderline: true,
                              endAdornment: <span style={{ color: '#475569', fontSize: '0.85rem' }}>@gmail.com</span>,
                            }}
                            sx={darkFieldSx}
                          />
                        </motion.div>
                      </Box>

                      <Box sx={{ gridColumn: 'span 4' }}>
                        <motion.div variants={fieldReveal}>
                          <Typography sx={fieldLabelSx}>COLLECTION DATE</Typography>
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                              value={formData.sampleCollectionDate}
                              onChange={(date) => setFormData({ ...formData, sampleCollectionDate: date })}
                              renderInput={(params) => (
                                <TextField {...params} fullWidth variant="filled" InputProps={{ disableUnderline: true }} sx={darkFieldSx} />
                              )}
                            />
                          </LocalizationProvider>
                        </motion.div>
                      </Box>
                      
                      <Box sx={{ gridColumn: 'span 4' }}>
                        <motion.div variants={fieldReveal}>
                          <Typography sx={fieldLabelSx}>REF. DOCTOR</Typography>
                          <Autocomplete
                            options={doctors} getOptionLabel={(opt) => opt.name}
                            value={formData.refDoctor}
                            isOptionEqualToValue={(opt, val) => opt && val && opt._id === val._id}
                            onChange={(e, val) => setFormData({ ...formData, refDoctor: val })}
                            renderInput={(params) => (
                              <TextField {...params} variant="filled" placeholder="Dr. name" InputProps={{ ...params.InputProps, disableUnderline: true }} sx={darkFieldSx} />
                            )}
                          />
                        </motion.div>
                      </Box>
                      
                      <Box sx={{ gridColumn: 'span 4' }}>
                        <motion.div variants={fieldReveal}>
                          <Typography sx={fieldLabelSx}>REF. AGENT</Typography>
                          <Autocomplete
                            options={agents} getOptionLabel={(opt) => opt.name}
                            value={formData.refAgent}
                            isOptionEqualToValue={(opt, val) => opt && val && opt._id === val._id}
                            onChange={(e, val) => setFormData({ ...formData, refAgent: val })}
                            renderInput={(params) => (
                              <TextField {...params} variant="filled" placeholder="Agent" InputProps={{ ...params.InputProps, disableUnderline: true }} sx={darkFieldSx} />
                            )}
                          />
                        </motion.div>
                      </Box>
                    </Box>
                  </motion.div>
                </Paper>
              </motion.div>

              {/* ── Financial Details Card ── */}
              <motion.div
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                style={{ marginTop: 24 }}
              >
                <Paper elevation={0} sx={darkCardSx}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MoneyIcon sx={{ color: '#818CF8', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>Financial Details</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Line-balance sheet for this visit.</Typography>
                    </Box>
                  </Box>

                  <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(12, 1fr)', 
                      gap: 2 
                    }}>
                      <Box sx={{ gridColumn: 'span 4' }}>
                        <motion.div variants={fieldReveal}>
                          <Typography sx={fieldLabelSx}>TOTAL AMOUNT</Typography>
                          <TextField
                            name="totalAmount" type="number" value={formData.totalAmount} onChange={handleInputChange}
                            fullWidth required variant="filled" placeholder="₹ 0.00"
                            InputProps={{ disableUnderline: true }}
                            sx={darkFieldSx}
                          />
                        </motion.div>
                      </Box>
                      <Box sx={{ gridColumn: 'span 4' }}>
                        <motion.div variants={fieldReveal}>
                          <Typography sx={fieldLabelSx}>ADVANCE PAID</Typography>
                          <TextField
                            name="advancePaid" type="number" value={formData.advancePaid} onChange={handleInputChange}
                            fullWidth variant="filled" placeholder="₹ 0.00"
                            InputProps={{ disableUnderline: true }}
                            sx={darkFieldSx}
                          />
                        </motion.div>
                      </Box>
                      <Box sx={{ gridColumn: 'span 4' }}>
                        <motion.div variants={fieldReveal}>
                          <Typography sx={fieldLabelSx}>DUE AMOUNT</Typography>
                          <TextField
                            value={`₹ ${dueAmount.toFixed(2)}`}
                            fullWidth variant="filled"
                            InputProps={{ disableUnderline: true, readOnly: true }}
                            sx={{
                              ...darkFieldSx,
                              '& .MuiFilledInput-root': {
                                ...darkFieldSx['& .MuiFilledInput-root'],
                                backgroundColor: dueAmount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                                borderColor: dueAmount > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
                              },
                              '& .MuiFilledInput-input': {
                                color: dueAmount > 0 ? '#FCA5A5' : '#6EE7B7',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                              }
                            }}
                          />
                        </motion.div>
                      </Box>
                    </Box>

                    <motion.div variants={fieldReveal}>
                      <Typography sx={{ fontSize: '0.75rem', color: '#475569', mt: 2, mb: 2 }}>
                        Balance = total − advance
                      </Typography>
                    </motion.div>
                  </motion.div>
                </Paper>
              </motion.div>

            </Box>

            {/* ═══════ RIGHT COLUMN: Test Panel ═══════ */}
            <Box sx={{ width: '100%' }}>

              {/* ── Selected Tests Card ── */}
              <motion.div
                variants={sectionReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
              >
                <Paper elevation={0} sx={{
                  ...darkCardSx,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ScienceIcon sx={{ color: '#10B981', fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>Selected Tests</Typography>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>PANEL SNAPSHOT</Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={`${selectedTestCount} Tests`}
                      sx={{
                        bgcolor: 'rgba(16,185,129,0.15)',
                        color: '#10B981',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        border: '1px solid rgba(16,185,129,0.25)',
                      }}
                    />
                  </Box>

                  {/* Add Tests Button */}
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      fullWidth
                      startIcon={<AddIcon />}
                      onClick={() => setShowTestSelection(true)}
                      sx={{
                        mb: 3,
                        py: 1.5,
                        borderRadius: 'var(--radius-lg)',
                        border: '1px dashed rgba(16,185,129,0.4)',
                        color: '#94A3B8',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        background: 'rgba(16,185,129,0.04)',
                        '&:hover': {
                          background: 'rgba(16,185,129,0.1)',
                          border: '1px solid rgba(16,185,129,0.5)',
                          color: '#10B981',
                        },
                        transition: 'all 0.3s',
                      }}
                    >
                      Add / Edit Tests
                    </Button>
                  </motion.div>

                  {/* Test List */}
                  <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: 10 } }}>
                    <AnimatePresence>
                      {selectedTestCount === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <Box sx={{ textAlign: 'center', py: 8, opacity: 0.5 }}>
                            <TestIcon sx={{ fontSize: 48, color: '#334155', mb: 1 }} />
                            <Typography variant="body2" sx={{ color: '#475569' }}>No tests selected yet</Typography>
                          </Box>
                        </motion.div>
                      ) : (
                        formData.selectedTests
                          .filter(st => (st.subtests && st.subtests.some(s => s.selected)) || (st.packs && st.packs.some(p => p.subtests && p.subtests.some(s => s.selected))))
                          .map((st, idx) => (
                            <motion.div
                              key={st.test._id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ delay: idx * 0.1 }}
                              layout
                              style={{ marginBottom: 12 }}
                            >
                              <Box sx={{
                                background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(13,148,136,0.04) 100%)',
                                borderRadius: 'var(--radius-lg)',
                                p: 2,
                                border: '1px solid rgba(16,185,129,0.15)',
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <CheckCircleOutlineIcon sx={{ color: '#10B981', fontSize: 18, mr: 1 }} />
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#E2E8F0' }}>
                                    {st.test.name}
                                  </Typography>
                                </Box>

                                {/* Direct Subtests as chips */}
                                {st.subtests && st.subtests.some(s => s.selected) && (
                                  <Box sx={{ ml: 3.5, mb: 1 }}>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981', letterSpacing: '0.05em', mb: 0.5 }}>DIRECT SUBTESTS</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {st.subtests.filter(s => s.selected).map(sub => (
                                        <Chip
                                          key={sub._id}
                                          label={`${sub.name}${sub.unit ? ` (${sub.unit})` : ''}`}
                                          size="small"
                                          sx={{
                                            bgcolor: 'rgba(16,185,129,0.1)',
                                            color: '#94A3B8',
                                            fontSize: '0.7rem',
                                            fontWeight: 500,
                                            height: 24,
                                            border: '1px solid rgba(16,185,129,0.15)',
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                )}

                                {/* Packs */}
                                {st.packs && st.packs.filter(p => p.subtests && p.subtests.some(s => s.selected)).map(pack => (
                                  <Box key={pack._id} sx={{ ml: 3.5, mb: 1 }}>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#818CF8', letterSpacing: '0.05em', mb: 0.5 }}>📦 {pack.name}</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {pack.subtests.filter(s => s.selected).map(sub => (
                                        <Chip
                                          key={sub._id}
                                          label={`${sub.name}${sub.unit ? ` (${sub.unit})` : ''}`}
                                          size="small"
                                          sx={{
                                            bgcolor: 'rgba(99,102,241,0.1)',
                                            color: '#94A3B8',
                                            fontSize: '0.7rem',
                                            fontWeight: 500,
                                            height: 24,
                                            border: '1px solid rgba(99,102,241,0.15)',
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </motion.div>
                          ))
                      )}
                    </AnimatePresence>
                  </Box>

                  {/* Estimated Total & Proceed */}
                  <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.06)', mt: 2, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ESTIMATED TOTAL</Typography>
                      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>₹ {Number(formData.totalAmount || 0).toFixed(2)}</Typography>
                    </Box>
                    <motion.div whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => setShowTestSelection(true)}
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          borderRadius: 'var(--radius-pill)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#E2E8F0',
                          fontWeight: 600,
                          px: 3,
                          py: 1,
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                        }}
                      >
                        Proceed
                      </Button>
                    </motion.div>
                  </Box>
                </Paper>
              </motion.div>
            </Box>
          </Box>

          {/* ── Bottom Action Bar ──────────────────────────────── */}
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
          >
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              mt: 5,
              mb: 2,
            }}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  startIcon={<ResetIcon />}
                  onClick={handleReset}
                  sx={{
                    borderRadius: 'var(--radius-pill)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#94A3B8',
                    fontWeight: 600,
                    px: 4, py: 1.3,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.25)' },
                  }}
                >
                  Reset
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  type="submit"
                  disabled={loading}
                  startIcon={<CheckCircleOutlineIcon />}
                  sx={{
                    borderRadius: 'var(--radius-pill)',
                    background: 'linear-gradient(135deg, #10B981 0%, #0D9488 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    px: 5, py: 1.3,
                    boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
                    '&:hover': { background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)', boxShadow: '0 12px 40px rgba(16,185,129,0.45)' },
                    '&:disabled': { opacity: 0.5 },
                  }}
                >
                  {loading ? 'Saving...' : 'Save Patient Entry'}
                </Button>
              </motion.div>
            </Box>
          </motion.div>
        </Box>
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
            background: '#111827',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
          }
        }}
        sx={{
          backdropFilter: 'blur(8px)',
          '& .MuiBackdrop-root': { backgroundColor: 'rgba(0,0,0,0.7)' },
        }}
      >
        <Box sx={{ px: 4, py: 3, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>Select Diagnostic Tests</Typography>
          <IconButton onClick={() => setShowTestSelection(false)} sx={{ color: '#94A3B8', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, bgcolor: '#0F172A', overflow: { xs: 'auto', md: 'hidden' }, flex: 1, minHeight: 0 }}>
          
          {/* Col 1: Tests */}
          <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: { xs: 'none', md: '1px solid rgba(255,255,255,0.06)' }, borderBottom: { xs: '1px solid rgba(255,255,255,0.06)', md: 'none' } }}>
            <Box sx={{ p: 2, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', bgcolor: 'rgba(255,255,255,0.02)' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>1. Select a Test</Typography>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, overscrollBehavior: 'contain' }}>
              <List sx={{ p: 0 }}>
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
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      bgcolor: isActive ? 'rgba(16,185,129,0.08)' : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontWeight: isActive || isSelected ? 700 : 500, color: isActive ? '#10B981' : '#CBD5E1', fontSize: '0.9rem' }}>
                            {test.name}
                          </Typography>
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                <CheckCircleOutlineIcon sx={{ color: '#10B981', fontSize: 18 }} />
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
          </Box>

          {/* Col 2: Subtests & Packs */}
          <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: { xs: 'none', md: '1px solid rgba(255,255,255,0.06)' }, borderBottom: { xs: '1px solid rgba(255,255,255,0.06)', md: 'none' } }}>
            {activeTestId ? (
              <>
                <Box sx={{ p: 2, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', bgcolor: 'rgba(255,255,255,0.02)' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>2. Direct Subtests & Packs</Typography>
                </Box>
                <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, overscrollBehavior: 'contain' }}>
                  <List sx={{ p: 0 }}>
                  {(() => {
                    const test = tests.find(t => t._id === activeTestId);
                    const selectedTest = formData.selectedTests.find(t => t.test._id === activeTestId);
                    if (test && Array.isArray(test.subtests) && test.subtests.length > 0) {
                      return [
                        <Box key="header-subtests" sx={{ p: 1.5, bgcolor: 'rgba(16,185,129,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>DIRECT SUBTESTS</Typography>
                          <Button size="small" sx={{ fontSize: '0.7rem', color: '#94A3B8' }} onClick={() => {
                            const allSel = test.subtests.every(sub => selectedTest.subtests.find(s => s._id === sub._id && s.selected));
                            test.subtests.forEach(sub => { if (allSel || !selectedTest.subtests.find(s => s._id === sub._id && s.selected)) handleSubtestSelection(test._id, sub._id); });
                          }}>{test.subtests.every(sub => selectedTest.subtests.find(s => s._id === sub._id && s.selected)) ? 'Deselect All' : 'Select All'}</Button>
                        </Box>,
                        ...test.subtests.map((sub) => (
                          <ListItem 
                            button
                            onClick={() => handleSubtestSelection(test._id, sub._id)}
                            key={sub._id} 
                            sx={{ pl: 3, borderBottom: '1px solid rgba(255,255,255,0.04)', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                          >
                            <Checkbox 
                              checked={!!(selectedTest && selectedTest.subtests && selectedTest.subtests.find(s => s._id === sub._id && s.selected))} 
                              onChange={() => handleSubtestSelection(test._id, sub._id)} size="small" 
                              sx={{ '&.Mui-checked': { color: '#10B981' }, color: '#475569' }}
                            />
                            <ListItemText primary={sub.name + (sub.unit ? ` (${sub.unit})` : '')} primaryTypographyProps={{ fontSize: '0.85rem', color: '#CBD5E1' }} />
                          </ListItem>
                        ))
                      ];
                    }
                    return null;
                  })()}
                  {(() => {
                    const test = tests.find(t => t._id === activeTestId);
                    const selectedTest = formData.selectedTests.find(t => t.test._id === activeTestId);
                    if (test && Array.isArray(test.packs) && test.packs.length > 0) {
                      return [
                        <Box key="header-packs" sx={{ p: 1.5, bgcolor: 'rgba(99,102,241,0.06)' }}>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#818CF8' }}>TEST PACKS</Typography>
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
                                bgcolor: isActivePack ? 'rgba(99,102,241,0.08)' : 'transparent',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                              }}
                            >
                              <ListItemText 
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: hasSelectedSubs ? 700 : 500, color: hasSelectedSubs ? '#818CF8' : '#CBD5E1' }}>
                                      {pack.name}
                                    </Typography>
                                    {hasSelectedSubs && <CheckCircleOutlineIcon sx={{ color: '#818CF8', fontSize: 16 }} />}
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
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#475569', fontSize: '0.85rem' }}>Select a test first</Typography>
              </Box>
            )}
          </Box>

          {/* Col 3: Pack Subtests */}
          <Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {activeTestId && activePackId ? (() => {
              const test = tests.find(t => t._id === activeTestId);
              const pack = test && test.packs ? test.packs.find(p => p._id === activePackId) : null;
              const selectedTest = formData.selectedTests.find(t => t.test._id === activeTestId);
              const selectedPack = selectedTest && selectedTest.packs && selectedTest.packs.find(p => p._id === activePackId);
              if (pack && selectedPack && selectedPack.selected) {
                const allSelected = pack.subtests && pack.subtests.length > 0 && pack.subtests.every(sub => selectedPack.subtests.find(s => s._id === sub._id && s.selected));
                return (
                  <>
                    <Box sx={{ p: 2, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', bgcolor: 'rgba(255,255,255,0.02)' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase' }}>3. Select in {pack.name}</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, flexShrink: 0, display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <Button size="small" sx={{ color: '#94A3B8', fontSize: '0.7rem' }} onClick={() => {
                          if (allSelected) pack.subtests.forEach(sub => handleSubtestSelection(activeTestId, sub._id, activePackId));
                          else pack.subtests.forEach(sub => { if (!selectedPack.subtests.find(s => s._id === sub._id && s.selected)) handleSubtestSelection(activeTestId, sub._id, activePackId); });
                        }}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </Button>
                    </Box>
                    <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, overscrollBehavior: 'contain' }}>
                      <List sx={{ p: 0 }}>
                      {(pack.subtests || []).map((sub) => (
                        <ListItem 
                          button
                          onClick={() => handleSubtestSelection(activeTestId, sub._id, activePackId)}
                          key={sub._id} 
                          sx={{ pl: 3, borderBottom: '1px solid rgba(255,255,255,0.04)', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                        >
                          <Checkbox 
                            checked={!!(selectedPack && selectedPack.subtests && selectedPack.subtests.find(s => s._id === sub._id && s.selected))} 
                            onChange={() => handleSubtestSelection(activeTestId, sub._id, activePackId)} size="small" 
                            sx={{ '&.Mui-checked': { color: '#818CF8' }, color: '#475569' }}
                          />
                          <ListItemText primary={sub.name + (sub.unit ? ` (${sub.unit})` : '')} primaryTypographyProps={{ fontSize: '0.85rem', color: '#CBD5E1' }} />
                        </ListItem>
                      ))}
                      </List>
                    </Box>
                  </>
                );
              }
              return (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: '#475569', fontSize: '0.85rem' }}>Select a pack to view subtests</Typography>
                </Box>
              );
            })() : (
              <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#475569', fontSize: '0.85rem' }}>Select a pack first</Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', bgcolor: '#111827' }}>
          <Button
            onClick={() => setShowTestSelection(false)}
            sx={{
              borderRadius: 'var(--radius-pill)',
              background: 'linear-gradient(135deg, #10B981 0%, #0D9488 100%)',
              color: '#fff',
              fontWeight: 700,
              px: 4,
              py: 1,
              '&:hover': { background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)' },
            }}
          >
            Done
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}

// ── Reusable Styles ──────────────────────────────────────────────────────────

const darkCardSx = {
  p: { xs: 1.5, sm: 2 },
  borderRadius: 'var(--radius-xl)',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 100%)',
  backdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 12px 36px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
};

const darkFieldSx = {
  '& .MuiFilledInput-root': {
    backgroundColor: 'rgba(255,255,255,0.35)',
    backdropFilter: 'blur(12px)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(255,255,255,0.7)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    minHeight: '2.5rem',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.55)',
      borderColor: 'rgba(16,185,129,0.5)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255,255,255,1)',
      borderColor: '#10B981',
      boxShadow: '0 0 0 3px rgba(16,185,129,0.15)',
    },
  },
  '& .MuiFilledInput-input': {
    color: '#0F172A',
    fontWeight: 600,
    fontSize: '0.85rem',
    padding: '10px 14px',
    '&::placeholder': { color: '#64748B', opacity: 1 },
  },
  '& .MuiInputLabel-root': {
    color: '#475569',
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#10B981',
    fontWeight: 700,
  },
  '& .MuiInputAdornment-root': {
    color: '#64748B',
  },
  '& .MuiSvgIcon-root': {
    color: '#64748B',
  },
  '& .MuiAutocomplete-inputRoot': {
    paddingTop: '2px !important',
    paddingBottom: '2px !important',
  },
};

const fieldLabelSx = {
  fontSize: '0.6rem',
  fontWeight: 700,
  color: '#64748B',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  mb: 0.4,
};

export default PatientEntry;