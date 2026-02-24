﻿import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard/Dashboard';
import VisualTwin from './components/VisualTwin/VisualTwin';
import ChatAssistant from './components/ChatAssistant/ChatAssistant';
import { farmAPI } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, AppBar, Toolbar, Typography, Container, Tabs, Tab, 
  Box, Chip, IconButton, Badge, Avatar 
} from '@mui/material';
import { 
  Notifications, Settings, AccountCircle, Dashboard as DashboardIcon,
  Analytics, Public, SmartToy, Sensors
} from '@mui/icons-material';

const theme = createTheme({
  palette: {
    primary: { 
      main: '#10b981', // Bright green
      light: '#6ee7b7',
      dark: '#059669',
    },
    secondary: { 
      main: '#14b8a6', // Teal
      light: '#5eead4',
      dark: '#0d9488',
    },
    info: {
      main: '#0ea5e9', // Sky blue
      light: '#7dd3fc',
      dark: '#0284c7',
    },
    background: { 
      default: '#f0fdf4', // Very light green
      paper: '#ffffff'
    },
    success: {
      main: '#22c55e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 }
  },
  components: {
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          minHeight: 60,
          color: '#065f46',
          '&.Mui-selected': {
            color: '#ffffff',
            background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
          },
          '&:hover': {
            background: 'rgba(16, 185, 129, 0.1)',
          }
        }
      }
    },
  }
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [farmData, setFarmData] = useState<any>({});
  
  const { sensorData, connected } = useWebSocket('ws://localhost:8000');

  useEffect(() => {
    loadFarmData();
  }, []);

  const loadFarmData = async () => {
    try {
      const data = await farmAPI.getFarmState();
      setFarmData(data);
    } catch (error) {
      console.error('Error loading farm data:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f0fdf4' }}>
        {/* Header with bright green gradient */}
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
          }}
        >
          <Toolbar sx={{ py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              {/* Logo */}
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}
              >
                <Typography variant="h4">🌾</Typography>
              </Box>
              
              <Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 800,
                    letterSpacing: '-0.5px',
                  }}
                >
                  Smart Farm Digital Twin
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ color: 'rgba(255,255,255,0.9)' }}
                >
                  Precision Agriculture Platform
                </Typography>
              </Box>
              
              {/* Live Status Chip */}
              <Chip 
                icon={<Sensors />}
                label={connected ? 'Live' : 'Offline'} 
                size="small"
                sx={{ 
                  ml: 3,
                  bgcolor: connected ? '#22c55e' : '#ef4444',
                  color: 'white',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}
              />
            </Box>
            
            {/* Right side controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`${sensorData.length} readings`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              />
              
              <IconButton sx={{ color: 'white' }}>
                <Badge badgeContent={1} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              
              <IconButton sx={{ color: 'white' }}>
                <Settings />
              </IconButton>
              
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'white',
                  color: '#10b981',
                  fontWeight: 700,
                  border: '2px solid rgba(255,255,255,0.5)'
                }}
              >
                JD
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Navigation Tabs - Bright colors */}
        <Box 
          sx={{ 
            bgcolor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 72,
            zIndex: 100,
          }}
        >
          <Container maxWidth="xl">
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              TabIndicatorProps={{
                style: {
                  height: 4,
                  background: 'linear-gradient(90deg, #10b981 0%, #14b8a6 100%)',
                }
              }}
            >
              <Tab 
                icon={<DashboardIcon />}
                label="Unified Dashboard" 
                iconPosition="start"
              />
              <Tab 
                icon={<Analytics />}
                label="Analytics" 
                iconPosition="start"
              />
              <Tab 
                icon={<Public />}
                label="3D Visual Twin" 
                iconPosition="start"
              />
              <Tab 
                icon={<SmartToy />}
                label="AI Assistant" 
                iconPosition="start"
              />
            </Tabs>
          </Container>
        </Box>

        <Container maxWidth="xl" sx={{ mt: 3, pb: 4 }}>
          {/* Unified Dashboard */}
          <TabPanel value={activeTab} index={0}>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, 
                gap: 3
              }}
            >
              <Box
                sx={{
                  bgcolor: 'white',
                  borderRadius: 3,
                  p: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e5e7eb'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{
                    color: '#10b981',
                    fontWeight: 700,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  📊 Live Dashboard
                </Typography>
                <Dashboard 
                  sensorData={sensorData} 
                  farmData={farmData}
                  onZoneSelect={(zoneId: string) => console.log('Zone selected:', zoneId)}
                />
              </Box>
              
              <Box
                sx={{
                  bgcolor: 'white',
                  borderRadius: 3,
                  p: 3,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  border: '1px solid #e5e7eb'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{
                    color: '#0ea5e9',
                    fontWeight: 700,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  🗺️ 3D Farm Twin
                </Typography>
                <VisualTwin 
                  farmData={farmData}
                  sensorData={sensorData}
                  onZoneClick={(zoneId: string) => console.log('Zone clicked:', zoneId)}
                />
              </Box>
            </Box>
          </TabPanel>

          {/* Analytics */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ bgcolor: 'white', borderRadius: 3, p: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <Dashboard 
                sensorData={sensorData} 
                farmData={farmData}
                fullView={true}
                onZoneSelect={(zoneId: string) => console.log('Zone selected:', zoneId)}
              />
            </Box>
          </TabPanel>

          {/* Visual Twin */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ bgcolor: 'white', borderRadius: 3, p: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <VisualTwin 
                farmData={farmData}
                sensorData={sensorData}
                onZoneClick={(zoneId: string) => console.log('Zone clicked:', zoneId)}
                fullScreen={true}
              />
            </Box>
          </TabPanel>

          {/* AI Assistant */}
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ bgcolor: 'white', borderRadius: 3, p: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <ChatAssistant />
            </Box>
          </TabPanel>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
