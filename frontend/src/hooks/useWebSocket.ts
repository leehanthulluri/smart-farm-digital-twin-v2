﻿import { useEffect, useState } from 'react';

interface SensorUpdate {
  sensor_id: string;
  type: string;
  zone: string;
  value: number;
  unit: string;
  timestamp: string;
  status: string;
  confidence_score?: number;
}

interface ChatMessage {
  type: 'user' | 'ai';
  message: string;
  timestamp: string;
  predictions?: any;
  recommendations?: any[];
}

export const useWebSocket = (baseUrl: string) => {
  const [sensorData, setSensorData] = useState<SensorUpdate[]>([]);
  const [connected, setConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [farmDataWs, setFarmDataWs] = useState<WebSocket | null>(null);
  const [chatWs, setChatWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Farm data WebSocket for sensor data
    const farmWs = new WebSocket(`ws://${window.location.hostname}:8000/ws/farm-data`);
    
    farmWs.onopen = () => {
      setConnected(true);
      console.log('🟢 Farm data WebSocket connected');
    };

    farmWs.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📊 Sensor data received:', message);
        
        if (message.type === 'sensor_update' && message.data) {
          setSensorData(prev => {
            // Remove old reading from same sensor
            const filtered = prev.filter(d => d.sensor_id !== message.data.sensor_id);
            // Add new reading and keep last 50
            return [...filtered, message.data].slice(-50);
          });
        }
      } catch (error) {
        console.error('Error parsing farm WebSocket message:', error);
      }
    };

    farmWs.onclose = () => {
      setConnected(false);
      console.log('🔴 Farm data WebSocket disconnected');
    };

    farmWs.onerror = (error) => {
      console.error('Farm WebSocket error:', error);
      setConnected(false);
    };

    setFarmDataWs(farmWs);

    return () => {
      farmWs.close();
    };
  }, [baseUrl]);

  useEffect(() => {
    // Chat WebSocket
    const chatSocket = new WebSocket(`ws://${window.location.hostname}:8000/ws/chat`);
    
    chatSocket.onopen = () => {
      console.log('🟢 Chat WebSocket connected')
    };

    chatSocket.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        console.log('💬 Chat response received:', response);
        if (response.message) {
          setChatMessages(prev => [...prev, {
            type: 'ai',
            message: response.message,
            timestamp: new Date().toISOString(),
            predictions: response.predictions,
            recommendations: response.recommendations
          }]);
        }
      } catch (error) {
        console.error('Error parsing chat WebSocket message:', error);
      }
    };

    setChatWs(chatSocket);

    return () => {
      chatSocket.close();
    };

  }, [baseUrl]);

  const sendChatMessage = (message: string) => {
  if (chatWs && chatWs.readyState === WebSocket.OPEN) {
    chatWs.send(JSON.stringify({ type: 'user', message }));
    setChatMessages(prev => [...prev, {
      type: 'user',
      message,
      timestamp: new Date().toISOString()
    }]);
  }
};

  const sendZoneSelection = (zoneId: string) => {
    if (farmDataWs && farmDataWs.readyState === WebSocket.OPEN) {
      farmDataWs.send(JSON.stringify({
        type: 'zone_select',
        zone_id: zoneId
      }));
    }
  };

  const sendControlCommand = (command: any) => {
    if (farmDataWs && farmDataWs.readyState === WebSocket.OPEN) {
      farmDataWs.send(JSON.stringify({
        type: 'control_command',
        command
      }));
    }
  };

  return { 
    sensorData, 
    connected, 
    chatMessages,
    sendChatMessage,
    sendZoneSelection,
    sendControlCommand
  };
};