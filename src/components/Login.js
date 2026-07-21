import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  Alert,
  MenuItem
} from '@mui/material';
import { FavoriteBorder as HeartIcon } from '@mui/icons-material';
import { login, register } from '../api';

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'staff'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  React.useEffect(() => {
    if (localStorage.getItem('sessionExpired')) {
      setSessionExpired(true);
      localStorage.removeItem('sessionExpired');
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const response = await login(formData);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        navigate('/');
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          return;
        }

        await register(formData);
        setSuccess('Account created successfully! Please login.');
        setFormData({ username: '', password: '', confirmPassword: '', role: 'staff' });
        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Very soft background glow */}
      <Box sx={{
        position: 'absolute', top: '10%', right: '15%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 60%)',
      }} />
      <Box sx={{
        position: 'absolute', bottom: '10%', left: '15%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.04) 0%, transparent 60%)',
      }} />

      <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 2 }}>
        <Paper
          className="animate-fade-in"
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            width: '100%',
            borderRadius: '32px',
            background: '#FFFFFF',
            boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.08)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
          }}
        >
          {/* Brand */}
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Box
              sx={{
                width: 56, height: 56, borderRadius: '16px',
                background: 'var(--gradient-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 3,
                boxShadow: '0 8px 16px -4px rgba(6, 182, 212, 0.4)',
              }}
            >
              <HeartIcon sx={{ color: 'white', fontSize: 28 }} />
            </Box>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 1, letterSpacing: '-0.02em' }}>
              MediLab
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
              Sign in to manage your diagnostic center
            </Typography>
          </Box>

          <Tabs
            value={isLogin ? 0 : 1}
            onChange={(e, newValue) => setIsLogin(newValue === 0)}
            centered
            sx={{
              mb: 4,
              '& .MuiTab-root': {
                fontWeight: 700, textTransform: 'none', fontSize: '0.95rem', color: '#94A3B8',
                transition: 'all 0.2s ease',
              },
              '& .Mui-selected': { color: '#00768C !important' },
              '& .MuiTabs-indicator': { height: 3, borderRadius: '3px', background: 'var(--gradient-brand)' },
            }}
          >
            <Tab label="Sign In" />
            <Tab label="Create Account" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
          {sessionExpired && <Alert severity="warning" sx={{ mb: 3 }}>Your session has expired. Please log in again.</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal" required fullWidth
              label="Username" name="username"
              value={formData.username} onChange={handleChange} autoFocus
            />
            <TextField
              margin="normal" required fullWidth
              label="Password" name="password" type="password"
              value={formData.password} onChange={handleChange}
            />
            {!isLogin && (
              <>
                <TextField
                  margin="normal" required fullWidth
                  label="Confirm Password" name="confirmPassword" type="password"
                  value={formData.confirmPassword} onChange={handleChange}
                />
                <TextField
                  margin="normal" required fullWidth select
                  label="Role" name="role"
                  value={formData.role} onChange={handleChange}
                >
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </TextField>
              </>
            )}
            <Button
              type="submit" fullWidth variant="contained"
              sx={{ mt: 4, py: 1.8, fontSize: '1rem', fontWeight: 700, borderRadius: '16px' }}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;