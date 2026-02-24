import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Chip, Button,
  LinearProgress, Avatar, Alert
} from '@mui/material';
import {
  Water, Thermostat, Opacity, Science, PlayArrow, Stop,
  Warning, CheckCircle
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  sensorData: any[];
  farmData: any;
  fullView?: boolean;
  onZoneSelect: (zoneId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ sensorData, farmData, fullView = false, onZoneSelect }) => {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (sensorData.length > 0) {
      const processedData = sensorData.slice(-20).map((reading, index) => ({
        time: new Date(reading.timestamp).toLocaleTimeString(),
        [reading.type]: reading.value,
        confidence: reading.confidence_score || 0.8
      }));
      setChartData(processedData);
    }
  }, [sensorData]);

  const getStatusIcon = (status: string, value: number, type: string) => {
    if (type === 'soil_moisture' && value < 25) return <Warning color="warning" />;
    if (type === 'temperature' && value > 35) return <Warning color="error" />;
    return <CheckCircle color="success" />;
  };

  const getStatusColor = (value: number, type: string) => {
    if (type === 'soil_moisture') {
      if (value < 20) return 'error';
      if (value < 30) return 'warning';
      return 'success';
    }
    if (type === 'temperature') {
      if (value > 35) return 'error';
      if (value > 30) return 'warning';
      return 'success';
    }
    return 'info';
  };

  const SensorCard = ({ sensor }: { sensor: any }) => (
    <Card elevation={3} sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              {sensor.type === 'soil_moisture' ? <Water /> :
               sensor.type === 'temperature' ? <Thermostat /> :
               sensor.type === 'humidity' ? <Opacity /> : <Science />}
            </Avatar>
            <Box>
              <Typography variant="h6">{sensor.sensor_id}</Typography>
              <Typography variant="body2" color="text.secondary">
                {sensor.type.replace('_', ' ').toUpperCase()}
              </Typography>
            </Box>
          </Box>
          {getStatusIcon(sensor.status, sensor.value, sensor.type)}
        </Box>

        <Box display="flex" alignItems="baseline" mb={2}>
          <Typography variant="h3" color="primary">
            {sensor.value}
          </Typography>
          <Typography variant="h6" color="text.secondary" ml={1}>
            {sensor.unit}
          </Typography>
        </Box>

        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Confidence</Typography>
            <Typography variant="body2">
              {Math.round((sensor.confidence_score || 0.8) * 100)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(sensor.confidence_score || 0.8) * 100}
            color={getStatusColor(sensor.value, sensor.type) as any}
          />
        </Box>

        <Chip 
          label={sensor.status.toUpperCase()}
          color={getStatusColor(sensor.value, sensor.type) as any}
          size="small"
          sx={{ position: 'absolute', top: 16, right: 16 }}
        />

        <Typography variant="caption" display="block" color="text.secondary">
          Last updated: {new Date(sensor.timestamp).toLocaleTimeString()}
        </Typography>
      </CardContent>
    </Card>
  );

  const ZoneCard = ({ zone }: { zone: any }) => (
    <Card 
      elevation={3} 
      sx={{ 
        height: '100%', 
        cursor: 'pointer',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)' },
        border: selectedZone === zone.id ? '2px solid' : 'none',
        borderColor: 'primary.main'
      }}
      onClick={() => {
        setSelectedZone(zone.id);
        onZoneSelect(zone.id);
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6">{zone.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {zone.area} • {zone.crop}
            </Typography>
          </Box>
          <Chip 
            label={`${zone.health}% Health`}
            color={zone.health > 80 ? 'success' : zone.health > 60 ? 'warning' : 'error'}
          />
        </Box>

        <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2} mb={2}>
          <Box textAlign="center">
            <Typography variant="h6">{zone.soil_moisture}%</Typography>
            <Typography variant="caption" color="text.secondary">
              Moisture
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6">{zone.temperature}°C</Typography>
            <Typography variant="caption" color="text.secondary">
              Temp
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h6">{zone.ph}</Typography>
            <Typography variant="caption" color="text.secondary">
              pH
            </Typography>
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button
            startIcon={zone.irrigation_active ? <Stop /> : <PlayArrow />}
            variant={zone.irrigation_active ? "contained" : "outlined"}
            color={zone.irrigation_active ? "error" : "primary"}
            size="small"
          >
            {zone.irrigation_active ? 'Stop' : 'Start'} Irrigation
          </Button>
          <Typography variant="caption" color="text.secondary">
            Last: {new Date(zone.last_irrigation).toLocaleDateString()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Alerts Section */}
      {sensorData.some((s: any) => (s.type === 'soil_moisture' && s.value < 25) || (s.type === 'temperature' && s.value > 35)) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6">🚨 Active Alerts</Typography>
          {sensorData
            .filter((s: any) => (s.type === 'soil_moisture' && s.value < 25) || (s.type === 'temperature' && s.value > 35))
            .map((s: any) => (
              <Typography key={s.sensor_id} variant="body2">
                • {s.sensor_id}: {s.type === 'soil_moisture' ? 'Low soil moisture' : 'High temperature'} ({s.value}{s.unit})
              </Typography>
            ))
          }
        </Alert>
      )}

      {/* Live Sensor Data */}
      <Typography variant="h5" gutterBottom display="flex" alignItems="center">
        📡 Live Sensor Data
        <Chip label={`${sensorData.length} readings`} color="primary" size="small" sx={{ ml: 2 }} />
      </Typography>

      <Box display="grid" gridTemplateColumns={fullView ? "repeat(auto-fit, minmax(300px, 1fr))" : "repeat(auto-fit, minmax(350px, 1fr))"} gap={3} mb={4}>
        {sensorData.slice(-6).map((sensor, index) => (
          <Box key={`${sensor.sensor_id}-${index}`}>
            <SensorCard sensor={sensor} />
          </Box>
        ))}
      </Box>

      {/* Farm Zones */}
      {farmData.zones && (
        <>
          <Typography variant="h5" gutterBottom display="flex" alignItems="center">
            🌾 Farm Zones
            <Chip label={`${farmData.zones.length} zones`} color="secondary" size="small" sx={{ ml: 2 }} />
          </Typography>

          <Box display="grid" gridTemplateColumns={fullView ? "repeat(auto-fit, minmax(300px, 1fr))" : "repeat(auto-fit, minmax(350px, 1fr))"} gap={3} mb={4}>
            {farmData.zones.map((zone: any) => (
              <Box key={zone.id}>
                <ZoneCard zone={zone} />
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* Charts Section */}
      {chartData.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom>
            📈 Real-Time Analytics
          </Typography>
          
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Soil Moisture Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area 
                      type="monotone" 
                      dataKey="soil_moisture" 
                      stroke="#2e7d32" 
                      fill="#4caf50" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Temperature & Humidity
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#ff5722" 
                      strokeWidth={3}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="humidity" 
                      stroke="#2196f3" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
