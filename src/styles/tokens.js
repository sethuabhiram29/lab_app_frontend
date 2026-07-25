// Design system tokens — single source of truth for the entire app
// Import this in any component that needs raw token values in JS

export const colors = {
  // Primary gradient: deep navy → teal
  primaryStart: '#0B1F3A',
  primaryEnd: '#0F6E56',
  primaryMid: '#0D4A7A',

  // Accent: warm gold — used sparingly for premium highlights
  accent: '#D8A13B',
  accentLight: '#F0C97A',

  // Surface tokens
  glassBg: 'rgba(255, 255, 255, 0.08)',
  glassBgStrong: 'rgba(255, 255, 255, 0.14)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.28)',

  // Dark surface (sidebar, panels)
  surfaceDark: '#0D1B2A',
  surfaceDarkMid: '#14263A',
  surfaceDarkBorder: 'rgba(255,255,255,0.08)',

  // Light surface
  surfaceLight: '#F8FAFC',
  surfacePaper: '#FFFFFF',
  surfaceMuted: '#F1F5F9',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnDark: '#F1F5F9',
  textOnDarkMuted: '#94A3B8',

  // Status gradients
  statusSuccess: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
  statusWarning: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
  statusError: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
  statusInfo: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',

  // Named solids
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primaryStart} 0%, ${colors.primaryEnd} 100%)`,
  primaryReverse: `linear-gradient(135deg, ${colors.primaryEnd} 0%, ${colors.primaryStart} 100%)`,
  accent: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 100%)`,
  heroMesh: `
    radial-gradient(ellipse at 20% 50%, rgba(15, 110, 86, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(11, 31, 58, 0.9) 0%, transparent 60%),
    radial-gradient(ellipse at 60% 80%, rgba(216, 161, 59, 0.08) 0%, transparent 50%)
  `,
  glassSurface: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
};

export const motion = {
  // Durations in ms
  micro: 150,
  standard: 300,
  hero: 600,
  slow: 900,

  // Easing curves (CSS strings)
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',

  // Framer Motion spring configs
  springConfig: { type: 'spring', stiffness: 400, damping: 30 },
  springConfigSoft: { type: 'spring', stiffness: 200, damping: 25 },
  springConfigBouncy: { type: 'spring', stiffness: 500, damping: 28 },

  // GSAP ease strings
  gsapSpring: 'back.out(1.7)',
  gsapSmooth: 'power3.out',
  gsapHero: 'power4.out',
};

export const spacing = {
  // 8px base unit
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

export const radii = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  pill: '100px',
  circle: '50%',
};

export const shadows = {
  card: '0 4px 24px rgba(0,0,0,0.06)',
  cardHover: '0 20px 60px rgba(11, 31, 58, 0.18)',
  glass: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255,255,255,0.15)',
  glow: '0 0 30px rgba(15, 110, 86, 0.35)',
  glowAccent: '0 0 20px rgba(216, 161, 59, 0.4)',
};

// Reduced-motion check (use this to disable complex animations)
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
