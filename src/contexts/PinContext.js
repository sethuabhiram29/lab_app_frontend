import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

const PinContext = createContext();

export const PinProvider = ({ children }) => {
    const [verifiedSections, setVerifiedSections] = useState({});
    const [isChangingPin, setIsChangingPin] = useState(false);

    // Reset verification for a specific section
    const resetSectionVerification = useCallback((section) => {
        if (!section) return;
        console.log('Locking section:', section);
        setVerifiedSections(prev => {
            const newState = { ...prev };
            delete newState[section];
            return newState;
        });
    }, []);

    const verifyPin = useCallback(async (pin, section) => {
        if (!section) {
            console.error('No section provided for PIN verification');
            return false;
        }

        try {
            const token = localStorage.getItem('token');
            api.defaults.headers.common['x-auth-token'] = token;
            
            const formattedPin = String(pin).padStart(4, '0');
            const response = await api.post('/pin-settings/validate', { pin: formattedPin });
            
            if (response.data.success) {
                setVerifiedSections(prev => ({
                    ...prev,  // Keep other sections' verification state
                    [section]: true
                }));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error verifying PIN:', err.response?.data.message || err.message);
            return false;
        }
    }, []);

    const changePin = async (currentPin, newPin) => {
        try {
            console.log('Attempting to change PIN. Current:', currentPin, 'New:', newPin);
            const res = await fetch(`${API_BASE_URL}/pin-settings/change-pin`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('token')
                },
                body: JSON.stringify({ currentPin, newPin })
            });

            const data = await res.json();
            console.log('PIN change response:', data);

            if (res.ok) {
                console.log('PIN changed successfully');
                return true;
            }
            console.log('PIN change failed:', data.message);
            return false;
        } catch (err) {
            console.error('Error changing PIN:', err);
            return false;
        }
    };

    return (
        <PinContext.Provider value={{
            verifiedSections,
            setVerifiedSections,
            isChangingPin,
            setIsChangingPin,
            verifyPin,
            changePin,
            resetSectionVerification
        }}>
            {children}
        </PinContext.Provider>
    );
};

export const usePin = () => useContext(PinContext);
