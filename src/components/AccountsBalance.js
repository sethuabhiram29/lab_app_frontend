import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Card,
  CardContent,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  LocalHospital as DoctorIcon,
  Business as AgentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getPatients, updatePatient } from '../api';

function AccountsBalance() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clearDueDialog, setClearDueDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await getPatients();
      const allPatients = Array.isArray(response) ? response : (response.data || []);
      
      console.log('All patients fetched:', allPatients.length);
      
      // Filter patients by selected date and having due amounts
      const filteredPatients = allPatients.filter(patient => {
        if (!patient.sampleCollectionDate || patient.dueAmount <= 0) {
          return false;
        }
        
        const patientDate = new Date(patient.sampleCollectionDate);
        const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const patientDateOnly = new Date(patientDate.getFullYear(), patientDate.getMonth(), patientDate.getDate());
        
        const isSameDate = patientDateOnly.getTime() === selectedDateOnly.getTime();
        const hasDueAmount = patient.dueAmount > 0;
        
        console.log('Patient:', patient.name, 'Date:', patientDateOnly, 'Selected:', selectedDateOnly, 'Same:', isSameDate, 'Due:', hasDueAmount);
        
        return isSameDate && hasDueAmount;
      });
      
      console.log('Filtered patients:', filteredPatients.length);
      setPatients(filteredPatients);
      setError('');
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Failed to fetch patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleClearDue = (patient) => {
    setSelectedPatient(patient);
    setPaymentAmount(patient.dueAmount.toString());
    setClearDueDialog(true);
  };

  const confirmClearDue = async () => {
    if (!selectedPatient || !paymentAmount) return;

    try {
      const newAdvancePaid = selectedPatient.advancePaid + Number(paymentAmount);
      const newDueAmount = selectedPatient.totalAmount - newAdvancePaid;

      await updatePatient(selectedPatient._id, {
        advancePaid: newAdvancePaid,
        dueAmount: newDueAmount
      });

      const paymentMessage = newDueAmount === 0 
        ? 'Payment completed! Due amount fully cleared.' 
        : `Payment processed successfully. Remaining due: ₹${newDueAmount}`;

      setSuccess(paymentMessage);
      setClearDueDialog(false);
      setSelectedPatient(null);
      setPaymentAmount('');
      fetchPatients(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process payment');
    }
  };

  const getSummaryData = () => {
    const agentSummary = {};
    const doctorSummary = {};

    patients.forEach(patient => {
      // Agent summary
      if (patient.refAgent) {
        const agentId = typeof patient.refAgent === 'object' ? patient.refAgent._id : patient.refAgent;
        const agentName = typeof patient.refAgent === 'object' ? patient.refAgent.name : 'Unknown Agent';
        
        if (!agentSummary[agentId]) {
          agentSummary[agentId] = {
            name: agentName,
            totalDue: 0,
            patientCount: 0
          };
        }
        agentSummary[agentId].totalDue += patient.dueAmount;
        agentSummary[agentId].patientCount += 1;
      }

      // Doctor summary
      if (patient.refDoctor) {
        const doctorId = typeof patient.refDoctor === 'object' ? patient.refDoctor._id : patient.refDoctor;
        const doctorName = typeof patient.refDoctor === 'object' ? patient.refDoctor.name : 'Unknown Doctor';
        
        if (!doctorSummary[doctorId]) {
          doctorSummary[doctorId] = {
            name: doctorName,
            totalDue: 0,
            patientCount: 0
          };
        }
        doctorSummary[doctorId].totalDue += patient.dueAmount;
        doctorSummary[doctorId].patientCount += 1;
      }
    });

    console.log('Summary data:', { agentSummary, doctorSummary });
    return { agentSummary, doctorSummary };
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const { agentSummary, doctorSummary } = getSummaryData();

  return (
    <Container maxWidth="xl" sx={{ mt: 1, mb: 4 }} className="animate-fade-in">
      <Paper className="medical-card" elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{
            fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            <AccountBalanceIcon sx={{ mr: 2, color: 'primary.main', fontSize: 32 }} />
            Accounts & Balance
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Date Selector */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <CalendarIcon color="primary" sx={{ fontSize: 28 }} />
            </Grid>
            <Grid item>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box display="flex" alignItems="center" gap={2}>
                  <DatePicker
                    label="Select Date"
                    value={selectedDate}
                    onChange={(newDate) => setSelectedDate(newDate)}
                    format="dd-MM-yyyy"
                    slotProps={{
                      textField: {
                        size: 'small',
                        inputProps: {
                          placeholder: "DD-MM-YYYY"
                        }
                      }
                    }}
                  />
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => setSelectedDate(new Date())}
                    sx={{ height: 40, borderRadius: '8px' }}
                  >
                    Today
                  </Button>
                </Box>
              </LocalizationProvider>
            </Grid>
            <Grid item>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                {formatDate(selectedDate)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {loading ? (
          <LinearProgress sx={{ borderRadius: '4px', mb: 2 }} />
        ) : (
          <>
            {/* Pending Payments Table */}
            <Box sx={{ mb: 5 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 2 }}>
                <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                Pending Payments ({patients.length})
              </Typography>
              
              {patients.length > 0 ? (
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Reg No</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Patient Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>Mobile</TableCell>
                        <TableCell sx={{ fontWeight: 600, display: { xs: 'none', lg: 'table-cell' } }}>Agent</TableCell>
                        <TableCell sx={{ fontWeight: 600, display: { xs: 'none', lg: 'table-cell' } }}>Doctor</TableCell>
                        <TableCell sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>Total</TableCell>
                        <TableCell sx={{ fontWeight: 600, display: { xs: 'none', sm: 'table-cell' } }}>Paid</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Due</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patients.map((patient, idx) => (
                        <TableRow key={patient._id} sx={{ backgroundColor: idx % 2 === 0 ? '#FAFAFA' : '#FFFFFF', '&:hover': { backgroundColor: '#F1F5F9' } }}>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{patient.regNo}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{patient.name}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{patient.mobileNumber}</TableCell>
                                                     <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                             {patient.refAgent ? (
                               <Chip 
                                 icon={<AgentIcon fontSize="small" />} 
                                 label={typeof patient.refAgent === 'object' ? patient.refAgent.name : 'Unknown'} 
                                 size="small" 
                                 variant="outlined"
                                 sx={{ borderRadius: '6px' }}
                               />
                             ) : (
                               <Typography variant="body2" color="text.secondary">-</Typography>
                             )}
                           </TableCell>
                           <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                             {patient.refDoctor ? (
                               <Chip 
                                 icon={<DoctorIcon fontSize="small" />} 
                                 label={typeof patient.refDoctor === 'object' ? patient.refDoctor.name : 'Unknown'} 
                                 size="small" 
                                 variant="outlined"
                                 sx={{ borderRadius: '6px' }}
                               />
                             ) : (
                               <Typography variant="body2" color="text.secondary">-</Typography>
                             )}
                           </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>₹{patient.totalAmount}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>₹{patient.advancePaid}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`₹${patient.dueAmount}`} 
                              color="error" 
                              size="small"
                              sx={{ fontWeight: 600, borderRadius: '6px' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleClearDue(patient)}
                              color="success"
                              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                            >
                              Clear
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                             ) : (
                 <Alert severity="info" sx={{ borderRadius: '10px' }}>
                   No pending payments found for {formatDate(selectedDate)}. 
                   {patients.length === 0 && (
                     <Box sx={{ mt: 1 }}>
                       <Typography variant="body2">
                         • Try selecting a different date
                       </Typography>
                       <Typography variant="body2">
                         • Make sure patients have due amounts greater than ₹0
                       </Typography>
                     </Box>
                   )}
                 </Alert>
               )}
            </Box>

            {/* Summary Tables */}
            {(Object.keys(agentSummary).length > 0 || Object.keys(doctorSummary).length > 0) && (
              <Grid container spacing={3}>
                {/* Agent Summary */}
                {Object.keys(agentSummary).length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '16px' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                          <AgentIcon sx={{ mr: 1, color: 'primary.main' }} />
                          Agent Summary
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Agent Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Patients</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Total Due</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.values(agentSummary).map((agent, index) => (
                                <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#F1F5F9' } }}>
                                  <TableCell>{agent.name}</TableCell>
                                  <TableCell>{agent.patientCount}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={`₹${agent.totalDue}`} 
                                      color="error" 
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontWeight: 600, borderRadius: '6px' }}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Doctor Summary */}
                {Object.keys(doctorSummary).length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '16px' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                          <DoctorIcon sx={{ mr: 1, color: 'primary.main' }} />
                          Doctor Summary
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Doctor Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Patients</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Total Due</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {Object.values(doctorSummary).map((doctor, index) => (
                                <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#F1F5F9' } }}>
                                  <TableCell>{doctor.name}</TableCell>
                                  <TableCell>{doctor.patientCount}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={`₹${doctor.totalDue}`} 
                                      color="error" 
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontWeight: 600, borderRadius: '6px' }}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
                         )}

             {/* Overall Summary */}
             {patients.length > 0 && (
               <Box sx={{ mt: 4 }}>
                 <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '16px', background: 'linear-gradient(to right, #ffffff, #f8fafc)' }}>
                   <CardContent sx={{ p: 4 }}>
                     <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, mb: 3 }}>
                       <AccountBalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
                       Overall Summary for {formatDate(selectedDate)}
                     </Typography>
                     <Grid container spacing={3}>
                       <Grid item xs={12} sm={4}>
                         <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
                           <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                             {patients.length}
                           </Typography>
                           <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                             Total Patients with Due
                           </Typography>
                         </Box>
                       </Grid>
                       <Grid item xs={12} sm={4}>
                         <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                           <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                             ₹{patients.reduce((sum, patient) => sum + patient.dueAmount, 0)}
                           </Typography>
                           <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                             Total Due Amount
                           </Typography>
                         </Box>
                       </Grid>
                       <Grid item xs={12} sm={4}>
                         <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                           <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                             ₹{patients.reduce((sum, patient) => sum + patient.advancePaid, 0)}
                           </Typography>
                           <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5 }}>
                             Total Advance Paid
                           </Typography>
                         </Box>
                       </Grid>
                     </Grid>
                   </CardContent>
                 </Card>
               </Box>
             )}
           </>
         )}

        {/* Clear Due Dialog */}
        <Dialog open={clearDueDialog} onClose={() => setClearDueDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
          <DialogTitle sx={{ fontWeight: 600 }}>Clear Due Payment</DialogTitle>
          <DialogContent>
            {selectedPatient && (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Patient</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedPatient.name} <span style={{ color: '#64748b', fontSize: '0.85em' }}>(#{selectedPatient.regNo})</span></Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                  <Typography variant="body1">₹{selectedPatient.totalAmount}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Advance Paid</Typography>
                  <Typography variant="body1">₹{selectedPatient.advancePaid}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Current Due</Typography>
                  <Typography variant="body1" color="error.main" fontWeight={600}>₹{selectedPatient.dueAmount}</Typography>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <TextField
                  label="Payment Amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>,
                  }}
                  inputProps={{ 
                    min: 0, 
                    max: selectedPatient.dueAmount,
                    step: 0.01
                  }}
                  helperText={`Maximum due amount: ₹${selectedPatient.dueAmount}`}
                />
                
                {paymentAmount && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                      Payment Summary
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Current Advance</Typography>
                      <Typography variant="body2">₹{selectedPatient.advancePaid}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">New Payment</Typography>
                      <Typography variant="body2" color="success.main">+₹{Number(paymentAmount)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight="bold">Total Paid</Typography>
                      <Typography variant="body2" fontWeight="bold">₹{selectedPatient.advancePaid + Number(paymentAmount)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight="bold">Remaining Due</Typography>
                      <Typography variant="body2" fontWeight="bold" color={selectedPatient.totalAmount - (selectedPatient.advancePaid + Number(paymentAmount)) === 0 ? 'success.main' : 'error.main'}>
                        ₹{Math.max(0, selectedPatient.totalAmount - (selectedPatient.advancePaid + Number(paymentAmount)))}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
            <Button onClick={() => setClearDueDialog(false)} sx={{ borderRadius: '8px' }}>Cancel</Button>
            <Button 
              onClick={confirmClearDue} 
              variant="contained" 
              color="primary"
              disabled={!paymentAmount || Number(paymentAmount) <= 0}
              sx={{ borderRadius: '8px', px: 3 }}
            >
              Confirm Payment
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}

export default AccountsBalance; 