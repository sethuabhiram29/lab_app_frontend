import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
} from '@mui/material';
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

import heroBg from '../assets/hero-bg.png';

function Dashboard() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Patient Entry',
      icon: <PersonAddIcon sx={{ fontSize: 40 }} />,
      path: '/patient-entry',
    },
    {
      title: 'Create Report',
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      path: '/create-report',
    },
    {
      title: 'Share Report',
      icon: <PrintIcon sx={{ fontSize: 40 }} />,
      path: '/share-report',
    },
    {
      title: 'Analysis',
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      path: '/analysis',
    },
    {
      title: 'History',
      icon: <HistoryIcon sx={{ fontSize: 40 }} />,
      path: '/history',
    },
    {
      title: 'Test Settings',
      icon: <SettingsIcon sx={{ fontSize: 40 }} />,
      path: '/test-settings',
    },
    {
      title: 'Equipment & Kits',
      icon: <BuildIcon sx={{ fontSize: 40 }} />,
      path: '/equipment',
    },
    {
      title: 'Commission',
      icon: <MonetizationOnIcon sx={{ fontSize: 40 }} />,
      path: '/commission',
    },
    {
      title: 'Accounts & Balance',
      icon: <AccountBalanceIcon sx={{ fontSize: 40 }} />,
      path: '/accounts-balance',
    },
  ];

  return (
    <Box sx={{ pb: 10 }}>
      {/* Hero Section */}
      <Box sx={{
        position: 'relative',
        width: '100%',
        height: '600px',
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        color: '#fff',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay
          zIndex: 1,
        }
      }}>
        <Box sx={{ position: 'relative', zIndex: 2, px: 2 }}>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            Exceptional<br/>Personalized Care
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 500, mb: 4, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            Providing high-quality diagnostic services.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              sx={{ 
                bgcolor: '#2563EB', 
                color: '#fff', 
                borderRadius: '50px', 
                px: 4, py: 1.5, 
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { bgcolor: '#1D4ED8' }
              }}
              onClick={() => navigate('/patient-entry')}
            >
              Book an Appointment
            </Button>
            <Button 
              variant="outlined" 
              sx={{ 
                borderColor: '#fff', 
                color: '#fff', 
                borderRadius: '50px', 
                px: 4, py: 1.5, 
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Our Specialties
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="overline" sx={{ color: '#2563EB', fontWeight: 700, letterSpacing: '0.1em' }}>
            CENTERS OF EXCELLENCE
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1F2937', mt: 1, mx: 'auto', maxWidth: '600px', lineHeight: 1.3 }}>
            Our highly skilled physicians and their teams are trained in all areas of diagnostic care
          </Typography>
        </Box>

        <Grid container spacing={4} alignItems="stretch">
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={item.title}>
              <Box className="animate-slide-up" sx={{ animationDelay: `${index * 0.08}s`, height: '100%' }}>
                <Box 
                  onClick={() => navigate(item.path)}
                  sx={{
                    background: 'linear-gradient(120deg, #ffffff 0%, #F8FAFC 50%, #EFF6FF 100%)',
                    backgroundSize: '200% 100%',
                    backgroundPosition: '0% 50%',
                    borderRadius: '24px',
                    p: 4,
                    height: '100%',
                    minHeight: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0, left: '-100%', width: '50%', height: '100%',
                      background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)',
                      transform: 'skewX(-20deg)',
                      transition: 'all 0.7s ease',
                    },
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      backgroundPosition: '100% 50%',
                      boxShadow: '0 25px 50px -12px rgba(37, 99, 235, 0.25)',
                      borderColor: 'rgba(59, 130, 246, 0.5)',
                      '&::after': {
                        left: '200%',
                      },
                      '& .icon-box': {
                        transform: 'scale(1.15) translateY(-5px)',
                        bgcolor: '#2563EB',
                        color: '#ffffff',
                        boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
                      },
                      '& .learn-more': {
                        color: '#2563EB',
                      },
                      '& .arrow-icon': {
                        transform: 'translateX(6px)',
                        color: '#2563EB',
                      }
                    }
                  }}
                >
                  <Box 
                    className="icon-box"
                    sx={{
                    width: 90, height: 90,
                    borderRadius: '24px',
                    backgroundColor: '#EFF6FF', 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 3,
                    color: '#2563EB',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    {item.icon}
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E293B', mb: 2, flexGrow: 1, letterSpacing: '-0.01em' }}>
                    {item.title}
                  </Typography>

                  <Typography 
                    variant="button" 
                    className="learn-more"
                    sx={{ 
                      display: 'flex', alignItems: 'center', gap: 0.8, 
                      fontWeight: 700, color: '#64748B',
                      textTransform: 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Learn More <ArrowIcon className="arrow-icon" sx={{ fontSize: 18, transition: 'all 0.3s ease' }} />
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default Dashboard;