import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PatientEntry from './components/PatientEntry';
import CreateReport from './components/CreateReport';
import TestSettings from './components/TestSettings';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import History from './components/History';
import Analysis from './components/Analysis';
import ShareReport from './components/ShareReport';
import PublicReportView from './components/PublicReportView';
import Equipment from './components/Equipment';
import Commission from './components/Commission';
import AccountsBalance from './components/AccountsBalance';
import { PinProvider } from './contexts/PinContext';
import { GoogleDriveProvider } from './contexts/GoogleDriveContext';
import withPinProtection from './components/withPinProtection';

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: 'transparent', // Let mesh background show through
      paper: 'rgba(255, 255, 255, 0.85)',
    },
    primary: { main: '#0284C7', dark: '#0369A1', light: '#E0F2FE' },
    secondary: { main: '#8B5CF6', dark: '#6D28D9', light: '#EDE9FE' },
    text: { primary: '#0F172A', secondary: '#64748B' },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    h3: { fontWeight: 800, letterSpacing: '-0.04em' },
    h4: { fontWeight: 800, letterSpacing: '-0.03em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 32 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 50, // Pill shaped buttons
          padding: '12px 28px',
          boxShadow: 'none',
          fontSize: '0.95rem',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 24px -8px rgba(2, 132, 199, 0.25)',
          }
        },
        contained: {
          background: 'linear-gradient(135deg, #0284C7 0%, #0284C7 100%)',
          color: '#fff',
        },
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(24px)',
          borderRadius: 32,
          border: '1px solid rgba(15, 23, 42, 0.06)',
          boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.05)',
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.7)',
            transition: 'all 0.3s ease',
            '& fieldset': { borderColor: 'rgba(15, 23, 42, 0.1)', borderWidth: '1px' },
            '&:hover fieldset': { borderColor: 'rgba(15, 23, 42, 0.2)' },
            '&.Mui-focused fieldset': { borderColor: '#0284C7', borderWidth: '2px' },
            '&.Mui-focused': {
              backgroundColor: '#FFFFFF',
              boxShadow: '0 8px 16px -4px rgba(2, 132, 199, 0.1)',
            }
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 40,
          boxShadow: '0 32px 64px -12px rgba(15, 23, 42, 0.15)',
        }
      }
    }
  }
});

const ProtectedEquipment = withPinProtection(Equipment);
const ProtectedCommission = withPinProtection(Commission);
const ProtectedAccountsBalance = withPinProtection(AccountsBalance);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PinProvider>
        <GoogleDriveProvider>
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/view-report/:reportId" element={<PublicReportView />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="patient-entry" element={<PatientEntry />} />
              <Route path="create-report" element={<CreateReport />} />
              <Route path="share-report" element={<ShareReport />} />
              <Route path="test-settings" element={<TestSettings />} />
              <Route path="history" element={<History />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="equipment" element={<ProtectedEquipment />} />
              <Route path="commission" element={<ProtectedCommission />} />
              <Route path="accounts-balance" element={<ProtectedAccountsBalance />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </GoogleDriveProvider>
      </PinProvider>
    </ThemeProvider>
  );
}

export default App;
