import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import * as api from '../api';

const Commission = () => {
  // State for selected date
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // State for patients data
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [commissionAmount, setCommissionAmount] = useState('');

  // Fetch patients data
  const fetchPatients = async (date) => {
    try {
      setLoading(true);
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const response = await api.getCommissions({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      setPatients(response.data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch patients data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and date change
  useEffect(() => {
    fetchPatients(selectedDate);
  }, [selectedDate]);

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
  };

  // Open commission dialog
  const handleCommissionClick = (patient) => {
    setSelectedPatient(patient);
    setCommissionAmount(patient.commission?.toString() || '');
    setDialogOpen(true);
  };

  // Handle commission update
  const handleUpdateCommission = async () => {
    try {
      const amount = Number(commissionAmount);
      if (isNaN(amount) || amount < 0) {
        setError('Please enter a valid commission amount');
        return;
      }

      await api.updateCommission(selectedPatient._id, amount);
      
      // Update local state
      setPatients(prev => prev.map(p => 
        p._id === selectedPatient._id 
          ? { ...p, commission: amount }
          : p
      ));

      setSuccess('Commission updated successfully');
      setDialogOpen(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update commission');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography color="text.secondary">Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 1, mb: 4 }} className="animate-fade-in">
      <Paper className="medical-card" elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" sx={{
          fontWeight: 800, mb: 3,
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Commission Management
        </Typography>

        {/* Date Selector */}
        <Box sx={{ mb: 3 }}>
          <TextField
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            label="Select Date"
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>
            {success}
          </Alert>
        )}

        {/* Patients Table */}
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Patient Name</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Doctor</TableCell>
                <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Age</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Gender</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Commission</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.map((patient, idx) => (
                <TableRow key={patient._id} sx={{ backgroundColor: idx % 2 === 0 ? '#FAFAFA' : '#FFFFFF', '&:hover': { backgroundColor: '#F1F5F9' } }}>
                  <TableCell sx={{ fontWeight: 500 }}>{patient.name}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{patient.refDoctor?.name || 'N/A'}</TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{patient.age}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{patient.gender}</TableCell>
                  <TableCell align="right">₹{patient.totalAmount?.toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: patient.commission > 0 ? 'success.main' : 'text.secondary' }}>
                    {patient.commission > 0 
                      ? `₹${patient.commission.toLocaleString()}`
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => handleCommissionClick(patient)}
                      color="primary"
                      title={patient.commission > 0 ? "Edit Commission" : "Add Commission"}
                      size="small"
                      sx={{ 
                        borderRadius: '8px',
                        backgroundColor: 'rgba(79, 70, 229, 0.08)',
                        '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.15)' }
                      }}
                    >
                      {patient.commission > 0 ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {patients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">No patients found for this date</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Commission Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} PaperProps={{ sx: { borderRadius: '16px', minWidth: { sm: 400 } } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {selectedPatient?.commission > 0 ? 'Edit Commission' : 'Add Commission'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Commission Amount"
            type="number"
            fullWidth
            value={commissionAmount}
            onChange={(e) => setCommissionAmount(e.target.value)}
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button onClick={handleUpdateCommission} variant="contained" sx={{ borderRadius: '8px' }}>
            {selectedPatient?.commission > 0 ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Commission;
