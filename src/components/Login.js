/* eslint-disable */
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, TextField, Button, Typography, Box, Alert, MenuItem,
} from '@mui/material';
import {
  FavoriteBorder as HeartIcon,
  ArrowForwardRounded as ArrowIcon,
  LoginOutlined as LoginIcon,
  PersonAddOutlined as RegisterIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { login, register } from '../api';

// ── Framer Motion variants ────────────────────────────────────────────────────
const pageVariants = {
  initial:  { opacity: 0, scale: 0.96, y: 24 },
  animate:  { opacity: 1, scale: 1,    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  exit:     { opacity: 0, scale: 0.96, y: -16,
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
};

const fieldVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
};

const tabIndicatorVariants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: { scaleX: 1, opacity: 1, transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } },
};

// Floating ambient blobs (background)
const blobs = [
  { top: '8%',  left: '-5%', size: 480, color: 'rgba(15,110,86,0.12)',  delay: 0 },
  { top: '60%', right: '-8%', size: 560, color: 'rgba(11,31,58,0.10)',  delay: 1 },
  { top: '35%', left: '40%',  size: 320, color: 'rgba(216,161,59,0.07)', delay: 2 },
];

function Login() {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '', password: '', confirmPassword: '', role: 'staff',
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const switchMode = (toLogin) => {
    setIsLogin(toLogin);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await login(formData);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        navigate('/');
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }
        await register(formData);
        setSuccess('Account created successfully! Please login.');
        setFormData({ username: '', password: '', confirmPassword: '', role: 'staff' });
        setTimeout(() => setIsLogin(true), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--surface-dark)',
      p: 2,
    }}>

      {/* ── Animated ambient background blobs ─────────────────────────── */}
      {blobs.map((blob, i) => (
        <motion.div
          key={i}
          initial={prefersReduced ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: blob.delay * 0.3, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: blob.top,
            left: blob.left,
            right: blob.right,
            width: blob.size,
            height: blob.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* ── Subtle grid overlay ────────────────────────────────────────── */}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* ── Login card ────────────────────────────────────────────────── */}
      <Container component="main" maxWidth="xs" sx={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          variants={pageVariants}
          initial={prefersReduced ? false : 'initial'}
          animate="animate"
          exit="exit"
        >
          <Box sx={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            borderRadius: 'var(--radius-3xl)',
            border: '1px solid rgba(255,255,255,0.14)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14)',
            p: { xs: 4, sm: 5.5 },
            overflow: 'hidden',
            position: 'relative',
          }}>

            {/* Subtle top glow line */}
            <Box sx={{
              position: 'absolute',
              top: 0, left: '20%', right: '20%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(15,110,86,0.8), rgba(216,161,59,0.6), transparent)',
            }} />

            {/* ── Brand logo ──────────────────────────────────────────── */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: -12, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{
                  width: 62, height: 62,
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, #0F6E56 0%, #0B1F3A 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mx: 'auto', mb: 2.5,
                  boxShadow: '0 8px 24px rgba(15,110,86,0.45)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  <HeartIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>

                <Typography component="h1" sx={{
                  fontWeight: 800,
                  fontSize: '1.6rem',
                  color: '#F1F5F9',
                  letterSpacing: '-0.03em',
                  fontFamily: 'Inter, sans-serif',
                  mb: 0.5,
                }}>
                  Sri Sai Durga
                </Typography>
                <Typography sx={{ color: 'rgba(241,245,249,0.5)', fontSize: '0.85rem', fontWeight: 400 }}>
                  Diagnostic Centre Portal
                </Typography>
              </Box>
            </motion.div>

            {/* ── Mode toggle (sliding pill) ───────────────────────────── */}
            <Box sx={{
              display: 'flex',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 'var(--radius-pill)',
              p: '4px',
              mb: 4,
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
            }}>
              {/* Sliding pill indicator */}
              <AnimatePresence initial={false}>
                <motion.div
                  key={isLogin ? 'login' : 'register'}
                  layoutId="tab-pill"
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: isLogin ? 4 : 'calc(50% + 2px)',
                    width: 'calc(50% - 6px)',
                    height: 'calc(100% - 8px)',
                    background: 'linear-gradient(135deg, #0F6E56 0%, #0D4A7A 100%)',
                    borderRadius: 100,
                    boxShadow: '0 4px 12px rgba(15,110,86,0.35)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              </AnimatePresence>

              {[
                { label: 'Sign In',        icon: <LoginIcon sx={{ fontSize: 16 }} />, active: isLogin,  onClick: () => switchMode(true) },
                { label: 'Create Account', icon: <RegisterIcon sx={{ fontSize: 16 }} />, active: !isLogin, onClick: () => switchMode(false) },
              ].map((tab) => (
                <Box
                  key={tab.label}
                  onClick={tab.onClick}
                  sx={{
                    flex: 1,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.75,
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 1,
                    borderRadius: 100,
                    transition: 'color 0.3s ease',
                    color: tab.active ? '#fff' : 'rgba(241,245,249,0.45)',
                  }}
                >
                  {tab.icon}
                  <Typography sx={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    letterSpacing: '0.01em',
                    color: 'inherit',
                  }}>
                    {tab.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* ── Alerts ──────────────────────────────────────────────── */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Alert
                    severity="error"
                    sx={{
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#FCA5A5',
                      '& .MuiAlert-icon': { color: '#EF4444' },
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Alert
                    severity="success"
                    sx={{
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: '#6EE7B7',
                      '& .MuiAlert-icon': { color: '#10B981' },
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    {success}
                  </Alert>
                </motion.div>
              )}
              {sessionExpired && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                >
                  <Alert
                    severity="warning"
                    sx={{
                      background: 'rgba(245,158,11,0.12)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      color: '#FCD34D',
                      '& .MuiAlert-icon': { color: '#F59E0B' },
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    Your session has expired. Please log in again.
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Form ────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                <motion.div key={isLogin ? 'login-form' : 'register-form'}>

                  {/* Username */}
                  <motion.div
                    custom={0} variants={fieldVariants}
                    initial={prefersReduced ? false : 'hidden'} animate="visible"
                  >
                    <TextField
                      margin="normal" required fullWidth
                      label="Username" name="username"
                      value={formData.username}
                      onChange={handleChange}
                      autoFocus
                      autoComplete="username"
                      InputLabelProps={{ sx: { color: 'rgba(241,245,249,0.5)' } }}
                      sx={darkFieldSx}
                    />
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    custom={1} variants={fieldVariants}
                    initial={prefersReduced ? false : 'hidden'} animate="visible"
                  >
                    <TextField
                      margin="normal" required fullWidth
                      label="Password" name="password" type="password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      InputLabelProps={{ sx: { color: 'rgba(241,245,249,0.5)' } }}
                      sx={darkFieldSx}
                    />
                  </motion.div>

                  {/* Register-only fields */}
                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <motion.div
                          custom={2} variants={fieldVariants}
                          initial={prefersReduced ? false : 'hidden'} animate="visible"
                        >
                          <TextField
                            margin="normal" required fullWidth
                            label="Confirm Password" name="confirmPassword" type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            autoComplete="new-password"
                            InputLabelProps={{ sx: { color: 'rgba(241,245,249,0.5)' } }}
                            sx={darkFieldSx}
                          />
                        </motion.div>
                        <motion.div
                          custom={3} variants={fieldVariants}
                          initial={prefersReduced ? false : 'hidden'} animate="visible"
                        >
                          <TextField
                            margin="normal" required fullWidth select
                            label="Role" name="role"
                            value={formData.role}
                            onChange={handleChange}
                            InputLabelProps={{ sx: { color: 'rgba(241,245,249,0.5)' } }}
                            sx={darkFieldSx}
                          >
                            <MenuItem value="staff">Staff</MenuItem>
                            <MenuItem value="doctor">Doctor</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                          </TextField>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit button */}
                  <motion.div
                    custom={4} variants={fieldVariants}
                    initial={prefersReduced ? false : 'hidden'} animate="visible"
                  >
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        className="btn-sheen"
                        sx={{
                          mt: 3, py: 1.7,
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          borderRadius: 'var(--radius-pill)',
                          background: loading
                            ? 'rgba(15,110,86,0.5)'
                            : 'linear-gradient(135deg, #0F6E56 0%, #0B1F3A 100%)',
                          boxShadow: loading ? 'none' : '0 8px 28px rgba(15,110,86,0.40)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          letterSpacing: '0.02em',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0F6E56 0%, #0D4A7A 100%)',
                            boxShadow: '0 12px 36px rgba(15,110,86,0.52)',
                          },
                          '&:disabled': { color: 'rgba(255,255,255,0.4)' },
                        }}
                      >
                        {loading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                              style={{
                                width: 16, height: 16,
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff',
                                borderRadius: '50%',
                              }}
                            />
                            {isLogin ? 'Signing in...' : 'Creating account...'}
                          </Box>
                        ) : (
                          <>
                            {isLogin ? 'Sign In' : 'Create Account'}
                            <ArrowIcon sx={{ fontSize: 18 }} />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </form>

            {/* Bottom branding */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(241,245,249,0.25)', letterSpacing: '0.04em' }}>
                SECURE PORTAL · SRI SAI DURGA DIAGNOSTIC CENTRE
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}

// Dark glass text field styles (reusable)
const darkFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    color: '#F1F5F9',
    transition: 'all 0.25s ease',
    '& fieldset': {
      borderColor: 'rgba(255,255,255,0.12)',
      borderWidth: '1.5px',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(15,110,86,0.6)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#0F6E56',
      borderWidth: '2px',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(0,0,0,0.35)',
      boxShadow: '0 0 0 3px rgba(15,110,86,0.15)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(241,245,249,0.45)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#5EEAD4',
  },
  '& .MuiSelect-icon': {
    color: 'rgba(241,245,249,0.5)',
  },
  '& .MuiMenuItem-root': {
    color: '#1E293B',
  },
};

export default Login;