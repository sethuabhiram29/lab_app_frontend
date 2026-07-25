import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Lenis from 'lenis';
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
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    primary: { main: '#0B1F3A', dark: '#071628', light: '#1a3a5c' },
    secondary: { main: '#0F6E56', dark: '#0a4f3d', light: '#e6f4f1' },
    success: { main: '#10B981' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    text: { primary: '#1E293B', secondary: '#475569' },
  },
  typography: {
    fontFamily: '"Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    h2: { fontWeight: 900, letterSpacing: '-0.04em' },
    h3: { fontWeight: 800, letterSpacing: '-0.03em' },
    h4: { fontWeight: 800, letterSpacing: '-0.025em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    body1: { lineHeight: 1.65 },
    button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 12 },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1280,
      xl: 1536,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 100,
          padding: '11px 28px',
          boxShadow: 'none',
          fontSize: '0.93rem',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          background: 'linear-gradient(135deg, #0B1F3A 0%, #0F6E56 100%)',
          color: '#fff',
          '&:hover': {
            background: 'linear-gradient(135deg, #0D4A7A 0%, #0F6E56 100%)',
          }
        },
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid rgba(30, 41, 59, 0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            transition: 'all 0.25s ease',
            '& fieldset': { borderColor: 'rgba(30, 41, 59, 0.15)', borderWidth: '1.5px' },
            '&:hover fieldset': { borderColor: 'rgba(15, 110, 86, 0.4)' },
            '&.Mui-focused fieldset': { borderColor: '#0F6E56', borderWidth: '2px' },
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(15, 110, 86, 0.12)',
            }
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 32px 64px -12px rgba(11, 31, 58, 0.2)',
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.78rem' }
      }
    }
  }
});

// Global Lenis smooth scroll initializer
function LenisProvider({ children }) {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
      syncTouch: false,
    });

    let animFrameId;
    function raf(time) {
      lenis.raf(time);
      animFrameId = requestAnimationFrame(raf);
    }
    animFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animFrameId);
      lenis.destroy();
    };
  }, []);

  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

const ProtectedEquipment = withPinProtection(Equipment);
const ProtectedCommission = withPinProtection(Commission);
const ProtectedAccountsBalance = withPinProtection(AccountsBalance);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LenisProvider>
        <PinProvider>
          <GoogleDriveProvider>
            <BrowserRouter>
              <ScrollToTop />
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
      </LenisProvider>
    </ThemeProvider>
  );
}

export default App;
