import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface SensorData {
  sensor_id: string;
  type: string;
  zone: string;
  value: number;
  unit: string;
  timestamp: string;
  status: string;
  confidence_score?: number;
}

export interface Zone {
  id: string;
  name: string;
  crop: string;
  area: string;
  health: number;
  soil_moisture: number;
  temperature: number;
  ph: number;
  last_irrigation: string;
  irrigation_active: boolean;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FarmState {
  zones: Zone[];
  sensors: any[];
  recent_readings: SensorData[];
  system_status: string;
  last_updated: string;
}

export const farmAPI = {
  getFarmState: async (): Promise<FarmState> => {
    const response = await api.get('/api/farm-state');
    return response.data;
  },

  sendSensorData: async (data: Partial<SensorData>) => {
    const response = await api.post('/api/sensor-data', data);
    return response.data;
  },

  chatWithAssistant: async (message: string) => {
    const response = await api.post('/api/chat', { message });
    return response.data;
  },

  controlIrrigation: async (zoneId: string, action: 'start' | 'stop') => {
    const response = await api.post('/api/control/irrigation', {
      zone_id: zoneId,
      action
    });
    return response.data;
  },

  getZonePredictions: async (zoneId: string) => {
    const response = await api.get(`/api/predictions/${zoneId}`);
    return response.data;
  },

  getBlockchainHistory: async () => {
    const response = await api.get('/api/blockchain/history');
    return response.data;
  }
};
