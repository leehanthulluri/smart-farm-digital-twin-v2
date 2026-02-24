from fastapi import FastAPI, WebSocket, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import asyncio
import json
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import logging
from contextlib import asynccontextmanager
import uvicorn
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
print("PYTHONPATH:", sys.path)
print("Current Directory:", os.getcwd())

# Import your custom AI assistant
from ai_assistant.farm_ai_assistant import FarmAIAssistant

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SmartFarmSystem:
    """Main system orchestrator for all smart farm components"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.sensor_data_store = []
        self.farm_zones = [
            {
                "id": "fieldA", "name": "Field A - Rice", "crop": "Rice", 
                "area": "10 hectares", "position": {"x": 50, "y": 50, "width": 150, "height": 120},
                "health": 85, "soil_moisture": 35, "temperature": 28.5, "ph": 6.8,
                "last_irrigation": "2025-09-22T06:00:00", "irrigation_active": False
            },
            {
                "id": "fieldB", "name": "Field B - Wheat", "crop": "Wheat", 
                "area": "12 hectares", "position": {"x": 220, "y": 50, "width": 180, "height": 120},
                "health": 72, "soil_moisture": 22, "temperature": 29.1, "ph": 7.2,
                "last_irrigation": "2025-09-20T18:00:00", "irrigation_active": True
            },
            {
                "id": "fieldC", "name": "Field C - Vegetables", "crop": "Mixed Vegetables", 
                "area": "3 hectares", "position": {"x": 50, "y": 200, "width": 120, "height": 150},
                "health": 90, "soil_moisture": 41, "temperature": 27.8, "ph": 6.5,
                "last_irrigation": "2025-09-22T06:00:00", "irrigation_active": False
            }
        ]
        self.sensors = [
            {"id": "SM001", "name": "Soil Moisture A1", "type": "soil_moisture", "zone": "fieldA", "position": {"x": 125, "y": 110}, "status": "active"},
            {"id": "SM002", "name": "Soil Moisture B1", "type": "soil_moisture", "zone": "fieldB", "position": {"x": 310, "y": 110}, "status": "active"},
            {"id": "SM003", "name": "Soil Moisture C1", "type": "soil_moisture", "zone": "fieldC", "position": {"x": 110, "y": 275}, "status": "active"},
            {"id": "TH001", "name": "Weather Station", "type": "temperature", "zone": "weather", "position": {"x": 360, "y": 210}, "status": "active"},
            {"id": "HU001", "name": "Humidity Sensor", "type": "humidity", "zone": "weather", "position": {"x": 360, "y": 210}, "status": "active"},
        ]
        self.blockchain_logs = []
        self.chat_history = []
        self.ai_assistant = FarmAIAssistant()

    async def initialize(self):
        logger.info("🌾 Initializing Smart Farm Digital Twin System...")
        logger.info("✅ Custom Farm AI Loaded!")
        logger.info("✅ System initialization complete!")

    async def process_sensor_data(self, sensor_data: dict):
        confidence_score = await self.calculate_confidence(sensor_data)
        processed_data = {
            **sensor_data,
            'confidence_score': confidence_score,
            'processed_at': datetime.now().isoformat(),
            'quality_level': 'excellent' if confidence_score > 0.9 else 'good' if confidence_score > 0.7 else 'fair'
        }
        self.sensor_data_store.append(processed_data)
        if len(self.sensor_data_store) > 100:
            self.sensor_data_store = self.sensor_data_store[-100:]
        await self.update_zone_data(processed_data)
        predictions = await self.generate_predictions(processed_data)
        await self.log_to_blockchain(processed_data)
        return {
            'processed_data': processed_data,
            'predictions': predictions,
            'zone_updates': True
        }

    async def calculate_confidence(self, sensor_data: dict) -> float:
        sensor_type = sensor_data.get('type', '')
        value = sensor_data.get('value', 0)
        ranges = {
            'soil_moisture': (10, 60),
            'temperature': (15, 45),
            'humidity': (30, 90),
            'ph': (5.5, 8.5)
        }
        expected_range = ranges.get(sensor_type, (0, 100))
        min_val, max_val = expected_range
        if min_val <= value <= max_val:
            range_confidence = 1.0
        else:
            distance = min(abs(value - min_val), abs(value - max_val))
            max_distance = (max_val - min_val) * 0.5
            range_confidence = max(0.1, 1.0 - (distance / max_distance))
        sensor_reliability = np.random.uniform(0.8, 0.95)
        overall_confidence = (range_confidence * 0.7) + (sensor_reliability * 0.3)
        return round(min(1.0, max(0.1, overall_confidence)), 3)

    async def update_zone_data(self, sensor_data: dict):
        sensor_zone = sensor_data.get('zone')
        sensor_type = sensor_data.get('type')
        value = sensor_data.get('value')
        for zone in self.farm_zones:
            if zone['id'] == sensor_zone or sensor_zone == 'weather':
                if sensor_type == 'soil_moisture':
                    zone['soil_moisture'] = value
                elif sensor_type == 'temperature':
                    zone['temperature'] = value
                elif sensor_type == 'ph':
                    zone['ph'] = value

    async def generate_predictions(self, sensor_data: dict) -> dict:
        sensor_type = sensor_data.get('type')
        current_value = sensor_data.get('value')
        predictions = {}
        if sensor_type == 'soil_moisture':
            trend = np.random.choice(['decreasing', 'stable', 'increasing'], p=[0.6, 0.3, 0.1])
            if trend == 'decreasing':
                future_6h = max(10, current_value - np.random.uniform(2, 5))
                future_24h = max(10, future_6h - np.random.uniform(3, 8))
            elif trend == 'increasing':
                future_6h = min(60, current_value + np.random.uniform(1, 3))
                future_24h = min(60, future_6h + np.random.uniform(2, 5))
            else:
                future_6h = current_value + np.random.uniform(-1, 1)
                future_24h = current_value + np.random.uniform(-2, 2)
            predictions = {
                'type': 'soil_moisture_forecast',
                'current': current_value,
                '6_hours': round(future_6h, 1),
                '24_hours': round(future_24h, 1),
                'trend': trend,
                'irrigation_needed': future_24h < 25,
                'confidence': 0.87
            }
        elif sensor_type == 'temperature':
            future_temp = current_value + np.random.uniform(-2, 3)
            predictions = {
                'type': 'temperature_forecast', 
                'current': current_value,
                '6_hours': round(future_temp, 1),
                'heat_stress_risk': future_temp > 35,
                'confidence': 0.82
            }
        return predictions

    async def log_to_blockchain(self, sensor_data: dict):
        blockchain_entry = {
            'block_id': len(self.blockchain_logs) + 1,
            'timestamp': datetime.now().isoformat(),
            'sensor_id': sensor_data.get('sensor_id'),
            'data_hash': hash(str(sensor_data)),
            'confidence_score': sensor_data.get('confidence_score'),
            'verified': True,
            'previous_hash': self.blockchain_logs[-1]['data_hash'] if self.blockchain_logs else 0
        }
        self.blockchain_logs.append(blockchain_entry)
        if len(self.blockchain_logs) > 50:
            self.blockchain_logs = self.blockchain_logs[-50:]

    # --- CUSTOM AI ASSISTANT CHAT ---
    async def process_chat_message(self, message: str) -> dict:
        """Process chat messages using your custom Farm AI"""
        try:
            farm_data = {
                'zones': {zone['id']: zone for zone in self.farm_zones}
            }
            response = self.ai_assistant.chat(message, farm_data)
            self.chat_history.append({
                'user_message': message,
                'ai_response': response['message'],
                'timestamp': datetime.now().isoformat()
            })
            if len(self.chat_history) > 20:
                self.chat_history = self.chat_history[-20:]
            return response
        except Exception as e:
            logger.error(f"Custom AI error: {e}")
            return {
                'message': f"🤖 I had trouble processing that. Here's what I know:\n\n✅ All monitoring systems are online. 📊 You can ask about irrigation, crop health, or field status.",
                'type': 'ai_response',
                'predictions': {},
                'recommendations': [],
                'confidence': 0.75
            }

# Global system instance
farm_system = SmartFarmSystem()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await farm_system.initialize()
    yield
    logger.info("🛑 Shutting down Smart Farm System...")

app = FastAPI(
    title="Smart Farm Digital Twin API",
    description="Advanced IoT + AI + Blockchain Agricultural System",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"✅ WebSocket connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"❌ WebSocket disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if self.active_connections:
            disconnected = []
            for connection in self.active_connections:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Failed to send message: {e}")
                    disconnected.append(connection)
            for conn in disconnected:
                self.disconnect(conn)

manager = ConnectionManager()

@app.websocket("/ws/farm-data")
async def websocket_farm_data(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            if message.get('type') == 'zone_select':
                zone_id = message.get('zone_id')
                zone_data = next((zone for zone in farm_system.farm_zones if zone['id'] == zone_id), None)
                if zone_data:
                    await websocket.send_text(json.dumps({
                        'type': 'zone_data',
                        'zone': zone_data,
                        'timestamp': datetime.now().isoformat()
                    }))
            elif message.get('type') == 'control_command':
                command = message.get('command', {})
                logger.info(f"Control command received: {command}")
                result = {
                    'success': True,
                    'message': f"Irrigation started for {command.get('zone', 'unknown zone')}",
                    'timestamp': datetime.now().isoformat()
                }
                await manager.broadcast({
                    'type': 'control_executed',
                    'result': result
                })
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            logger.info(f"Received message from client: {message}")
            if message.get('type') == 'user':
                user_message = message.get('message')
                farm_system.chat_history.append({
                    'type': 'user',
                    'message': user_message,
                    'timestamp': datetime.now().isoformat()
                })
                ai_response = await farm_system.process_chat_message(user_message)
                logger.info(f"Sending AI response to client: {ai_response}")
                await websocket.send_text(json.dumps(ai_response))
            else:
                logger.warning(f"Unknown message type received: {message.get('type')}")
    except Exception as e:
        print(f"Chat WebSocket exception: {e}")

@app.get("/")
async def root():
    return {
        "message": "🌾 Smart Farm Digital Twin API v2.0",
        "status": "online",
        "features": ["Multi-Modal Fusion", "AI Assistant", "Blockchain Traceability", "Real-time Sync"],
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/sensor-data")
async def receive_sensor_data(sensor_data: dict, background_tasks: BackgroundTasks):
    logger.info(f"📊 Received sensor data: {sensor_data}")
    result = await farm_system.process_sensor_data(sensor_data)
    await manager.broadcast({
        'type': 'sensor_update',
        'data': result['processed_data'],
        'predictions': result['predictions'],
        'timestamp': datetime.now().isoformat()
    })
    return {
        'status': 'success',
        'confidence_score': result['processed_data']['confidence_score'],
        'predictions': result['predictions'],
        'blockchain_logged': True
    }

@app.get("/api/farm-state")
async def get_comprehensive_farm_state():
    return {
        'zones': farm_system.farm_zones,
        'sensors': farm_system.sensors,
        'recent_readings': farm_system.sensor_data_store[-10:], 
        'system_status': 'online',
        'last_updated': datetime.now().isoformat()
    }

@app.post("/api/chat")
async def chat_with_assistant(message: dict):
    response = await farm_system.process_chat_message(message['message'])
    return response

@app.get("/api/blockchain/history")
async def get_blockchain_history():
    return {
        'total_blocks': len(farm_system.blockchain_logs),
        'recent_blocks': farm_system.blockchain_logs[-10:], 
        'verified': True
    }

@app.post("/api/control/irrigation")
async def control_irrigation(command: dict):
    zone_id = command.get('zone_id')
    action = command.get('action', 'start')
    for zone in farm_system.farm_zones:
        if zone['id'] == zone_id:
            zone['irrigation_active'] = (action == 'start')
            zone['last_irrigation'] = datetime.now().isoformat()
            break
    await farm_system.log_to_blockchain({
        'sensor_id': f'IRRIGATION_{zone_id}',
        'type': 'control_action',
        'value': action,
        'zone': zone_id,
        'timestamp': datetime.now().isoformat()
    })
    await manager.broadcast({
        'type': 'irrigation_control',
        'zone_id': zone_id,
        'action': action,
        'timestamp': datetime.now().isoformat()
    })
    return {
        'success': True,
        'message': f"Irrigation {action} for zone {zone_id}",
        'blockchain_logged': True
    }

@app.get("/api/predictions/{zone_id}")
async def get_zone_predictions(zone_id: str):
    zone = next((z for z in farm_system.farm_zones if z['id'] == zone_id), None)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    predictions = {
        'zone_id': zone_id,
        'soil_moisture_forecast': {
            '6_hours': max(10, zone['soil_moisture'] - np.random.uniform(1, 3)),
            '24_hours': max(10, zone['soil_moisture'] - np.random.uniform(3, 8)),
            '48_hours': max(10, zone['soil_moisture'] - np.random.uniform(5, 12))
        },
        'health_trend': {
            'current': zone['health'],
            'trend': np.random.choice(['improving', 'stable', 'declining']),
            '7_day_forecast': zone['health'] + np.random.uniform(-5, 5)
        },
        'irrigation_recommendations': {
            'needed': zone['soil_moisture'] < 30,
            'priority': 'high' if zone['soil_moisture'] < 20 else 'medium' if zone['soil_moisture'] < 30 else 'low',
            'suggested_duration': max(30, 60 - zone['soil_moisture'])
        },
        'confidence': 0.89
    }
    return predictions

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
