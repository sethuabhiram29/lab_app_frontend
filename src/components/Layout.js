/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Button,
  Menu, MenuItem, Avatar, Drawer, List, ListItem, ListItemIcon, ListItemText, Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  DashboardOutlined as DashboardIcon,
  PersonAddOutlined as PersonAddIcon,
  DescriptionOutlined as DescriptionIcon,
  IosShare as PrintIcon,
  DonutLargeOutlined as AnalyticsIcon,
  RestoreOutlined as HistoryIcon,
  ScienceOutlined as SettingsIcon,
  MedicationOutlined as BuildIcon,
  AccountBalanceWalletOutlined as AccountBalanceIcon,
  RequestQuoteOutlined as MonetizationOnIcon,
  LogoutOutlined as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const drawerWidthExpanded = 260;
const drawerWidthCollapsed = 88;

const menuItems = [
  { text: 'Dashboard',        icon: <DashboardIcon />,    path: '/' },
  { text: 'Patient Entry',    icon: <PersonAddIcon />,    path: '/patient-entry' },
  { text: 'Create Report',    icon: <DescriptionIcon />,  path: '/create-report' },
  { text: 'Share Report',     icon: <PrintIcon />,        path: '/share-report' },
  { text: 'Analysis',         icon: <AnalyticsIcon />,    path: '/analysis' },
  { text: 'History',          icon: <HistoryIcon />,      path: '/history' },
  { text: 'Test Settings',    icon: <SettingsIcon />,     path: '/test-settings' },
  { text: 'Equipment & Kits', icon: <BuildIcon />,        path: '/equipment' },
  { text: 'Commission',       icon: <MonetizationOnIcon />, path: '/commission' },
  { text: 'Accounts & Balance', icon: <AccountBalanceIcon />, path: '/accounts-balance' },
];

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0, y: -8,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReduced = useReducedMotion();

  const isHome = location.pathname === '/';
  const currentDrawerWidth = isSidebarCollapsed ? drawerWidthCollapsed : drawerWidthExpanded;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try { setUser(JSON.parse(storedUser)); } catch (e) { setUser(null); }
    }
  }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleNavigation = (path) => { navigate(path); setMobileOpen(false); };
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  if (user === null) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--surface-dark)' }}>
        <Typography variant="h5" sx={{ color: '#F1F5F9', fontWeight: 700 }} gutterBottom>Session Expired</Typography>
        <Button variant="contained" onClick={() => navigate('/login')} sx={{ mt: 2 }}>Go to Login</Button>
      </Box>
    );
  }

  const drawerContent = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-dark)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Sidebar header */}
      <Box sx={{
        px: isSidebarCollapsed ? 1 : 3,
        py: 3,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
        gap: 1.5,
        minHeight: 'var(--appbar-height)',
        position: 'relative',
      }}>
        {!isSidebarCollapsed && (
          <>
            <Box sx={{
              width: 34, height: 34,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #0F6E56 0%, #0B1F3A 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(15,110,86,0.35)',
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.8rem' }}>SSD</Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <Typography sx={{
                fontWeight: 700, fontSize: '0.82rem', color: '#F1F5F9', lineHeight: 1.2,
                fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap'
              }}>
                Sri Sai Durga
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: 'rgba(241,245,249,0.4)', fontWeight: 400, whiteSpace: 'nowrap' }}>
                Diagnostic Centre
              </Typography>
            </Box>
          </>
        )}
        <IconButton
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          sx={{
            color: 'rgba(255,255,255,0.5)',
            '&:hover': { color: '#fff', background: 'rgba(255,255,255,0.1)' }
          }}
        >
          {isSidebarCollapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* Nav items */}
      <List sx={{ px: isSidebarCollapsed ? 1 : 2, flex: 1, pt: 2, overflowY: 'auto' }}>
        {!isSidebarCollapsed && (
          <Typography sx={{
            px: 1.5, mb: 1.5, display: 'block',
            fontSize: '0.65rem', fontWeight: 700,
            color: 'rgba(241,245,249,0.25)',
            letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Navigation
          </Typography>
        )}

        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Tooltip title={isSidebarCollapsed ? item.text : ""} placement="right" arrow key={item.text}>
              <Box sx={{ position: 'relative', mb: 0.5 }}>
                {/* Spring-animated active background pill */}
                {isActive && !prefersReduced && (
                  <motion.div
                    layoutId="sidebar-active-pill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(15,110,86,0.25) 0%, rgba(11,31,58,0.35) 100%)',
                      border: '1px solid rgba(15,110,86,0.3)',
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}

                <ListItem
                  button
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 'var(--radius-md)',
                    py: 1,
                    px: isSidebarCollapsed ? 0 : 1.5,
                    justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                    position: 'relative',
                    zIndex: 1,
                    color: isActive ? '#5EEAD4' : 'rgba(241,245,249,0.5)',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(241,245,249,0.85)',
                    },
                    transition: 'color 0.2s ease, padding 0.2s',
                  }}
                >
                  <ListItemIcon sx={{
                    color: 'inherit',
                    minWidth: isSidebarCollapsed ? 0 : 36,
                    mr: isSidebarCollapsed ? 0 : 1,
                    justifyContent: 'center',
                    '& .MuiSvgIcon-root': { fontSize: '1.15rem' },
                    transition: 'transform 0.2s var(--ease-spring), margin 0.2s',
                    ...(isActive && { transform: 'scale(1.1)' }),
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  
                  {!isSidebarCollapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.85rem',
                        letterSpacing: '-0.01em',
                        color: 'inherit',
                        whiteSpace: 'nowrap'
                      }}
                    />
                  )}

                  {isActive && !isSidebarCollapsed && (
                    <Box sx={{
                      width: 4, height: 4, borderRadius: '50%',
                      bgcolor: '#5EEAD4',
                      boxShadow: '0 0 6px rgba(94,234,212,0.8)',
                    }} />
                  )}
                </ListItem>
              </Box>
            </Tooltip>
          );
        })}
      </List>

      {/* Sidebar user footer */}
      <Box sx={{
        p: isSidebarCollapsed ? 1 : 2,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Tooltip title={isSidebarCollapsed ? "Logout" : ""} placement="right" arrow>
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: isSidebarCollapsed ? 0 : 1.5, 
            py: 1.2,
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
            '&:hover': { background: 'rgba(255,255,255,0.07)' },
            transition: 'all 0.2s ease',
          }}
            onClick={handleLogout}
          >
            {isSidebarCollapsed ? (
              <LogoutIcon sx={{ color: 'rgba(241,245,249,0.5)' }} />
            ) : (
              <>
                <Avatar sx={{
                  bgcolor: 'rgba(15,110,86,0.4)',
                  border: '1px solid rgba(15,110,86,0.5)',
                  width: 32, height: 32,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#5EEAD4',
                }}>
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#F1F5F9', lineHeight: 1.2 }} noWrap>
                    {user.username}
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(241,245,249,0.35)', textTransform: 'capitalize' }} noWrap>
                    {user.role || 'Staff'}
                  </Typography>
                </Box>
                <LogoutIcon sx={{ fontSize: '0.9rem', color: 'rgba(241,245,249,0.25)' }} />
              </>
            )}
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-light)' }}>

      {/* ── AppBar ──────────────────────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(30,41,59,0.08)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          color: 'var(--text-primary)',
          width: isHome ? '100%' : { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: isHome ? 0 : { sm: `${currentDrawerWidth}px` },
          transition: 'width 0.2s, margin-left 0.2s',
        }}
      >
        <Toolbar sx={{ minHeight: 'var(--appbar-height) !important', px: { xs: 2, md: 4 } }}>
          {!isHome && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' }, color: 'var(--color-primary)' }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box
            onClick={() => navigate('/')}
            sx={{ display: isHome ? 'flex' : { xs: 'flex', sm: 'none' }, alignItems: 'center', flexGrow: 1, cursor: 'pointer', gap: 1.5 }}
          >
            <Box sx={{
              width: 32, height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #0F6E56 0%, #0B1F3A 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 3px 10px rgba(15,110,86,0.3)',
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.7rem' }}>SSD</Typography>
            </Box>
            <Typography sx={{
              fontWeight: 800,
              fontSize: '1rem',
              color: 'var(--color-primary)',
              letterSpacing: '-0.02em',
              fontFamily: 'Inter, sans-serif',
            }}>
              Sri Sai Durga{' '}
              <Box component="span" sx={{ color: 'var(--color-teal)' }}>Diagnostic Centre</Box>
            </Typography>
          </Box>
          {!isHome && <Box sx={{ flexGrow: { xs: 0, sm: 1 } }} />}

          {/* Right: User avatar */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <IconButton onClick={handleMenu} sx={{ p: 0.5 }}>
                <Avatar sx={{
                  background: 'linear-gradient(135deg, #0F6E56 0%, #0B1F3A 100%)',
                  width: 36, height: 36,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  boxShadow: '0 3px 10px rgba(15,110,86,0.3)',
                }}>
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </motion.div>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  borderRadius: 'var(--radius-lg)',
                  minWidth: 180,
                  boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                  border: '1px solid rgba(30,41,59,0.08)',
                  background: '#fff',
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem disabled sx={{ opacity: '1 !important' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary)' }}>
                    {user.username}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {user.role || 'Staff'}
                  </Typography>
                </Box>
              </MenuItem>
              <Box sx={{ my: 0.5, borderTop: '1px solid rgba(30,41,59,0.07)' }} />
              <MenuItem
                onClick={handleLogout}
                sx={{
                  color: '#EF4444',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  gap: 1,
                  '&:hover': { background: 'rgba(239,68,68,0.06)' },
                }}
              >
                <LogoutIcon sx={{ fontSize: '1rem' }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      {!isHome && (
        <Box component="nav" sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 }, transition: 'width 0.2s' }}>
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { width: drawerWidthExpanded, border: 'none' },
            }}
          >
            {drawerContent}
          </Drawer>

          {/* Desktop permanent drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                width: currentDrawerWidth, 
                border: 'none',
                transition: 'width 0.2s',
                overflowX: 'hidden'
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>
      )}

      {/* ── Main Content with page transition ──────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 'var(--appbar-height)',
          width: isHome ? '100%' : { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: isHome ? 0 : { sm: `${currentDrawerWidth}px` },
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: 'var(--surface-light)',
          transition: 'width 0.2s, margin-left 0.2s',
        }}
      >
        <Box sx={{ flex: 1, p: isHome ? 0 : { xs: 2, sm: 3, md: 4 } }}>
          <motion.div
            key={location.pathname}
            variants={prefersReduced ? {} : pageVariants}
            initial="initial"
            animate="animate"
            style={{ height: '100%' }}
          >
            <Outlet />
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;