import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, Typography, Box, Button, Chip, LinearProgress, IconButton, Divider } from '@mui/material';
import { 
  ZoomIn, ZoomOut, CenterFocusStrong, Visibility, VisibilityOff, 
  ThreeDRotation, WbSunny, Terrain, Sensors, LocalFlorist, WaterDrop, Thermostat
} from '@mui/icons-material';

interface VisualTwinProps {
  farmData: any;
  sensorData: any[];
  onZoneClick?: (zoneId: string) => void;
  fullScreen?: boolean;
}

const VisualTwin: React.FC<VisualTwinProps> = ({ 
  farmData, 
  sensorData, 
  onZoneClick,
  fullScreen = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const zoneHitAreasRef = useRef<Map<string, {x: number, y: number, corners: {x: number, y: number}[]}>>(new Map());
  
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 100, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showSensors, setShowSensors] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Convert 2D coords to isometric 3D
  const toIsometric = useCallback((x: number, y: number, z: number = 0) => {
    const isoX = (x - y) * Math.cos(Math.PI / 6);
    const isoY = (x + y) * Math.sin(Math.PI / 6) - z;
    return { x: isoX, y: isoY };
  }, []);

  // Check if point is inside polygon
  const isPointInPolygon = useCallback((point: {x: number, y: number}, polygon: {x: number, y: number}[]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }, []);

  // Draw beautiful clear sky with sun
  const drawSky = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.4, '#B0E0E6');
    skyGradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    
    const sunX = width * 0.85;
    const sunY = height * 0.15;
    const sunRadius = 50;
    
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
    sunGlow.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
    sunGlow.addColorStop(0.5, 'rgba(255, 255, 150, 0.3)');
    sunGlow.addColorStop(1, 'rgba(255, 255, 100, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
    ctx.fill();
    
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
    sunGradient.addColorStop(0, '#FFFF00');
    sunGradient.addColorStop(0.7, '#FFD700');
    sunGradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    
    const drawCloud = (x: number, y: number, scale: number, time: number) => {
      const offsetX = Math.sin(time * 0.0003 + x * 0.01) * 20;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowColor = 'rgba(200, 200, 200, 0.3)';
      ctx.shadowBlur = 15;
      
      ctx.beginPath();
      ctx.arc(x + offsetX, y, 30 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 40 * scale + offsetX, y, 35 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 75 * scale + offsetX, y, 30 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 50 * scale + offsetX, y - 20 * scale, 25 * scale, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
    };
    
    drawCloud(100, 100, 0.8, currentTime);
    drawCloud(400, 80, 1, currentTime);
    drawCloud(700, 120, 0.9, currentTime);
  }, [currentTime]);

  // Draw 3D ground
  const drawGround = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height * 0.7;
    const groundSize = 400;
    
    const corners = [
      toIsometric(-groundSize, -groundSize, 0),
      toIsometric(groundSize, -groundSize, 0),
      toIsometric(groundSize, groundSize, 0),
      toIsometric(-groundSize, groundSize, 0)
    ];
    
    ctx.save();
    ctx.translate(centerX, centerY);
    
    const groundGradient = ctx.createLinearGradient(0, -200, 0, 200);
    groundGradient.addColorStop(0, '#7CBA3B');
    groundGradient.addColorStop(0.5, '#6BA32E');
    groundGradient.addColorStop(1, '#5A9125');
    
    ctx.fillStyle = groundGradient;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    corners.forEach(corner => ctx.lineTo(corner.x, corner.y));
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(90, 145, 37, 0.3)';
    ctx.lineWidth = 1;
    
    for (let i = -groundSize; i <= groundSize; i += 50) {
      const start1 = toIsometric(i, -groundSize, 0);
      const end1 = toIsometric(i, groundSize, 0);
      ctx.beginPath();
      ctx.moveTo(start1.x, start1.y);
      ctx.lineTo(end1.x, end1.y);
      ctx.stroke();
      
      const start2 = toIsometric(-groundSize, i, 0);
      const end2 = toIsometric(groundSize, i, 0);
      ctx.beginPath();
      ctx.moveTo(start2.x, start2.y);
      ctx.lineTo(end2.x, end2.y);
      ctx.stroke();
    }
    
    ctx.restore();
  }, [toIsometric]);

  // Draw 3D zone with click area recording
  const draw3DZone = useCallback((ctx: CanvasRenderingContext2D, zone: any, centerX: number, centerY: number) => {
    const { x: baseX, y: baseY, width, height } = zone.position;
    const zoneHeight = 30;
    const isSelected = selectedZone === zone.id;
    const isHovered = hoveredZone === zone.id;
    
    const scale = 0.8;
    const x = (baseX - 400) * scale;
    const y = (baseY - 300) * scale;
    const w = width * scale;
    const h = height * scale;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    
    const moistureRatio = zone.soil_moisture / 60;
    const healthRatio = zone.health / 100;
    
    const topColor = `rgb(${Math.floor(60 + 100 * moistureRatio)}, ${Math.floor(150 + 50 * healthRatio)}, ${Math.floor(50 + 30 * moistureRatio)})`;
    const sideColor = `rgb(${Math.floor(40 + 80 * moistureRatio)}, ${Math.floor(120 + 40 * healthRatio)}, ${Math.floor(30 + 20 * moistureRatio)})`;
    
    // Front face
    const frontCorners = [
      toIsometric(x, y + h, 0),
      toIsometric(x + w, y + h, 0),
      toIsometric(x + w, y + h, zoneHeight),
      toIsometric(x, y + h, zoneHeight)
    ];
    
    ctx.fillStyle = sideColor;
    ctx.beginPath();
    ctx.moveTo(frontCorners[0].x, frontCorners[0].y);
    frontCorners.forEach(corner => ctx.lineTo(corner.x, corner.y));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.stroke();
    
    // Right face
    const rightCorners = [
      toIsometric(x + w, y, 0),
      toIsometric(x + w, y + h, 0),
      toIsometric(x + w, y + h, zoneHeight),
      toIsometric(x + w, y, zoneHeight)
    ];
    
    const rightGradient = ctx.createLinearGradient(
      rightCorners[0].x, rightCorners[0].y,
      rightCorners[2].x, rightCorners[2].y
    );
    rightGradient.addColorStop(0, sideColor);
    rightGradient.addColorStop(1, topColor);
    
    ctx.fillStyle = rightGradient;
    ctx.beginPath();
    ctx.moveTo(rightCorners[0].x, rightCorners[0].y);
    rightCorners.forEach(corner => ctx.lineTo(corner.x, corner.y));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
    // Top face - STORE CORNERS FOR CLICK DETECTION
    const topCorners = [
      toIsometric(x, y, zoneHeight),
      toIsometric(x + w, y, zoneHeight),
      toIsometric(x + w, y + h, zoneHeight),
      toIsometric(x, y + h, zoneHeight)
    ];
    
    // Store hit area with absolute coordinates
    const absoluteCorners = topCorners.map(corner => ({
      x: corner.x + centerX,
      y: corner.y + centerY
    }));
    zoneHitAreasRef.current.set(zone.id, {
      x: centerX,
      y: centerY,
      corners: absoluteCorners
    });
    
    const topGradient = ctx.createRadialGradient(
      (topCorners[0].x + topCorners[2].x) / 2,
      (topCorners[0].y + topCorners[2].y) / 2,
      0,
      (topCorners[0].x + topCorners[2].x) / 2,
      (topCorners[0].y + topCorners[2].y) / 2,
      Math.max(w, h)
    );
    topGradient.addColorStop(0, topColor);
    topGradient.addColorStop(1, sideColor);
    
    ctx.fillStyle = topGradient;
    ctx.beginPath();
    ctx.moveTo(topCorners[0].x, topCorners[0].y);
    topCorners.forEach(corner => ctx.lineTo(corner.x, corner.y));
    ctx.closePath();
    ctx.fill();
    
    if (isSelected || isHovered) {
      ctx.strokeStyle = isSelected ? '#FFD700' : '#FFA500';
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.shadowColor = isSelected ? '#FFD700' : '#FFA500';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    // Animated crop rows
    const time = currentTime * 0.001;
    for (let i = 0; i < w; i += 15) {
      const wave = Math.sin(time * 2 + i * 0.1) * 2;
      const rowStart = toIsometric(x + i, y, zoneHeight + wave);
      const rowEnd = toIsometric(x + i, y + h, zoneHeight + wave);
      
      ctx.strokeStyle = `rgba(100, 180, 50, 0.6)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rowStart.x, rowStart.y);
      ctx.lineTo(rowEnd.x, rowEnd.y);
      ctx.stroke();
    }
    
    if (showLabels) {
      const labelPos = toIsometric(x + w / 2, y + h / 2, zoneHeight + 20);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(labelPos.x - 60, labelPos.y - 25, 120, 50);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(zone.name, labelPos.x, labelPos.y - 10);
      
      ctx.font = '10px Arial';
      ctx.fillText(`💧${zone.soil_moisture}% | 🌡️${zone.temperature}°C`, labelPos.x, labelPos.y + 5);
      ctx.fillText(`📊${zone.health}% | pH${zone.ph}`, labelPos.x, labelPos.y + 18);
    }
    
    ctx.restore();
  }, [toIsometric, selectedZone, hoveredZone, showLabels, currentTime]);

  // Draw 3D sensor
  const draw3DSensor = useCallback((ctx: CanvasRenderingContext2D, sensor: any, centerX: number, centerY: number) => {
    const sensorPositions: Record<string, { x: number; y: number }> = {
      'SM001': { x: 125, y: 110 },
      'SM002': { x: 310, y: 110 },
      'SM003': { x: 110, y: 275 },
      'TH001': { x: 360, y: 210 },
      'HU001': { x: 380, y: 230 }
    };
    
    const pos = sensorPositions[sensor.sensor_id];
    if (!pos) return;
    
    const scale = 0.8;
    const x = (pos.x - 400) * scale;
    const y = (pos.y - 300) * scale;
    const sensorHeight = 40;
    const radius = 8;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    
    const isActive = sensor.status === 'normal';
    const color = isActive ? '#00FF00' : sensor.status === 'warning' ? '#FFA500' : '#FF0000';
    
    const poleBase = toIsometric(x, y, 0);
    const poleTop = toIsometric(x, y, sensorHeight);
    
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(poleBase.x, poleBase.y);
    ctx.lineTo(poleTop.x, poleTop.y);
    ctx.stroke();
    
    const time = currentTime * 0.003;
    const pulse = Math.sin(time) * 0.3 + 0.7;
    const glowRadius = radius * (1 + pulse);
    
    const glow = ctx.createRadialGradient(poleTop.x, poleTop.y, 0, poleTop.x, poleTop.y, glowRadius * 3);
    glow.addColorStop(0, color);
    glow.addColorStop(0.5, color + '66');
    glow.addColorStop(1, color + '00');
    
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(poleTop.x, poleTop.y, glowRadius * 3, 0, Math.PI * 2);
    ctx.fill();
    
    const sensorGradient = ctx.createRadialGradient(
      poleTop.x - 3, poleTop.y - 3, 0,
      poleTop.x, poleTop.y, radius
    );
    sensorGradient.addColorStop(0, '#FFFFFF');
    sensorGradient.addColorStop(0.4, color);
    sensorGradient.addColorStop(1, color + 'CC');
    
    ctx.fillStyle = sensorGradient;
    ctx.beginPath();
    ctx.arc(poleTop.x, poleTop.y, radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    if (showLabels) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(poleTop.x - 30, poleTop.y - 35, 60, 20);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(sensor.sensor_id, poleTop.x, poleTop.y - 23);
    }
    
    ctx.restore();
  }, [toIsometric, showLabels, currentTime]);

  // Main render
  const renderScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);
    
    drawSky(ctx, width, height);
    drawGround(ctx, width, height);
    
    const centerX = width / 2;
    const centerY = height * 0.7;
    
    if (farmData.zones) {
      farmData.zones.forEach((zone: any) => {
        draw3DZone(ctx, zone, centerX, centerY);
      });
    }
    
    if (showSensors && sensorData.length > 0) {
      sensorData.forEach((sensor: any) => {
        draw3DSensor(ctx, sensor, centerX, centerY);
      });
    }
    
    ctx.restore();
  }, [farmData, sensorData, zoomLevel, panOffset, showSensors, showLabels, currentTime, drawSky, drawGround, draw3DZone, draw3DSensor]);

  // Animation loop
  useEffect(() => {
    let frame = 0;
    const animate = () => {
      frame++;
      setCurrentTime(frame);
      renderScene();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderScene]);

  // Mouse handlers with click detection
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset(prev => ({
        x: prev.x + (e.clientX - dragStart.x),
        y: prev.y + (e.clientY - dragStart.y)
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      // Check hover
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
      
      // Apply transformations
      const adjustedX = (mouseX - panOffset.x) / zoomLevel;
      const adjustedY = (mouseY - panOffset.y) / zoomLevel;
      
      let found = null;
      zoneHitAreasRef.current.forEach((hitArea, zoneId) => {
        if (isPointInPolygon({x: adjustedX, y: adjustedY}, hitArea.corners)) {
          found = zoneId;
        }
      });
      
      setHoveredZone(found);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const adjustedX = (mouseX - panOffset.x) / zoomLevel;
    const adjustedY = (mouseY - panOffset.y) / zoomLevel;
    
    zoneHitAreasRef.current.forEach((hitArea, zoneId) => {
      if (isPointInPolygon({x: adjustedX, y: adjustedY}, hitArea.corners)) {
        setSelectedZone(zoneId);
        onZoneClick?.(zoneId);
      }
    });
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoomLevel(prev => Math.max(0.5, Math.min(2, prev * (e.deltaY > 0 ? 0.9 : 1.1))));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 100, y: 50 });
    setSelectedZone(null);
  };

  // Get selected zone data
  const selectedZoneData = selectedZone && farmData.zones 
    ? farmData.zones.find((z: any) => z.id === selectedZone)
    : null;

  return (
    <Box>
      {/* Controls */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={2} 
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: 2,
          borderRadius: 2,
          color: 'white',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
        }}
      >
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
          <ThreeDRotation sx={{ fontSize: 32 }} />
          3D Farm Digital Twin
          <Chip 
            icon={<WbSunny />}
            label="Clear Day"
            size="small"
            sx={{ ml: 2, bgcolor: 'rgba(255,255,255,0.3)', color: 'white', fontWeight: 600 }}
          />
        </Typography>
        
        <Box display="flex" gap={1}>
          <IconButton 
            onClick={() => setShowLabels(!showLabels)}
            sx={{ color: 'white', bgcolor: showLabels ? 'rgba(255,255,255,0.2)' : 'transparent' }}
          >
            {showLabels ? <Visibility /> : <VisibilityOff />}
          </IconButton>
          <IconButton 
            onClick={() => setShowSensors(!showSensors)}
            sx={{ color: 'white', bgcolor: showSensors ? 'rgba(255,255,255,0.2)' : 'transparent' }}
          >
            <Sensors />
          </IconButton>
          <IconButton onClick={() => setZoomLevel(prev => Math.min(prev * 1.2, 2))} sx={{ color: 'white' }}>
            <ZoomIn />
          </IconButton>
          <IconButton onClick={() => setZoomLevel(prev => Math.max(prev / 1.2, 0.5))} sx={{ color: 'white' }}>
            <ZoomOut />
          </IconButton>
          <IconButton onClick={handleReset} sx={{ color: 'white' }}>
            <CenterFocusStrong />
          </IconButton>
        </Box>
      </Box>

      {/* Canvas */}
      <Card elevation={6} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={fullScreen ? 1200 : 1000}
          height={fullScreen ? 900 : 700}
          style={{
            width: '100%',
            cursor: isDragging ? 'grabbing' : hoveredZone ? 'pointer' : 'grab',
            display: 'block',
            background: 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleClick}
          onWheel={handleWheel}
        />
      </Card>

      {/* Selected Zone Details */}
      {selectedZoneData && (
        <Card elevation={4} sx={{ mt: 3, background: 'linear-gradient(135deg, #667eea11 0%, #764ba211 100%)' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ color: '#667eea', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalFlorist />
              {selectedZoneData.name} - Detailed View
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
              {/* Health Status */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalFlorist color="success" />
                  Health Status
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={selectedZoneData.health} 
                  color={selectedZoneData.health > 80 ? 'success' : selectedZoneData.health > 60 ? 'warning' : 'error'}
                  sx={{ height: 12, borderRadius: 6, mb: 1 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedZoneData.health}%</Typography>
              </Box>
              
              {/* Soil Moisture */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WaterDrop color="info" />
                  Soil Moisture
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={selectedZoneData.soil_moisture} 
                  color={selectedZoneData.soil_moisture > 40 ? 'success' : selectedZoneData.soil_moisture > 25 ? 'warning' : 'error'}
                  sx={{ height: 12, borderRadius: 6, mb: 1 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedZoneData.soil_moisture}%</Typography>
              </Box>
            </Box>
            
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap={2} mt={3}>
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Thermostat color="error" />
                <Typography variant="caption" display="block" color="text.secondary">Temperature</Typography>
                <Typography variant="h6" fontWeight={700}>{selectedZoneData.temperature}°C</Typography>
              </Box>
              
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Typography variant="caption" display="block" color="text.secondary">pH Level</Typography>
                <Typography variant="h6" fontWeight={700}>{selectedZoneData.ph}</Typography>
              </Box>
              
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Typography variant="caption" display="block" color="text.secondary">Crop Type</Typography>
                <Typography variant="h6" fontWeight={700}>{selectedZoneData.crop}</Typography>
              </Box>
              
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Typography variant="caption" display="block" color="text.secondary">Area</Typography>
                <Typography variant="h6" fontWeight={700}>{selectedZoneData.area}</Typography>
              </Box>
            </Box>
            
            <Box mt={2}>
              <Chip 
                label={selectedZoneData.irrigation_active ? '💧 IRRIGATION ACTIVE' : '💧 IRRIGATION OFF'}
                color={selectedZoneData.irrigation_active ? 'success' : 'default'}
                sx={{ fontWeight: 700 }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Info Stats */}
      <Box display="flex" gap={2} mt={2} justifyContent="center" flexWrap="wrap">
        <Chip 
          icon={<Terrain />}
          label={`Zoom: ${Math.round(zoomLevel * 100)}%`} 
          color="primary" 
          sx={{ fontWeight: 600 }}
        />
        <Chip 
          icon={<Sensors />}
          label={`${sensorData.length} Sensors`} 
          color="success" 
          sx={{ fontWeight: 600 }}
        />
        {selectedZone && (
          <Chip 
            label={`Selected: ${selectedZone}`} 
            color="warning" 
            sx={{ fontWeight: 600 }}
            onDelete={() => setSelectedZone(null)}
          />
        )}
        {hoveredZone && (
          <Chip 
            label={`Hover: ${hoveredZone}`} 
            color="info" 
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>
    </Box>
  );
};

export default VisualTwin;
