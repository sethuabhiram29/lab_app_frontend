import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, Alert, Grid, IconButton, InputAdornment, CircularProgress
} from '@mui/material';
import {
  Visibility, VisibilityOff,
  SecurityOutlined as SecurityIcon,
  TimelineOutlined as TimelineIcon,
  BiotechOutlined as BiotechIcon,
  WaterDrop as WaterDropIcon,
  ArrowForward as ArrowIcon,
  ScienceOutlined as ScienceIcon
} from '@mui/icons-material';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { login, register } from '../api';

// ── Framer Motion Variants ───────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  })
};

const slideLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  })
};

const slideRight = {
  hidden: { opacity: 0, x: 40 },
  visible: (i = 0) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  })
};

// ── SVG Heartbeat Animation ──────────────────────────────────────────────────
const HeartbeatSVG = () => (
  <Box sx={{ my: 5, overflow: 'hidden', width: '100%', maxWidth: '400px' }}>
    <svg viewBox="0 0 400 60" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 'auto' }}>
      <motion.path
        d="M 0 30 L 100 30 L 120 30 L 130 10 L 145 50 L 160 20 L 170 30 L 250 30 L 260 15 L 275 45 L 290 30 L 400 30"
        fill="none"
        stroke="#D31C3D"
        strokeWidth="1.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
      />
    </svg>
  </Box>
);

