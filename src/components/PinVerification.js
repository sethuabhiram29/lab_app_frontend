import React, { useState, useEffect } from 'react';
import { usePin } from '../contexts/PinContext';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Alert
} from '@mui/material';

const PinVerification = ({ open, onClose, section }) => {
    const { verifyPin, changePin, isChangingPin, setIsChangingPin } = usePin();
    const [pin, setPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [error, setError] = useState('');
    const sectionNames = {
        'equipment': 'Equipment & Kits',
        'commission': 'Commission',
        'accounts-balance': 'Accounts & Balance'
    };
    
    // Reset pin and error when dialog opens
    useEffect(() => {
        if (open) {
            setPin('');
            setError('');
        }
    }, [open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate PIN format and ensure it's exactly 4 digits
        const validatePin = (pin) => /^\d{4}$/.test(pin);
        const formatPin = (pin) => pin.padStart(4, '0');

        if (isChangingPin) {
            if (!newPin) {
                setError('New PIN is required');
                return;
            }
            if (!validatePin(newPin)) {
                setError('New PIN must be exactly 4 digits');
                return;
            }
            if (!validatePin(pin)) {
                setError('Current PIN must be exactly 4 digits');
                return;
            }

            // Format PINs to ensure they're exactly 4 digits
            const formattedCurrentPin = formatPin(pin);
            const formattedNewPin = formatPin(newPin);
            
            const success = await changePin(formattedCurrentPin, formattedNewPin);
            if (success) {
                setIsChangingPin(false);
                onClose();
            } else {
                setError('Failed to change PIN. Please check your current PIN.');
            }
            return;
        }

        // Regular PIN verification
        try {
            const formattedPin = formatPin(pin);
            if (!validatePin(formattedPin)) {
                setError('PIN must be exactly 4 digits');
                return;
            }

            const success = await verifyPin(formattedPin, section);
            if (success) {
                setPin('');
                onClose();
            } else {
                setError('Invalid PIN');
            }
        } catch (err) {
            setError('Error verifying PIN');
            console.error('PIN verification error:', err);
        }

        if (isChangingPin) {
            if (!newPin) {
                setError('New PIN is required');
                return;
            }
            if (!validatePin(newPin)) {
                setError('New PIN must be exactly 4 digits');
                return;
            }
            if (!validatePin(pin)) {
                setError('Current PIN must be exactly 4 digits');
                return;
            }

            // Format PINs to ensure they're exactly 4 digits
            const formattedCurrentPin = formatPin(pin);
            const formattedNewPin = formatPin(newPin);
            
            const success = await changePin(formattedCurrentPin, formattedNewPin);
            if (success) {
                setIsChangingPin(false);
                onClose();
            } else {
                setError('Failed to change PIN. Please check your current PIN.');
            }
        } else {
            if (!validatePin(pin)) {
                setError('PIN must be exactly 4 digits');
                return;
            }

            // Format PIN to ensure it's exactly 4 digits
            const formattedPin = formatPin(pin);
            console.log('Verifying PIN:', formattedPin); // Debug log
            
            const success = await verifyPin(formattedPin);
            if (success) {
                onClose();
            } else {
                setError('Invalid PIN. Default PIN is 0000');
            }
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="xs"
            fullWidth={false}
            disableEnforceFocus
            hideBackdrop
            sx={{
                '& .MuiDialog-paper': {
                    width: '320px',
                    position: 'fixed',
                    top: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    margin: 0,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    pointerEvents: 'auto'
                },
                pointerEvents: 'none'
            }}
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ pb: 1 }}>
                    {isChangingPin ? 'Change PIN' : `Enter PIN for ${sectionNames[section] || section}`}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ width: '100%' }}>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        
                        <TextField
                            label={isChangingPin ? "Current PIN" : "Enter 4-digit PIN"}
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            fullWidth
                            required
                            autoFocus
                            inputProps={{ maxLength: 4 }}
                            sx={{ mb: 2 }}
                        />

                        {isChangingPin && (
                            <TextField
                                label="New PIN"
                                type="password"
                                value={newPin}
                                onChange={(e) => setNewPin(e.target.value)}
                                fullWidth
                                required
                                inputProps={{ maxLength: 4 }}
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    {!isChangingPin && (
                        <Button 
                            type="button"
                            onClick={() => setIsChangingPin(true)}
                        >
                            Change PIN
                        </Button>
                    )}
                    <Button type="submit" variant="contained">
                        {isChangingPin ? 'Change PIN' : 'Submit'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default PinVerification;
