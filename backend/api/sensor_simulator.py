import asyncio
import json
import random
import aiohttp
from datetime import datetime
import time
import logging
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedSensorSimulator:
    """Advanced sensor simulator with realistic agricultural data patterns"""
    
    def __init__(self, api_url="http://localhost:8000"):
        self.api_url = api_url
        
        # Enhanced sensor definitions with realistic patterns
        self.sensors = [
            {
                "id": "SM001", "type": "soil_moisture", "zone": "fieldA", 
                "base_value": 35, "variation": 8, "trend": "decreasing",
                "daily_pattern": "morning_peak", "crop_influence": "rice"
            },
            {
                "id": "SM002", "type": "soil_moisture", "zone": "fieldB", 
                "base_value": 22, "variation": 6, "trend": "stable",
                "daily_pattern": "afternoon_dip", "crop_influence": "wheat"
            },
            {
                "id": "SM003", "type": "soil_moisture", "zone": "fieldC", 
                "base_value": 41, "variation": 5, "trend": "increasing",
                "daily_pattern": "evening_stable", "crop_influence": "vegetables"
            },
            {
                "id": "TH001", "type": "temperature", "zone": "weather", 
                "base_value": 28.5, "variation": 4, "trend": "daily_cycle",
                "daily_pattern": "noon_peak", "crop_influence": "general"
            },
            {
                "id": "HU001", "type": "humidity", "zone": "weather", 
                "base_value": 65, "variation": 10, "trend": "morning_high",
                "daily_pattern": "inverse_temp", "crop_influence": "general"
            },
            {
                "id": "PH001", "type": "ph", "zone": "fieldA", 
                "base_value": 6.8, "variation": 0.3, "trend": "stable",
                "daily_pattern": "minimal_change", "crop_influence": "rice"
            },
            {
                "id": "PH002", "type": "ph", "zone": "fieldB", 
                "base_value": 7.2, "variation": 0.4, "trend": "slight_increase",
                "daily_pattern": "minimal_change", "crop_influence": "wheat"
            }
        ]
        
        self.current_values = {}
        self.reading_count = 0
        self.start_time = time.time()
        
        # Initialize current values
        for sensor in self.sensors:
            self.current_values[sensor["id"]] = sensor["base_value"]

    def generate_realistic_reading(self, sensor: dict) -> float:
        """Generate realistic sensor reading with advanced patterns"""
        
        # Get current time factors
        hour = datetime.now().hour
        minute = datetime.now().minute
        
        # Base value with trend
        base = sensor["base_value"]
        trend_factor = self._apply_trend(sensor["trend"], sensor["id"])
        
        # Daily pattern influence
        daily_factor = self._apply_daily_pattern(sensor["daily_pattern"], hour, minute)
        
        # Crop-specific influence
        crop_factor = self._apply_crop_influence(sensor["crop_influence"], sensor["type"])
        
        # Random variation
        variation = random.uniform(-sensor["variation"]/2, sensor["variation"]/2)
        
        # Calculate new value
        new_value = base + trend_factor + daily_factor + crop_factor + variation
        
        # Apply sensor-specific constraints
        new_value = self._apply_sensor_constraints(sensor["type"], new_value)
        
        # Update stored value for trend continuity
        self.current_values[sensor["id"]] = new_value
        
        return round(new_value, 2)

    def _apply_trend(self, trend: str, sensor_id: str) -> float:
        """Apply trend patterns over time"""
        elapsed_hours = (time.time() - self.start_time) / 3600
        
        if trend == "decreasing":
            return -elapsed_hours * 0.5  # Gradual decrease
        elif trend == "increasing":
            return elapsed_hours * 0.3   # Gradual increase
        elif trend == "daily_cycle":
            return 3 * math.sin(elapsed_hours * math.pi / 12)  # Daily temperature cycle
        else:
            return 0

    def _apply_daily_pattern(self, pattern: str, hour: int, minute: int) -> float:
        """Apply daily pattern influences"""
        time_factor = hour + minute/60
        
        if pattern == "morning_peak":
            # Higher in early morning (irrigation effect)
            return 3 * math.exp(-(time_factor - 6)**2 / 8)
        elif pattern == "afternoon_dip":
            # Lower in afternoon (evaporation)
            return -2 * math.exp(-(time_factor - 14)**2 / 12)
        elif pattern == "noon_peak":
            # Temperature peak at noon
            return 5 * math.exp(-(time_factor - 12)**2 / 8)
        elif pattern == "inverse_temp":
            # Humidity inverse to temperature
            return -3 * math.exp(-(time_factor - 12)**2 / 8)
        else:
            return 0

    def _apply_crop_influence(self, crop: str, sensor_type: str) -> float:
        """Apply crop-specific influences"""
        influences = {
            "rice": {"soil_moisture": 2, "temperature": -0.5},
            "wheat": {"soil_moisture": -1, "temperature": 0.3},
            "vegetables": {"soil_moisture": 1.5, "ph": -0.1}
        }
        
        crop_data = influences.get(crop, {})
        return crop_data.get(sensor_type, 0)

    def _apply_sensor_constraints(self, sensor_type: str, value: float) -> float:
        """Apply realistic sensor constraints"""
        constraints = {
            "soil_moisture": (5, 65),
            "temperature": (10, 50),
            "humidity": (20, 95),
            "ph": (5.0, 9.0)
        }
        
        if sensor_type in constraints:
            min_val, max_val = constraints[sensor_type]
            return max(min_val, min(max_val, value))
        
        return value

    async def send_sensor_data(self, session, reading):
        """Send sensor data to API with error handling"""
        try:
            async with session.post(f"{self.api_url}/api/sensor-data", json=reading, timeout=5) as response:
                if response.status == 200:
                    result = await response.json()
                    confidence = result.get('confidence_score', 0)
                    logger.info(f"✅ {reading['sensor_id']}: {reading['value']}{reading.get('unit', '')} (confidence: {confidence})")
                else:
                    logger.warning(f"⚠️ API returned status {response.status}")
        except asyncio.TimeoutError:
            logger.error(f"⏱️ Timeout sending data for {reading['sensor_id']}")
        except Exception as e:
            logger.error(f"❌ Error sending data: {e}")

    def generate_weather_events(self):
        """Randomly generate weather events"""
        events = []
        
        # 5% chance of rain event
        if random.random() < 0.05:
            events.append({
                "type": "rain_forecast",
                "intensity": random.choice(["light", "moderate", "heavy"]),
                "duration": random.randint(2, 8),
                "probability": random.randint(60, 95)
            })
        
        # 3% chance of temperature alert
        if random.random() < 0.03:
            events.append({
                "type": "temperature_alert",
                "condition": random.choice(["heat_wave", "cold_snap"]),
                "severity": random.choice(["moderate", "high"])
            })
        
        return events

    async def simulate_sensors(self):
        """Main simulation loop with enhanced features"""
        logger.info("🌾 Starting Advanced Smart Farm Sensor Simulator...")
        logger.info("📡 Sending realistic agricultural data every 3 seconds")
        logger.info("🎯 Features: Confidence scoring, trend analysis, crop patterns")
        logger.info("🔥 Press Ctrl+C to stop")
        
        async with aiohttp.ClientSession() as session:
            while True:
                try:
                    # Generate sensor readings
                    readings = []
                    
                    for sensor in self.sensors:
                        unit_map = {
                            "soil_moisture": "%",
                            "humidity": "%", 
                            "temperature": "°C",
                            "ph": "pH"
                        }
                        
                        reading = {
                            "sensor_id": sensor["id"],
                            "type": sensor["type"],
                            "zone": sensor["zone"],
                            "value": self.generate_realistic_reading(sensor),
                            "unit": unit_map.get(sensor["type"], ""),
                            "timestamp": datetime.now().isoformat(),
                            "status": "normal",
                            "location": {
                                "latitude": 12.9716 + random.uniform(-0.01, 0.01),
                                "longitude": 77.5946 + random.uniform(-0.01, 0.01)
                            }
                        }
                        
                        readings.append(reading)
                    
                    # Send all readings
                    send_tasks = [self.send_sensor_data(session, reading) for reading in readings]
                    await asyncio.gather(*send_tasks, return_exceptions=True)
                    
                    # Generate occasional weather events
                    weather_events = self.generate_weather_events()
                    for event in weather_events:
                        logger.info(f"🌦️ Weather Event: {event}")
                    
                    self.reading_count += len(readings)
                    
                    # Status update every 10 cycles
                    if self.reading_count % 70 == 0:  # Every ~30 seconds
                        logger.info(f"📊 Status: {self.reading_count} readings sent, {len(self.sensors)} sensors active")
                    
                    print("-" * 80)
                    await asyncio.sleep(3)  # Send data every 3 seconds
                    
                except KeyboardInterrupt:
                    logger.info("🛑 Simulator stopped by user")
                    break
                except Exception as e:
                    logger.error(f"💥 Simulation error: {e}")
                    await asyncio.sleep(5)  # Wait before retrying

if __name__ == "__main__":
    simulator = AdvancedSensorSimulator()
    try:
        asyncio.run(simulator.simulate_sensors())
    except KeyboardInterrupt:
        print("\n🌾 Smart Farm Sensor Simulator stopped")
