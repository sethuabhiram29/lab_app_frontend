/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Container,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CheckCircleOutline as CheckCircleOutlineIcon } from '@mui/icons-material';
import api from '../api';

function PatientEntry() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    mobileNumber: '',
    email: '',
    emailUsername: '', // Added for Gmail username handling
    sampleCollectionDate: new Date(),
    refDoctor: null,
    refAgent: null,
    totalAmount: '',
    advancePaid: '',
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
        console.log('Fetched doctors:', doctorsArr);
      } catch (err) {
        errorMsg += 'Failed to fetch doctors. ';
        console.error('Error fetching doctors:', err);
      }
      try {
        const agentsRes = await api.get('/agents');
        agentsArr = Array.isArray(agentsRes.data) ? agentsRes.data : (Array.isArray(agentsRes) ? agentsRes : []);
        setAgents(agentsArr);
        console.log('Fetched agents:', agentsArr);
      } catch (err) {
        errorMsg += 'Failed to fetch agents. ';
        console.error('Error fetching agents:', err);
      }
      try {
        const testsRes = await api.get('/tests');
        testsArr = Array.isArray(testsRes.data) ? testsRes.data : (Array.isArray(testsRes) ? testsRes : []);
        setTests(testsArr);
        console.log('Fetched tests:', testsArr);
      } catch (err) {
        errorMsg += 'Failed to fetch tests. ';
        console.error('Error fetching tests:', err);
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
        return {
          ...prev,
          selectedTests: newSelectedTests
        };
      } else {
        // Initialize subtests and packs selection
        const subtests = (test.subtests || []).map((s, idx) => ({ ...s, id: s._id || idx + '' + test._id, selected: false }));
        const packs = (test.packs || []).map((p, pIdx) => ({
          ...p,
          id: p._id || pIdx + '' + test._id,
          selected: false,
          subtests: (p.subtests || []).map((s, sIdx) => ({ ...s, id: s._id || pIdx + '' + sIdx + '_' + test._id }))
        }));
        const newTest = {
          test,
          subtests,
          packs
        };
        return {
          ...prev,
          selectedTests: [...prev.selectedTests, newTest]
        };
      }
    });
  };

  // Update handleSubtestSelection to handle both direct subtests and subtests within packs
  const handleSubtestSelection = (testId, subtestId, packId = null) => {
    setFormData(prev => {
      const newSelectedTests = prev.selectedTests.map(t => {
        if (t.test._id === testId) {
          if (packId) {
            // Subtest within a pack
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
            // Direct subtest
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

    // Debug: log selectedTests and their parameters
    console.log('Submitting selectedTests:', JSON.stringify(formData.selectedTests, null, 2));
    formData.selectedTests.forEach((test, i) => {
      console.log(`Test ${i} (${test.test.name}) parameters:`, test.parameters);
    });

    // Basic validation - mobileNumber is now optional
    if (!formData.name || !formData.age || !formData.gender || !formData.totalAmount) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      // Calculate due amount
      const dueAmount = formData.totalAmount - (formData.advancePaid || 0);

      // Prepare selected subtests for each test
      console.log('Preparing test payload from formData:', formData.selectedTests);
      const selectedTestsPayload = formData.selectedTests
        .filter(t => {
          // Only include tests that have something selected
          const hasSelectedSubtest = t.subtests && t.subtests.some(s => s.selected);
          const hasSelectedPack = t.packs && t.packs.some(p => p.selected);
          return hasSelectedSubtest || hasSelectedPack;
        })
        .map(t => {
          // Directly selected subtests
          const directSubtests = (t.subtests || []).filter(s => s.selected);
          // Selected packs and their subtests
          const selectedPacks = (t.packs || []).filter(p => p.selected).map(p => ({
            name: p.name,
            subtests: (p.subtests || []).map(s => ({ name: s.name, unit: s.unit, reference: s.reference, _id: s._id }))
          }));
        console.log('Processing test:', {
          testId: t.test._id,
          testName: t.test.name,
          selectedSubtests: directSubtests.length,
          selectedPacks: selectedPacks.length
        });
        return {
          test: t.test._id,
          subtests: directSubtests.map(s => ({ name: s.name, unit: s.unit, reference: s.reference, _id: s._id })),
          packs: selectedPacks
        };
      });

      // Prepare patient data
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

      console.log('Final patient data being sent:', JSON.stringify(patientData, null, 2));

      const response = await api.post('/patients', patientData);
      console.log('Server response:', response.data);

      // Show regNo in success message
      setSuccess(`Patient entry created successfully. Reg No: ${response.data.regNo}`);
      // Reset form
      setFormData({
        name: '',
        age: '',
        gender: '',
        mobileNumber: '',
        email: '',
        sampleCollectionDate: new Date(),
        refDoctor: null,
        refAgent: null,
        totalAmount: '',
        advancePaid: '',
        selectedTests: []
      });
    } catch (err) {
      console.error('Error creating patient:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error details:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to create patient entry';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate due amount for display
  const dueAmount = Number(formData.totalAmount || 0) - Number(formData.advancePaid || 0);

  // Count selected tests
  const selectedTestCount = formData.selectedTests.filter(selectedTest => {
    const hasSelectedDirect = selectedTest.subtests && selectedTest.subtests.some(s => s.selected);
    const hasSelectedPack = selectedTest.packs && selectedTest.packs.some(pack => pack.subtests && pack.subtests.some(sub => sub.selected));
    return hasSelectedDirect || hasSelectedPack;
  }).length;

  return (
    <Container maxWidth="xl" sx={{ mt: 1, mb: 4, pb: 10 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} className="animate-slide-up">
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} className="animate-slide-up">
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* Centered Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1F2937', mb: 1 }}>
            Patient Entry
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Fill in patient details and select the required diagnostic tests.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
          {/* ═══════ LEFT COLUMN: White Form Area ═══════ */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Paper 
              elevation={0} 
              className="animate-slide-left"
              sx={{ 
                width: '100%',
                height: 'calc(100vh - 190px)',
                overflowY: 'auto',
                p: { xs: 3, sm: 5 }, 
                borderRadius: '20px', 
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
              }}
            >
              {/* Patient Details Section */}
              <Box>
                  {/* Row 1: Name, Age, Gender */}
                  <Typography variant="overline" sx={{ color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.1em', display: 'block', mb: 2 }}>
                    PATIENT INFORMATION
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                        Patient Name <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      <TextField
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            document.querySelector('input[name="age"]')?.focus();
                          }
                        }}
                        fullWidth
                        required
                        placeholder="Enter full name"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                        Age <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      <TextField
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            document.querySelector('#gender-select')?.focus();
                          } else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
                            e.preventDefault();
                            document.querySelector('input[name="name"]')?.focus();
                          }
                        }}
                        fullWidth
                        required
                        placeholder="Age"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                        Gender <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      <FormControl fullWidth required size="small">
                        <Select
                          id="gender-select"
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          displayEmpty
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              document.querySelector('input[name="mobileNumber"]')?.focus();
                            } else if (e.key === 'ArrowLeft') {
                              e.preventDefault();
                              document.querySelector('input[name="age"]')?.focus();
                            }
                          }}
                        >
                          <MenuItem value="" disabled><em>Select</em></MenuItem>
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                          <MenuItem value="Others">Others</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {/* Row 2: Mobile, Email */}
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                        Mobile Number
                      </Typography>
                      <TextField
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            document.querySelector('input[name="emailUsername"]')?.focus();
                          } else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
                            e.preventDefault();
                            document.querySelector('#gender-select')?.focus();
                          }
                        }}
                        fullWidth
                        placeholder="Phone number"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                        Email
                      </Typography>
                      <TextField
                        name="emailUsername"
                        value={formData.emailUsername || ''}
                        onChange={(e) => {
                          const username = e.target.value.trim().replace(/@gmail\.com$/, '');
                          setFormData({
                            ...formData,
                            emailUsername: username,
                            email: username ? `${username}@gmail.com` : ''
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            document.querySelector('input[name="sampleCollectionDate"]')?.focus();
                          } else if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
                            e.preventDefault();
                            document.querySelector('input[name="mobileNumber"]')?.focus();
                          }
                        }}
                        fullWidth
                        size="small"
                        placeholder="Enter Gmail username"
                        InputProps={{
                          endAdornment: <span style={{color: 'rgba(0, 0, 0, 0.4)', fontSize: '0.85rem'}}>@gmail.com</span>,
                        }}
                        helperText={formData.email ? `Email will be: ${formData.email}` : ''}
                      />
                    </Grid>
                  </Grid>

                  {/* Row 3: Date, Doctor, Agent */}
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                        Sample Collection Date
                      </Typography>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          value={formData.sampleCollectionDate}
                          onChange={(date) => setFormData({ ...formData, sampleCollectionDate: date })}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              name="sampleCollectionDate"
                              fullWidth
                              size="small"
                            />
                          )}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                        Referring Doctor
                      </Typography>
                      <Autocomplete
                        options={doctors}
                        getOptionLabel={(option) => option.name}
                        value={formData.refDoctor}
                        isOptionEqualToValue={(option, value) => option && value && option._id === value._id}
                        onChange={(event, newValue) => setFormData({ ...formData, refDoctor: newValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            name="refDoctor"
                            fullWidth
                            size="small"
                            placeholder="Select doctor"
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                        Referring Agent
                      </Typography>
                      <Autocomplete
                        options={agents}
                        getOptionLabel={(option) => option.name}
                        value={formData.refAgent}
                        isOptionEqualToValue={(option, value) => option && value && option._id === value._id}
                        onChange={(event, newValue) => setFormData({ ...formData, refAgent: newValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            name="refAgent"
                            fullWidth
                            size="small"
                            placeholder="Select agent"
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  {/* Financial Details Section */}
                  <Typography variant="overline" sx={{ color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.1em', display: 'block', mb: 2, mt: 4 }}>
                    FINANCIAL DETAILS
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                        Total Amount <span style={{ color: '#EF4444' }}>*</span>
                      </Typography>
                      <TextField
                        name="totalAmount"
                        value={formData.totalAmount}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            document.querySelector('input[name="advancePaid"]')?.focus();
                          }
                        }}
                        fullWidth required type="number" size="small" placeholder="₹ 0.00"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                        Advance Paid
                      </Typography>
                      <TextField
                        name="advancePaid"
                        value={formData.advancePaid}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            document.querySelector('button[type="submit"]')?.focus();
                          }
                        }}
                        fullWidth type="number" size="small" placeholder="₹ 0.00"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', mb: 0.5 }}>
                        Due Amount
                      </Typography>
                      <TextField
                        value={dueAmount}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: dueAmount > 0 ? '#FEF2F2' : '#F0FDF4',
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  {/* Submit Button */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      sx={{
                        bgcolor: '#1E293B',
                        color: '#fff',
                        borderRadius: '50px',
                        minWidth: 280,
                        px: 4,
                        py: 1.8,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        textTransform: 'none',
                        boxShadow: '0 4px 14px 0 rgba(30, 41, 59, 0.39)',
                        '&:hover': { bgcolor: '#0F172A', transform: 'translateY(-2px)' },
                        transition: 'all 0.2s'
                      }}
                    >
                      Save Patient Entry
                    </Button>
                  </Box>
                </Box>

            </Paper>
          </Box>

          {/* ═══════ RIGHT COLUMN: Test Selection ═══════ */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              className="dark-panel animate-slide-right"
              sx={{ width: '100%', overflow: 'hidden', position: 'sticky', top: 100, height: 'calc(100vh - 190px)', display: 'flex', flexDirection: 'column' }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Test Selection
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 3 }}>
                {selectedTestCount === 0
                  ? 'No tests selected yet.'
                  : `${selectedTestCount} test${selectedTestCount > 1 ? 's' : ''} selected`}
              </Typography>

              {!showTestSelection ? (
                <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: '#F1F5F9',
                      borderRadius: '12px',
                      py: 1.2,
                      fontWeight: 600,
                      textTransform: 'none',
                      mb: 3,
                      '&:hover': { borderColor: '#60A5FA', bgcolor: 'rgba(96,165,250,0.1)' }
                    }}
                    onClick={() => setShowTestSelection(true)}
                    type="button"
                  >
                    + Add / Edit Tests
                  </Button>

                  {/* Selected Tests List */}
                  {selectedTestCount === 0 ? (
                    <Box sx={{
                      border: '1px dashed rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      p: 3,
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>
                        Tests will appear here once selected
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {formData.selectedTests
                        .filter(selectedTest => {
                          const hasSelectedDirect = selectedTest.subtests && selectedTest.subtests.some(s => s.selected);
                          const hasSelectedPack = selectedTest.packs && selectedTest.packs.some(pack =>
                            pack.subtests && pack.subtests.some(sub => sub.selected)
                          );
                          return hasSelectedDirect || hasSelectedPack;
                        })
                        .map((selectedTest) => (
                          <Box
                            key={selectedTest.test._id}
                            sx={{
                              mb: 2,
                              backgroundColor: 'rgba(255,255,255,0.06)',
                              borderRadius: '12px',
                              p: 2,
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                              <CheckCircleOutlineIcon sx={{ color: '#4ADE80', fontSize: 22, mr: 1.5 }} />
                              <Typography variant="h6" sx={{ 
                                fontWeight: 800, 
                                background: 'linear-gradient(90deg, #60A5FA, #A78BFA)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}>
                                {selectedTest.test.name}
                              </Typography>
                            </Box>

                            {selectedTest.packs && selectedTest.packs
                              .filter(pack => pack.subtests && pack.subtests.some(sub => sub.selected))
                              .map(pack => (
                                <Box key={pack._id} sx={{ ml: 3, mb: 1 }}>
                                  <Typography variant="caption" sx={{ color: '#60A5FA', fontWeight: 600, display: 'block' }}>
                                    📦 {pack.name}
                                  </Typography>
                                  {pack.subtests.filter(s => s.selected).map(sub => (
                                    <Typography key={sub._id} variant="caption" sx={{ color: '#CBD5E1', display: 'block', ml: 1 }}>
                                      · {sub.name}{sub.unit ? ` (${sub.unit})` : ''}
                                    </Typography>
                                  ))}
                                </Box>
                              ))}

                            {selectedTest.subtests && selectedTest.subtests.filter(s => s.selected).length > 0 && (
                              <Box sx={{ ml: 3 }}>
                                <Typography variant="caption" sx={{ color: '#A78BFA', fontWeight: 600, display: 'block' }}>
                                  🧪 Direct Subtests
                                </Typography>
                                {selectedTest.subtests.filter(s => s.selected).map(sub => (
                                  <Typography key={sub._id} variant="caption" sx={{ color: '#CBD5E1', display: 'block', ml: 1 }}>
                                    · {sub.name}{sub.unit ? ` (${sub.unit})` : ''}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        ))}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, pr: 1, overflowY: 'auto' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, overflowX: 'auto', pb: 2 }}>
                    <Box sx={{ minWidth: 220, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="overline" sx={{ fontWeight: 800, color: '#93C5FD', letterSpacing: '0.05em', mb: 1 }}>1. SELECT A TEST</Typography>
                      <Paper sx={{ flexGrow: 1, maxHeight: 300, overflowY: 'auto', borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9' }}>
                    <List dense>
                      {tests.map((test) => {
                        const selectedTest = formData.selectedTests.find(t => t.test._id === test._id);
                        const isTestSelected = selectedTest && ((selectedTest.subtests && selectedTest.subtests.some(s => s.selected)) || (selectedTest.packs && selectedTest.packs.some(p => p.subtests && p.subtests.some(s => s.selected))));
                        return (
                          <ListItem
                            button
                            key={test._id}
                            selected={activeTestId === test._id}
                            onClick={() => {
                              setActiveTestId(test._id);
                              setActivePackId(null);
                              if (!formData.selectedTests.some(t => t.test._id === test._id)) handleTestSelection(test);
                            }}
                            sx={{ '&.Mui-selected': { bgcolor: 'rgba(96,165,250,0.2)' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                          >
                            <ListItemText primary={<Box sx={{ display: 'flex', alignItems: 'center' }}><span style={{ fontWeight: isTestSelected ? 700 : 400, color: isTestSelected ? '#60A5FA' : '#F1F5F9' }}>{test.name}</span>{isTestSelected && <CheckCircleOutlineIcon fontSize="small" sx={{ ml: 1, color: '#4ADE80' }} />}</Box>} />
                          </ListItem>
                        );
                      })}
                    </List>
                    </Paper>
                  </Box>

                  {activeTestId && (
                    <Box sx={{ minWidth: 260, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="overline" sx={{ fontWeight: 800, color: '#93C5FD', letterSpacing: '0.05em', mb: 1 }}>2. SELECT SUBTESTS / PACKS</Typography>
                      <Paper sx={{ flexGrow: 1, maxHeight: 300, overflowY: 'auto', borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9' }}>
                        <List dense>
                          {(() => {
                            const test = tests.find(t => t._id === activeTestId);
                            const selectedTest = formData.selectedTests.find(t => t.test._id === activeTestId);
                            if (test && Array.isArray(test.subtests) && test.subtests.length > 0) {
                              return [
                                <Box key="direct-subtests-header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, bgcolor: 'rgba(255,255,255,0.02)' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#A78BFA' }}>Direct Subtests</Typography>
                                  <Button size="small" sx={{ color: '#60A5FA' }} onClick={() => {
                                    const allSelected = test.subtests.every(sub => selectedTest.subtests.find(s => s._id === sub._id && s.selected));
                                    test.subtests.forEach(sub => { if (allSelected || !selectedTest.subtests.find(s => s._id === sub._id && s.selected)) handleSubtestSelection(test._id, sub._id); });
                                  }}>{test.subtests.every(sub => selectedTest.subtests.find(s => s._id === sub._id && s.selected)) ? 'Deselect All' : 'Select All'}</Button>
                                </Box>,
                                ...test.subtests.map((sub) => (
                                  <ListItem key={sub._id} sx={{ pl: 3, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                                    <Checkbox sx={{ color: '#94A3B8', '&.Mui-checked': { color: '#60A5FA' } }} checked={!!(selectedTest && selectedTest.subtests && selectedTest.subtests.find(s => s._id === sub._id && s.selected))} onChange={() => handleSubtestSelection(test._id, sub._id)} size="small" />
                                    <ListItemText primary={sub.name + (sub.unit ? ` (${sub.unit})` : '')} sx={{ color: '#CBD5E1' }} />
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
                                <ListItem key="packs-header" sx={{ fontWeight: 600, color: '#60A5FA', bgcolor: 'rgba(255,255,255,0.02)' }}>Packs</ListItem>,
                                ...test.packs.map((pack) => {
                                  const selectedPack = selectedTest && selectedTest.packs && selectedTest.packs.find(p => p._id === pack._id);
                                  return (
                                    <ListItem button key={pack._id} selected={activePackId === pack._id} onClick={() => { setActivePackId(pack._id); if (!(selectedPack && selectedPack.selected)) handlePackSelection(test._id, pack._id); else if (selectedPack && selectedPack.selected && activePackId === pack._id) { handlePackSelection(test._id, pack._id); setActivePackId(null); } }} sx={{ '&.Mui-selected': { bgcolor: 'rgba(96,165,250,0.2)' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                                      <ListItemText primary={<Box sx={{ display: 'flex', alignItems: 'center' }}><span style={{ fontWeight: (selectedPack && selectedPack.subtests && selectedPack.subtests.some(s => s.selected)) ? 700 : 400, color: (selectedPack && selectedPack.subtests && selectedPack.subtests.some(s => s.selected)) ? '#60A5FA' : '#F1F5F9' }}>{pack.name}</span>{(selectedPack && selectedPack.subtests && selectedPack.subtests.some(s => s.selected)) && <CheckCircleOutlineIcon fontSize="small" sx={{ ml: 1, color: '#4ADE80' }} />}</Box>} />
                                    </ListItem>
                                  );
                                })
                              ];
                            }
                            return null;
                          })()}
                        </List>
                      </Paper>
                    </Box>
                  )}

                  {activeTestId && activePackId && (() => {
                    const test = tests.find(t => t._id === activeTestId);
                    const pack = test && test.packs ? test.packs.find(p => p._id === activePackId) : null;
                    const selectedTest = formData.selectedTests.find(t => t.test._id === activeTestId);
                    const selectedPack = selectedTest && selectedTest.packs && selectedTest.packs.find(p => p._id === activePackId);
                    if (pack && selectedPack && selectedPack.selected) {
                      const allSelected = pack.subtests && pack.subtests.length > 0 && pack.subtests.every(sub => selectedPack.subtests.find(s => s._id === sub._id && s.selected));
                      return (
                        <Box sx={{ minWidth: 260, display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="overline" sx={{ fontWeight: 800, color: '#93C5FD', letterSpacing: '0.05em', mb: 1 }}>3. SUBTESTS IN {pack.name.toUpperCase()}</Typography>
                          <Paper sx={{ flexGrow: 1, maxHeight: 300, overflowY: 'auto', borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F1F5F9' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, bgcolor: 'rgba(255,255,255,0.02)' }}>
                              <Typography variant="subtitle2" sx={{ color: '#94A3B8' }}>Select to include</Typography>
                              <Button size="small" sx={{ color: '#60A5FA' }} onClick={() => {
                                if (allSelected) pack.subtests.forEach(sub => handleSubtestSelection(activeTestId, sub._id, activePackId));
                                else pack.subtests.forEach(sub => { if (!selectedPack.subtests.find(s => s._id === sub._id && s.selected)) handleSubtestSelection(activeTestId, sub._id, activePackId); });
                              }}>{allSelected ? 'Deselect All' : 'Select All'}</Button>
                            </Box>
                            <List dense>
                              {(pack.subtests || []).map((sub) => (
                                <ListItem key={sub._id} sx={{ pl: 3, '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                                  <Checkbox sx={{ color: '#94A3B8', '&.Mui-checked': { color: '#60A5FA' } }} checked={!!(selectedPack && selectedPack.subtests && selectedPack.subtests.find(s => s._id === sub._id && s.selected))} onChange={() => handleSubtestSelection(activeTestId, sub._id, activePackId)} size="small" />
                                  <ListItemText primary={sub.name + (sub.unit ? ` (${sub.unit})` : '')} sx={{ color: '#CBD5E1' }} />
                                </ListItem>
                              ))}
                            </List>
                          </Paper>
                        </Box>
                      );
                    }
                    return null;
                  })()}
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ bgcolor: '#2563EB', color: '#fff', borderRadius: '12px', py: 1.2, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#1D4ED8' } }}
                      onClick={() => { setShowTestSelection(false); setActiveTestId(null); setActivePackId(null); }}
                    >
                      Finish Selection
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default PatientEntry;