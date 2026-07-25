/* eslint-disable */
import React, { useRef, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Grid, Typography, Button } from '@mui/material';
import {
  PersonAddOutlined as PersonAddIcon,
  DescriptionOutlined as DescriptionIcon,
  IosShare as PrintIcon,
  DonutLargeOutlined as AnalyticsIcon,
  RestoreOutlined as HistoryIcon,
  ScienceOutlined as SettingsIcon,
  MedicationOutlined as BuildIcon,
  RequestQuoteOutlined as MonetizationOnIcon,
  AccountBalanceWalletOutlined as AccountBalanceIcon,
  ArrowForwardRounded as ArrowIcon,
} from '@mui/icons-material';
import { motion, useReducedMotion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero3D from './Hero3D';
import heroBg from '../assets/hero-bg.png';

gsap.registerPlugin(ScrollTrigger);

// ── Menu definitions ────────────────────────────────────────────────────────
const menuItems = [
  { title: 'Patient Entry',      icon: <PersonAddIcon     sx={{ fontSize: 36 }} />, path: '/patient-entry',    color: '#10B981', glow: 'rgba(16,185,129,0.25)' },
  { title: 'Create Report',      icon: <DescriptionIcon   sx={{ fontSize: 36 }} />, path: '/create-report',    color: '#3B82F6', glow: 'rgba(59,130,246,0.25)' },
  { title: 'Share Report',       icon: <PrintIcon         sx={{ fontSize: 36 }} />, path: '/share-report',     color: '#8B5CF6', glow: 'rgba(139,92,246,0.25)' },
  { title: 'Analysis',           icon: <AnalyticsIcon     sx={{ fontSize: 36 }} />, path: '/analysis',         color: '#F59E0B', glow: 'rgba(245,158,11,0.25)' },
  { title: 'History',            icon: <HistoryIcon       sx={{ fontSize: 36 }} />, path: '/history',          color: '#EF4444', glow: 'rgba(239,68,68,0.25)'   },
  { title: 'Test Settings',      icon: <SettingsIcon      sx={{ fontSize: 36 }} />, path: '/test-settings',    color: '#06B6D4', glow: 'rgba(6,182,212,0.25)'   },
  { title: 'Equipment & Kits',   icon: <BuildIcon         sx={{ fontSize: 36 }} />, path: '/equipment',        color: '#0F6E56', glow: 'rgba(15,110,86,0.25)'   },
  { title: 'Commission',         icon: <MonetizationOnIcon sx={{ fontSize: 36 }} />, path: '/commission',       color: '#D8A13B', glow: 'rgba(216,161,59,0.25)'  },
  { title: 'Accounts & Balance', icon: <AccountBalanceIcon sx={{ fontSize: 36 }} />, path: '/accounts-balance', color: '#EC4899', glow: 'rgba(236,72,153,0.25)' },
];

// ── Heading words for staggered reveal ──────────────────────────────────────
const headingLine1 = 'Exceptional';
const headingLine2 = 'Sri Sai Durga';

// ── Framer Motion variants ───────────────────────────────────────────────────
const charVariants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
  visible: (i) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { delay: i * 0.03, duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  }),
};

const subVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.75, duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const btnVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { delay: 1.0, duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const cardContainerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 40, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

// ── Main Component ───────────────────────────────────────────────────────────
function Dashboard() {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  const mousePos = useRef({ x: 0, y: 0 });
  const heroBgRef = useRef(null);
  const heroContentRef = useRef(null);

  // Mouse tracking for 3D orb cursor reactivity
  useEffect(() => {
    const handleMouse = (e) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth  - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener('mousemove', handleMouse, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  // GSAP: parallax on hero background image
  useEffect(() => {
    if (prefersReduced || !heroBgRef.current) return;
    
    const tween = gsap.to(heroBgRef.current, {
      y: '25%',
      ease: 'none',
      scrollTrigger: {
        trigger: heroBgRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => { tween.kill(); ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, [prefersReduced]);

  // GSAP: hero content moves slightly slower on scroll (parallax foreground)
  useEffect(() => {
    if (prefersReduced || !heroContentRef.current) return;
    
    gsap.to(heroContentRef.current, {
      y: '12%',
      opacity: 0.2,
      ease: 'none',
      scrollTrigger: {
        trigger: heroContentRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }, [prefersReduced]);

  return (
    <Box sx={{ pb: 16, background: 'var(--surface-light)' }}>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'relative',
        width: '100%',
        height: { xs: '100vh', md: '100vh' },
        minHeight: '620px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}>

        {/* Parallax background image layer */}
        <Box ref={heroBgRef} sx={{
          position: 'absolute',
          inset: '-20%',
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          willChange: 'transform',
          transform: 'scale(1.3)',
        }} />

        {/* Dark gradient overlay */}
        <Box sx={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(180deg, rgba(11,31,58,0.82) 0%, rgba(11,31,58,0.65) 60%, rgba(11,31,58,0.90) 100%),
            linear-gradient(135deg, rgba(15,110,86,0.20) 0%, transparent 60%)
          `,
          zIndex: 1,
        }} />

        {/* 3D Particle Orb — right quadrant on desktop, behind content */}
        <Box sx={{
          position: 'absolute',
          right: { xs: '50%', md: '-5%' },
          top: { xs: '-20%', md: '-10%' },
          transform: { xs: 'translateX(50%)', md: 'none' },
          width: { xs: '90vw', md: '55vw' },
          height: { xs: '90vw', md: '120vh' },
          zIndex: 2,
          opacity: { xs: 0.35, md: 0.75 },
        }}>
          <Suspense fallback={null}>
            <Hero3D mousePos={mousePos} />
          </Suspense>
        </Box>

        {/* Hero content — sits above parallax layers */}
        <Box
          ref={heroContentRef}
          sx={{
            position: 'relative',
            zIndex: 3,
            px: { xs: 3, md: 6 },
            maxWidth: '820px',
            mx: 'auto',
          }}
        >
          {/* Pre-heading badge */}
          <motion.div
            initial={prefersReduced ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Box sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              mb: 3,
              px: 2.5, py: 0.75,
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(216, 161, 59, 0.15)',
              border: '1px solid rgba(216, 161, 59, 0.35)',
              backdropFilter: 'blur(8px)',
            }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#D8A13B', animation: 'pulse-accent 2s infinite' }} />
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#F0C97A', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                "Health is the greatest of human blessings."
              </Typography>
            </Box>
          </motion.div>

          {/* Staggered character reveal heading */}
          <Typography component="div" sx={{ fontWeight: 900, lineHeight: 1.08, mb: 2.5 }}>
            <Box component="div" sx={{ overflow: 'hidden' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'nowrap', gap: { xs: '0.5rem', md: '1rem' } }}>
                {'Sri Sai Durga'.split(' ').map((word, wIdx) => (
                  <Box key={wIdx} sx={{ display: 'flex', whiteSpace: 'nowrap' }}>
                    {word.split('').map((char, i) => (
                      <motion.span
                        key={i}
                        custom={i + wIdx}
                        variants={charVariants}
                        initial="hidden"
                        animate="visible"
                        style={{
                          fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
                          color: '#FFFFFF',
                          display: 'inline-block',
                          fontFamily: 'Inter, sans-serif',
                          letterSpacing: '-0.03em',
                        }}
                      >
                        {char}
                      </motion.span>
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          </Typography>

          {/* Subheading */}
          <motion.div variants={subVariants} initial="hidden" animate="visible">
            <Typography sx={{
              fontSize: { xs: '1rem', md: '1.15rem' },
              color: 'rgba(241,245,249,0.75)',
              fontWeight: 400,
              mb: 5,
              maxWidth: '520px',
              mx: 'auto',
              lineHeight: 1.7,
            }}>
              Providing high-quality diagnostic services with cutting-edge precision and personalized care.
            </Typography>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={btnVariants} initial="hidden" animate="visible">
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button
                  className="btn-sheen"
                  onClick={() => navigate('/patient-entry')}
                  sx={{
                    background: 'linear-gradient(135deg, #0F6E56 0%, #0B1F3A 100%)',
                    color: '#fff',
                    borderRadius: 'var(--radius-pill)',
                    px: 4.5, py: 1.6,
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    boxShadow: '0 8px 30px rgba(15,110,86,0.4)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    letterSpacing: '0.01em',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0F6E56 0%, #0D4A7A 100%)',
                      boxShadow: '0 12px 40px rgba(15,110,86,0.55)',
                    },
                  }}
                >
                  Book Appointment
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button
                  sx={{
                    borderColor: 'rgba(255,255,255,0.35)',
                    color: '#fff',
                    borderRadius: 'var(--radius-pill)',
                    px: 4.5, py: 1.6,
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    backdropFilter: 'blur(8px)',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    letterSpacing: '0.01em',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.14)',
                      borderColor: 'rgba(255,255,255,0.55)',
                    },
                  }}
                  onClick={() => {
                    document.getElementById('modules-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Our Specialties
                </Button>
              </motion.div>
            </Box>
          </motion.div>
        </Box>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 4 }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            onClick={() => document.getElementById('modules-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Scroll
            </Typography>
            <Box sx={{
              width: 24, height: 38,
              border: '1.5px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <Box sx={{
                width: 4, height: 8,
                borderRadius: '2px',
                background: 'rgba(255,255,255,0.7)',
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                top: 6,
                animation: 'scrollDot 2s ease-in-out infinite',
              }} />
            </Box>
          </Box>
        </motion.div>
      </Box>

      {/* ── MODULE GRID SECTION ──────────────────────────────────────────── */}
      <Box id="modules-section" sx={{ pt: { xs: 8, md: 12 }, pb: 4 }}>
        <Container maxWidth="lg">

          {/* Section heading */}
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                px: 2.5, py: 0.6,
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(15,110,86,0.10)',
                border: '1px solid rgba(15,110,86,0.25)',
              }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-teal)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Centers of Excellence
                </Typography>
              </Box>
            </motion.div>

            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Typography variant="h3" sx={{
                fontWeight: 800,
                color: 'var(--color-primary)',
                mt: 1,
                mx: 'auto',
                maxWidth: '640px',
                lineHeight: 1.2,
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.02em',
              }}>
                Everything you need,{' '}
                <Box component="span" sx={{
                  background: 'linear-gradient(135deg, #0F6E56 0%, #D8A13B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  in one place
                </Box>
              </Typography>
            </motion.div>

            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <Typography sx={{ color: 'var(--text-secondary)', mt: 2, maxWidth: '500px', mx: 'auto', lineHeight: 1.7 }}>
                Our diagnostic modules work seamlessly together, from patient intake to report sharing.
              </Typography>
            </motion.div>
          </Box>

          {/* Card Grid */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(280px, 1fr))',
              md: 'repeat(auto-fill, minmax(320px, 1fr))'
            },
            gap: 3,
            alignItems: 'stretch'
          }}>
            {menuItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: (index % 4) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%' }}
              >
                <Tilt
                  tiltMaxAngleX={8}
                  tiltMaxAngleY={8}
                  glareEnable={true}
                  glareMaxOpacity={0.08}
                  glareColor="#ffffff"
                  glarePosition="all"
                  glareBorderRadius="20px"
                  transitionSpeed={600}
                  style={{ height: '100%', borderRadius: '20px' }}
                >
                  <Box
                    onClick={() => navigate(item.path)}
                    sx={{
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-2xl)',
                      p: { xs: 3, md: 4 },
                      height: '100%',
                      minHeight: '240px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      cursor: 'pointer',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0, left: 0, right: 0,
                            height: '3px',
                            background: `linear-gradient(90deg, ${item.color} 0%, transparent 100%)`,
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                          },
                          '&:hover': {
                            transform: 'translateY(-6px)',
                            boxShadow: `0 24px 50px -10px ${item.glow}, 0 8px 16px rgba(0,0,0,0.06)`,
                            borderColor: `${item.color}40`,
                            '&::before': { opacity: 1 },
                            '& .card-icon': {
                              background: `linear-gradient(135deg, ${item.color}20 0%, ${item.color}10 100%)`,
                              borderColor: `${item.color}40`,
                              color: item.color,
                              transform: 'scale(1.1)',
                            },
                            '& .card-arrow': {
                              transform: 'translateX(6px)',
                              color: item.color,
                            },
                          }
                        }}
                      >
                        {/* Icon box */}
                        <Box
                          className="card-icon"
                          sx={{
                            width: 68, height: 68,
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--surface-muted)',
                            border: '1px solid rgba(226,232,240,0.9)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            mb: 2.5,
                            color: 'var(--text-secondary)',
                            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                          }}
                        >
                          {item.icon}
                        </Box>

                        {/* Title */}
                        <Typography sx={{
                          fontWeight: 700,
                          color: 'var(--color-primary)',
                          fontSize: '1.05rem',
                          lineHeight: 1.3,
                          mb: 1,
                          flexGrow: 1,
                          fontFamily: 'Inter, sans-serif',
                          letterSpacing: '-0.01em',
                        }}>
                          {item.title}
                        </Typography>

                        {/* Learn more link */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                          <Typography sx={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            letterSpacing: '0.02em',
                          }}>
                            Open
                          </Typography>
                          <ArrowIcon
                            className="card-arrow"
                            sx={{
                              fontSize: 16,
                              color: 'var(--text-muted)',
                              transition: 'all 0.3s var(--ease-spring)',
                            }}
                          />
                        </Box>
                      </Box>
                    </Tilt>
              </motion.div>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Inline style for scroll dot animation */}
      <style>{`
        @keyframes scrollDot {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 1; }
          80% { transform: translateX(-50%) translateY(14px); opacity: 0; }
        }
        @keyframes pulse-accent {
          0%, 100% { box-shadow: 0 0 0 0 rgba(216,161,59,0.4); }
          50% { box-shadow: 0 0 12px 4px rgba(216,161,59,0.3); }
        }
      `}</style>
    </Box>
  );
}

export default Dashboard;