function Login() {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '', password: '', confirmPassword: '', role: 'staff',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
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
    // Reset passwords when switching
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
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
      backgroundColor: '#FDFBF7', // Warm cream background
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* ── 1. LOGIN / HERO SECTION ────────────────────────────────────────────── */}
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
      }}>
      {/* Background Ambient Glows */}
      <Box sx={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%',
        background: 'radial-gradient(circle at 60% 50%, rgba(211,28,61,0.08) 0%, transparent 70%)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      <Grid container sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* ── LEFT PANEL (Branding) ──────────────────────────────────────────────── */}
        <Grid item xs={12} md={6} sx={{ 
          display: 'flex', flexDirection: 'column', justifyContent: 'center', 
          p: { xs: 4, md: 8, lg: 12 } 
        }}>
          <motion.div variants={prefersReduced ? false : slideLeft} initial="hidden" animate="visible" custom={0}>
            {/* Pill Badge */}
            <Box sx={{ 
              display: 'inline-flex', alignItems: 'center', gap: 1, 
              px: 2, py: 0.5, borderRadius: '100px', 
              border: '1px solid rgba(211,28,61,0.3)',
              mb: 4
            }}>
              <ScienceIcon sx={{ color: '#D31C3D', fontSize: '1rem' }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#D31C3D', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Precision Blood Diagnostics
              </Typography>
            </Box>

            {/* Typography */}
            <Typography sx={{ 
              fontFamily: '"Playfair Display", "Times New Roman", serif', 
              fontSize: { xs: '3rem', md: '4.5rem' }, 
              fontWeight: 700, lineHeight: 1.1, color: '#D31C3D', mb: 1 
            }}>
              Sri Sai Durga
            </Typography>
            <Typography sx={{ 
              fontFamily: '"Playfair Display", "Times New Roman", serif', 
              fontSize: { xs: '2.5rem', md: '3.5rem' }, 
              fontWeight: 400, fontStyle: 'italic', lineHeight: 1.1, color: '#4A3B39', mb: 4 
            }}>
              Diagnostic Centre
            </Typography>

            <Typography sx={{ 
              fontSize: '1.05rem', color: '#6B5E5B', lineHeight: 1.7, maxWidth: '450px',
              fontFamily: '"Plus Jakarta Sans", sans-serif'
            }}>
              A next-generation portal engineered around the science of blood. Live analytics, secure reports, and clinical precision — rendered in real time.
            </Typography>

            {/* Heartbeat Graphic */}
            <HeartbeatSVG />

            {/* Features Row */}
            <Box sx={{ display: 'flex', gap: { xs: 2, sm: 4 }, flexWrap: 'wrap' }}>
              {[
                { icon: <SecurityIcon sx={{ fontSize: '1.2rem', color: '#D31C3D' }}/>, text: 'NABL Secured' },
                { icon: <TimelineIcon sx={{ fontSize: '1.2rem', color: '#D31C3D' }}/>, text: 'Real-time Reports' },
                { icon: <BiotechIcon sx={{ fontSize: '1.2rem', color: '#D31C3D' }}/>, text: 'Clinical Precision' }
              ].map((feature, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {feature.icon}
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#6B5E5B' }}>
                    {feature.text}
                  </Typography>
                </Box>
              ))}
            </Box>

          </motion.div>
        </Grid>

        {/* ── RIGHT PANEL (Login Card) ────────────────────────────────────────────── */}
        <Grid item xs={12} md={6} sx={{ 
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          p: { xs: 2, md: 4 }, pr: { md: 8 } 
        }}>
          <motion.div variants={prefersReduced ? false : slideRight} initial="hidden" animate="visible" custom={1} style={{ width: '100%', maxWidth: '100%' }}>
            
            {/* Glassmorphism Card */}
            <Box sx={{
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              borderRadius: '32px',
              p: { xs: 4, md: 5, lg: 6 },
              width: '100%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.04)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Background accent inside card */}
              <Box sx={{
                position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px',
                background: 'radial-gradient(circle, rgba(211,28,61,0.05) 0%, transparent 70%)',
                filter: 'blur(20px)', zIndex: 0
              }} />

              <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                
                {/* Logo Box */}
                <Box sx={{ 
                  width: 64, height: 64, borderRadius: '20px', 
                  background: 'linear-gradient(135deg, #E12A45 0%, #B8152F 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', mb: 3,
                  boxShadow: '0 8px 24px rgba(211,28,61,0.25)'
                }}>
                  <WaterDropIcon sx={{ color: '#fff', fontSize: '2rem' }} />
                </Box>

                <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.75rem', fontWeight: 700, color: '#30201D', mb: 0.5 }}>
                  Sri Sai Durga
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#887A77', fontWeight: 500, mb: 4 }}>
                  Diagnostic Centre Portal
                </Typography>

                {/* Toggle Switch */}
                <Box sx={{ 
                  display: 'flex', background: 'rgba(253,251,247,0.8)', 
                  borderRadius: '100px', p: 0.5, mb: 4,
                  border: '1px solid rgba(0,0,0,0.03)'
                }}>
                  <Button 
                    fullWidth 
                    disableElevation
                    onClick={() => switchMode(true)}
                    sx={{ 
                      borderRadius: '100px', py: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '0.9rem',
                      background: isLogin ? 'linear-gradient(135deg, #E12A45 0%, #B8152F 100%)' : 'transparent',
                      color: isLogin ? '#fff' : '#887A77',
                      transition: 'all 0.3s ease',
                      boxShadow: isLogin ? '0 4px 12px rgba(211,28,61,0.2)' : 'none',
                      '&:hover': { background: isLogin ? 'linear-gradient(135deg, #E12A45 0%, #B8152F 100%)' : 'rgba(0,0,0,0.02)' }
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    fullWidth 
                    disableElevation
                    onClick={() => switchMode(false)}
                    sx={{ 
                      borderRadius: '100px', py: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '0.9rem',
                      background: !isLogin ? 'linear-gradient(135deg, #E12A45 0%, #B8152F 100%)' : 'transparent',
                      color: !isLogin ? '#fff' : '#887A77',
                      transition: 'all 0.3s ease',
                      boxShadow: !isLogin ? '0 4px 12px rgba(211,28,61,0.2)' : 'none',
                      '&:hover': { background: !isLogin ? 'linear-gradient(135deg, #E12A45 0%, #B8152F 100%)' : 'rgba(0,0,0,0.02)' }
                    }}
                  >
                    Create Account
                  </Button>
                </Box>

                <AnimatePresence mode="wait">
                  {(error || success || sessionExpired) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 16 }}>
                      {sessionExpired && <Alert severity="warning" sx={{ borderRadius: '16px' }}>Your session expired. Please login again.</Alert>}
                      {error && <Alert severity="error" sx={{ borderRadius: '16px' }}>{error}</Alert>}
                      {success && <Alert severity="success" sx={{ borderRadius: '16px' }}>{success}</Alert>}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                      fullWidth
                      name="username"
                      placeholder="Username *"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      variant="outlined"
                      InputProps={{
                        sx: { 
                          borderRadius: '16px', background: 'rgba(253,251,247,0.8)',
                          '& fieldset': { borderColor: 'rgba(0,0,0,0.05)' },
                          '&:hover fieldset': { borderColor: 'rgba(211,28,61,0.2)' },
                          '&.Mui-focused fieldset': { borderColor: '#D31C3D', borderWidth: '1px' },
                        }
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password *"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      variant="outlined"
                      InputProps={{
                        sx: { 
                          borderRadius: '16px', background: 'rgba(253,251,247,0.8)',
                          '& fieldset': { borderColor: 'rgba(0,0,0,0.05)' },
                          '&:hover fieldset': { borderColor: 'rgba(211,28,61,0.2)' },
                          '&.Mui-focused fieldset': { borderColor: '#D31C3D', borderWidth: '1px' },
                        },
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#887A77' }}>
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {!isLogin && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <TextField
                          fullWidth
                          name="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Confirm Password *"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          variant="outlined"
                          InputProps={{
                            sx: { 
                              borderRadius: '16px', background: 'rgba(253,251,247,0.8)',
                              '& fieldset': { borderColor: 'rgba(0,0,0,0.05)' },
                              '&:hover fieldset': { borderColor: 'rgba(211,28,61,0.2)' },
                              '&.Mui-focused fieldset': { borderColor: '#D31C3D', borderWidth: '1px' },
                            }
                          }}
                        />
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      fullWidth
                      disabled={loading}
                      endIcon={!loading && <ArrowIcon />}
                      sx={{
                        mt: 2, py: 2, borderRadius: '100px', textTransform: 'none',
                        fontSize: '1rem', fontWeight: 700, color: '#fff',
                        background: 'linear-gradient(135deg, #E12A45 0%, #B8152F 100%)',
                        boxShadow: '0 12px 24px rgba(211,28,61,0.25)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #D31C3D 0%, #A01229 100%)',
                          boxShadow: '0 16px 32px rgba(211,28,61,0.35)',
                          transform: 'translateY(-2px)'
                        },
                        '&:disabled': {
                          background: '#E5E5E5',
                          color: '#A3A3A3'
                        }
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : (isLogin ? 'Sign In' : 'Create Account')}
                    </Button>
                  </Box>
                </form>
              </Box>
            </Box>

            {/* Footer Text */}
            <Typography sx={{ textAlign: 'center', mt: 4, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', color: '#9D928F', textTransform: 'uppercase' }}>
              SECURE PORTAL - SRI SAI DURGA DIAGNOSTIC CENTRE
            </Typography>

          </motion.div>
        </Grid>
      </Grid>
      </Box>

      {/* ── 2. SCROLL TO EXPLORE DIVIDER ─────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8, mb: 12 }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.2em', color: '#9D928F', mb: 2 }}>
          SCROLL TO EXPLORE
        </Typography>
        <Box sx={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, #D31C3D, transparent)' }} />
      </Box>

      {/* ── 3. STATS SECTION ─────────────────────────────────────────────────── */}
      <Box sx={{ maxWidth: '1200px', margin: '0 auto', px: 4, mb: 16 }}>
        <Grid 
          container 
          spacing={4} 
          justifyContent="center" 
          textAlign="center"
          component={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } }
          }}
        >
          {[
            { value: '250k+', label: 'SAMPLES ANALYZED' },
            { value: '99.98%', label: 'REPORT ACCURACY' },
            { value: '2 hr', label: 'AVG TURNAROUND' },
            { value: '24/7', label: 'PORTAL ACCESS' }
          ].map((stat, idx) => (
            <Grid 
              item xs={6} md={3} key={idx}
              component={motion.div}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
            >
              <Typography sx={{ 
                fontFamily: '"Playfair Display", "Times New Roman", serif', 
                fontSize: { xs: '2.5rem', md: '3.5rem' }, 
                fontWeight: 700, color: '#30201D', lineHeight: 1
              }}>
                {stat.value.replace(/([A-Za-z+%]+)/, '')}
                <span style={{ color: '#D31C3D' }}>{stat.value.match(/([A-Za-z+%]+)/)?.[0] || ''}</span>
              </Typography>
              <Typography sx={{ 
                fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em', 
                color: '#887A77', mt: 1.5, textTransform: 'uppercase'
              }}>
                {stat.label}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── 4. PROCESS SECTION (Alternating Timeline) ────────────────────────── */}
      <Box sx={{ maxWidth: '1200px', margin: '0 auto', px: { xs: 2, md: 4 }, mb: 20, position: 'relative' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.15em', color: '#D31C3D', mb: 2 }}>
              01 — PROCESS
            </Typography>
            <Typography sx={{ 
              fontFamily: '"Playfair Display", "Times New Roman", serif', 
              fontSize: { xs: '2.5rem', md: '3.5rem' }, 
              fontWeight: 700, color: '#30201D', lineHeight: 1.2, margin: '0 auto', maxWidth: '600px'
            }}>
              From vein <span style={{ color: '#D31C3D' }}>to verified</span> rep<span style={{ color: '#0F6E56' }}>ort</span> — in hours.
            </Typography>
          </Box>
        </motion.div>

        <Box sx={{ position: 'relative' }}>
          {/* Central Vertical Line (hidden on very small screens, visible on md+) */}
          <Box sx={{ 
            position: 'absolute', top: 0, bottom: 0, left: '50%', width: '2px', 
            background: 'linear-gradient(to bottom, rgba(211,28,61,0.2), transparent)', 
            zIndex: 0, transform: 'translateX(-50%)',
            display: { xs: 'none', md: 'block' }
          }} />

          {/* Left-aligned Vertical Line for mobile */}
          <Box sx={{ 
            position: 'absolute', top: 0, bottom: 0, left: '28px', width: '2px', 
            background: 'linear-gradient(to bottom, rgba(211,28,61,0.2), transparent)', 
            zIndex: 0,
            display: { xs: 'block', md: 'none' }
          }} />

          {[
            { step: '01', title: 'Sample Collection', desc: 'Painless collection at home or at the centre by trained phlebotomists.', icon: <WaterDropIcon sx={{ fontSize: '1.5rem', color: '#D31C3D' }} /> },
            { step: '02', title: 'Precision Analysis', desc: 'Automated analyzers with dual-verification pipelines.', icon: <BiotechIcon sx={{ fontSize: '1.5rem', color: '#D31C3D' }} /> },
            { step: '03', title: 'Clinical Review', desc: 'Every abnormal marker reviewed by senior pathologists.', icon: <TimelineIcon sx={{ fontSize: '1.5rem', color: '#D31C3D' }} /> },
            { step: '04', title: 'Secure Delivery', desc: 'Encrypted reports available instantly inside your portal.', icon: <SecurityIcon sx={{ fontSize: '1.5rem', color: '#D31C3D' }} /> }
          ].map((item, idx) => {
            const isLeft = idx % 2 === 0;
            return (
              <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'row', md: 'row' },
                  alignItems: 'center', 
                  mb: { xs: 6, md: 8 }, 
                  position: 'relative', zIndex: 1,
                  justifyContent: { xs: 'flex-start', md: 'center' }
                }}>
                  
                  {/* Left Spacer (Desktop) */}
                  <Box sx={{ width: '50%', display: { xs: 'none', md: isLeft ? 'flex' : 'none' }, justifyContent: 'flex-end', pr: 6 }}>
                    {/* Step Content Card */}
                    <Box sx={{ 
                      background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(211,28,61,0.15)', borderRadius: '16px',
                      p: 4, width: '100%', maxWidth: '400px',
                      boxShadow: '0 12px 32px rgba(211,28,61,0.05)',
                      textAlign: 'right'
                    }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em', color: '#D31C3D', mb: 1 }}>
                        STEP {item.step}
                      </Typography>
                      <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.25rem', fontWeight: 700, color: '#30201D', mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#887A77', lineHeight: 1.6 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Spacer for Right items on left side */}
                  <Box sx={{ width: '50%', display: { xs: 'none', md: !isLeft ? 'block' : 'none' } }} />

                  {/* Central Icon */}
                  <Box sx={{ 
                    width: 56, height: 56, borderRadius: '50%', background: '#fff',
                    border: '2px solid rgba(211,28,61,0.1)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(211,28,61,0.1)',
                    position: { xs: 'absolute', md: 'absolute' }, 
                    left: { xs: '0px', md: '50%' },
                    transform: { xs: 'none', md: 'translateX(-50%)' },
                    zIndex: 2
                  }}>
                    {item.icon}
                  </Box>

                  {/* Right Spacer (Desktop) */}
                  <Box sx={{ width: '50%', display: { xs: 'none', md: !isLeft ? 'flex' : 'none' }, justifyContent: 'flex-start', pl: 6 }}>
                    <Box sx={{ 
                      background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(211,28,61,0.15)', borderRadius: '16px',
                      p: 4, width: '100%', maxWidth: '400px',
                      boxShadow: '0 12px 32px rgba(211,28,61,0.05)',
                      textAlign: 'left'
                    }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em', color: '#D31C3D', mb: 1 }}>
                        STEP {item.step}
                      </Typography>
                      <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.25rem', fontWeight: 700, color: '#30201D', mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#887A77', lineHeight: 1.6 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Spacer for Left items on right side */}
                  <Box sx={{ width: '50%', display: { xs: 'none', md: isLeft ? 'block' : 'none' } }} />

                  {/* Mobile Layout (All cards on the right) */}
                  <Box sx={{ display: { xs: 'flex', md: 'none' }, pl: '80px', width: '100%' }}>
                    <Box sx={{ 
                      background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(211,28,61,0.15)', borderRadius: '16px',
                      p: 3, width: '100%',
                      boxShadow: '0 12px 32px rgba(211,28,61,0.05)',
                      textAlign: 'left'
                    }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em', color: '#D31C3D', mb: 1 }}>
                        STEP {item.step}
                      </Typography>
                      <Typography sx={{ fontFamily: '"Playfair Display", serif', fontSize: '1.15rem', fontWeight: 700, color: '#30201D', mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: '#887A77', lineHeight: 1.6 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>

                </Box>
              </motion.div>
            );
          })}
        </Box>
      </Box>

      {/* ── 5. BOTTOM CTA SECTION ────────────────────────────────────────────── */}
      <Box sx={{ 
        position: 'relative', py: 16, textAlign: 'center',
        background: 'radial-gradient(ellipse at center, rgba(15,110,86,0.05) 0%, transparent 60%)'
      }}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(211,28,61,0.08) 0%, transparent 60%)',
          filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none'
        }} />
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto', px: 4 }}>
            <Typography sx={{ 
              fontFamily: '"Playfair Display", serif', fontSize: { xs: '3rem', md: '4.5rem' }, 
              fontWeight: 700, color: '#0F6E56', lineHeight: 1.1, mb: 4
            }}>
              Precision you can feel <span style={{ color: '#D31C3D' }}>in every dr<span style={{ color: '#0F6E56' }}>op</span>.</span>
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: '#6B5E5B', mb: 6, maxWidth: '400px', margin: '0 auto 48px auto', lineHeight: 1.6 }}>
              Sign in to access reports, book collections, and track your health timeline — all inside one secure portal.
            </Typography>
            <Button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              sx={{ 
                borderRadius: '100px', py: 2, px: 6, textTransform: 'none', fontWeight: 700, fontSize: '1rem',
                color: '#fff', background: 'linear-gradient(135deg, #E12A45 0%, #B8152F 100%)',
                boxShadow: '0 12px 24px rgba(211,28,61,0.25)', transition: 'all 0.3s ease',
                '&:hover': { background: 'linear-gradient(135deg, #D31C3D 0%, #A01229 100%)', transform: 'translateY(-2px)' }
              }}
              endIcon={<ArrowIcon />}
            >
              Enter the Portal
            </Button>
          </Box>
        </motion.div>
      </Box>

      {/* Footer Text (Moved to bottom) */}
      <Box sx={{ pb: 6, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', color: '#9D928F', textTransform: 'uppercase' }}>
          SECURE PORTAL - SRI SAI DURGA DIAGNOSTIC CENTRE © 2026
        </Typography>
      </Box>

    </Box> // Close the master Box
  );
}

export default Login;