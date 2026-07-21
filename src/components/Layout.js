import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
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
} from '@mui/icons-material';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Patient Entry', icon: <PersonAddIcon />, path: '/patient-entry' },
  { text: 'Create Report', icon: <DescriptionIcon />, path: '/create-report' },
  { text: 'Share Report', icon: <PrintIcon />, path: '/share-report' },
  { text: 'Analysis', icon: <AnalyticsIcon />, path: '/analysis' },
  { text: 'History', icon: <HistoryIcon />, path: '/history' },
  { text: 'Test Settings', icon: <SettingsIcon />, path: '/test-settings' },
  { text: 'Equipment & Kits', icon: <BuildIcon />, path: '/equipment' },
  { text: 'Commission', icon: <MonetizationOnIcon />, path: '/commission' },
  { text: 'Accounts & Balance', icon: <AccountBalanceIcon />, path: '/accounts-balance' },
];

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined') {
      try { setUser(JSON.parse(storedUser)); } catch (e) { setUser(null); }
    }
  }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  
  const handleNavigation = (path) => { 
    navigate(path); 
    setMobileOpen(false); 
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  if (user === null) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom sx={{ fontWeight: 700 }}>Session Expired</Typography>
        <Button variant="contained" onClick={() => navigate('/login')} sx={{ mt: 2 }}>Go to Login</Button>
      </Box>
    );
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
      <Toolbar /> {/* Spacer for AppBar */}
      <List sx={{ px: 2, flex: 1, pt: 3 }}>
        <Typography variant="overline" sx={{ px: 2, color: '#94A3B8', fontWeight: 700, letterSpacing: '0.1em', mb: 1, display: 'block' }}>
          Menu
        </Typography>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem
              button
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: '12px',
                mb: 0.5,
                py: 1,
                px: 2,
                backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                color: isActive ? '#2563EB' : '#4B5563',
                '&:hover': {
                  backgroundColor: '#F3F4F6',
                  color: '#1F2937',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemIcon sx={{ color: isActive ? '#2563EB' : '#9CA3AF', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ fontWeight: isActive ? 700 : 500, fontSize: '0.9rem' }}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: '#FFFFFF',
          color: '#1F2937',
          borderBottom: '1px solid #E5E7EB',
          zIndex: (theme) => theme.zIndex.drawer + 1, // Keep appbar above drawer
        }}
      >
        <Toolbar sx={{ minHeight: '80px !important', px: { xs: 2, md: 6 } }}>
          {!isHome && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, mr: 6, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', letterSpacing: '-0.02em' }}>
              Sri Sai Durga <span style={{ color: '#2563EB' }}>Diagnostic Centre</span>
            </Typography>
          </Box>

          {/* User Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleMenu} sx={{ p: 0 }}>
              <Avatar sx={{ bgcolor: '#2563EB', width: 40, height: 40, fontWeight: 700 }}>
                {user.username.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{ sx: { mt: 1, borderRadius: 2, minWidth: 150 } }}
            >
              <MenuItem disabled sx={{ opacity: '1 !important', color: '#1F2937', fontWeight: 700 }}>
                {user.username}
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: '#EF4444' }}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Conditional Sidebar */}
      {!isHome && (
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, borderRight: 'none' } }}
          >
            {drawerContent}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, borderRight: '1px solid #E5E7EB' } }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>
      )}

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          pt: '80px', 
          width: isHome ? '100%' : { sm: `calc(100% - ${drawerWidth}px)` },
          display: 'flex', 
          flexDirection: 'column',
          transition: 'width 0.3s ease',
        }}
      >
        <Box sx={{ flex: 1, p: isHome ? 0 : { xs: 2, sm: 3, md: 4 } }} className="animate-fade-in">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;