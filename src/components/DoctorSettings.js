import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import * as api from '../api';

const DoctorSettings = () => {
    const [doctors, setDoctors] = useState([]);
    const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [doctorFormData, setDoctorFormData] = useState({
        name: '',
        contact: '',
        email: '',
        specialization: ''
    });

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await api.getDoctors();
                setDoctors(response.data || []);
            } catch (err) {
                console.error('Error fetching doctors:', err);
                setError('Failed to fetch doctors');
            }
        };
        fetchDoctors();
    }, []);

    const handleEditDoctor = async (doctor) => {
        try {
            setSelectedDoctor(doctor);
            setDoctorFormData({
                name: doctor.name,
                contact: doctor.contact || '',
                email: doctor.email || '',
                specialization: doctor.specialization || ''
            });
            setDoctorDialogOpen(true);
        } catch (err) {
            console.error('Error preparing doctor for edit:', err);
            setError('Failed to prepare doctor for editing');
        }
    };

    const handleDeleteDoctor = async (doctorId) => {
        try {
            console.log('Deleting doctor:', doctorId);
            await api.deleteDoctor(doctorId);
            setDoctors(doctors.filter(doctor => doctor._id !== doctorId));
            setSuccess('Doctor deleted successfully');
        } catch (err) {
            console.error('Error deleting doctor:', err);
            setError('Failed to delete doctor');
        }
    };

    const handleDoctorSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log('Submitting doctor data:', doctorFormData);
            
            // Validate required fields
            if (!doctorFormData.name.trim()) {
                setError('Doctor name is required');
                return;
            }

            const doctorData = {
                name: doctorFormData.name.trim(),
                contact: doctorFormData.contact.trim(),
                email: doctorFormData.email.trim(),
                specialization: doctorFormData.specialization.trim()
            };

            console.log('Submitting doctor data:', doctorData);

            if (selectedDoctor) {
                // Update existing doctor
                console.log('Updating doctor:', selectedDoctor._id);
                const updatedDoctor = await api.updateDoctor(selectedDoctor._id, doctorData);
                setDoctors(doctors.map(doctor => doctor._id === selectedDoctor._id ? updatedDoctor.data : doctor));
                setSuccess('Doctor updated successfully');
            } else {
                // Create new doctor
                console.log('Creating new doctor');
                const newDoctor = await api.createDoctor(doctorData);
                setDoctors([...doctors, newDoctor.data]);
                setSuccess('Doctor added successfully');
            }

            // Reset form
            setDoctorFormData({
                name: '',
                contact: '',
                email: '',
                specialization: ''
            });
            setSelectedDoctor(null);
            setDoctorDialogOpen(false);
        } catch (err) {
            console.error('Error saving doctor:', err);
            setError(err.response?.data?.message || 'Failed to save doctor');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                    Doctor Settings
                </Typography>

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

                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            setSelectedDoctor(null);
                            setDoctorFormData({
                                name: '',
                                contact: '',
                                email: '',
                                specialization: ''
                            });
                            setDoctorDialogOpen(true);
                        }}
                        sx={{ borderRadius: '8px', px: 3, fontWeight: 600 }}
                    >
                        Add New Doctor
                    </Button>
                </Box>

                <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <List disablePadding>
                        {doctors.map((doctor, index) => (
                            <ListItem
                                key={doctor._id}
                                divider={index !== doctors.length - 1}
                                sx={{ 
                                    backgroundColor: index % 2 === 0 ? '#FAFAFA' : '#FFFFFF',
                                    '&:hover': { backgroundColor: '#F1F5F9' },
                                    px: 3, py: 2
                                }}
                                secondaryAction={
                                    <Box>
                                        <IconButton
                                            edge="end"
                                            aria-label="edit"
                                            onClick={() => handleEditDoctor(doctor)}
                                            sx={{ mr: 1, color: 'primary.main', backgroundColor: 'rgba(79, 70, 229, 0.08)', '&:hover': { backgroundColor: 'rgba(79, 70, 229, 0.15)' }, borderRadius: '8px' }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            edge="end"
                                            aria-label="delete"
                                            onClick={() => handleDeleteDoctor(doctor._id)}
                                            sx={{ color: 'error.main', backgroundColor: 'rgba(239, 68, 68, 0.08)', '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.15)' }, borderRadius: '8px' }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            {doctor.name}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {doctor.specialization && (
                                                <Typography component="span" variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                                                    {doctor.specialization}
                                                </Typography>
                                            )}
                                            {(doctor.contact || doctor.email) && (
                                                <Typography component="span" variant="body2" color="text.secondary">
                                                    {[doctor.contact, doctor.email].filter(Boolean).join(' • ')}
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                        {doctors.length === 0 && (
                            <ListItem sx={{ py: 4, justifyContent: 'center' }}>
                                <Typography color="text.secondary">No doctors found.</Typography>
                            </ListItem>
                        )}
                    </List>
                </Paper>

                {/* Doctor Dialog */}
                <Dialog
                    open={doctorDialogOpen}
                    onClose={() => {
                        setDoctorDialogOpen(false);
                        setSelectedDoctor(null);
                        setDoctorFormData({
                            name: '',
                            contact: '',
                            email: '',
                            specialization: ''
                        });
                    }}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        {selectedDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                    </DialogTitle>
                    <DialogContent>
                        <Box component="form" onSubmit={handleDoctorSubmit} sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Doctor Name"
                                        value={doctorFormData.name}
                                        onChange={(e) => setDoctorFormData({
                                            ...doctorFormData,
                                            name: e.target.value
                                        })}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Specialization"
                                        value={doctorFormData.specialization}
                                        onChange={(e) => setDoctorFormData({
                                            ...doctorFormData,
                                            specialization: e.target.value
                                        })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Contact Number"
                                        value={doctorFormData.contact}
                                        onChange={(e) => setDoctorFormData({
                                            ...doctorFormData,
                                            contact: e.target.value
                                        })}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        type="email"
                                        value={doctorFormData.email}
                                        onChange={(e) => setDoctorFormData({
                                            ...doctorFormData,
                                            email: e.target.value
                                        })}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            setDoctorDialogOpen(false);
                            setSelectedDoctor(null);
                            setDoctorFormData({
                                name: '',
                                contact: '',
                                email: '',
                                specialization: ''
                            });
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleDoctorSubmit} variant="contained" color="primary">
                            {selectedDoctor ? 'Update' : 'Save'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Paper>
        </Container>
    );
};

export default DoctorSettings; 