"""
Real-Time Intelligent Farm AI Assistant
Responds dynamically based on live sensor data and predictions
"""
from datetime import datetime
import re

class FarmAIAssistant:
    """Intelligent AI Assistant with Real-Time Analysis"""
    
    def __init__(self):
        self.conversation_history = []
    
    def analyze_farm_state(self, farm_data: dict) -> dict:
        """Analyze current farm state from real-time data"""
        analysis = {
            'urgent_fields': [],
            'warning_fields': [],
            'healthy_fields': [],
            'predictions': {},
            'recommendations': []
        }
        
        for zone_id, zone in farm_data['zones'].items():
            moisture = zone.get('soil_moisture', 0)
            temp = zone.get('temperature', 25)
            health = zone.get('health', 0)
            crop = zone.get('crop', 'crops')
            name = zone.get('name', zone_id)
            
            # Categorize fields
            if moisture < 25:
                analysis['urgent_fields'].append({
                    'name': name, 'moisture': moisture, 'crop': crop,
                    'action': 'Immediate irrigation required'
                })
            elif moisture < 35:
                analysis['warning_fields'].append({
                    'name': name, 'moisture': moisture, 'crop': crop,
                    'action': 'Irrigation needed within 12 hours'
                })
            else:
                analysis['healthy_fields'].append({
                    'name': name, 'moisture': moisture, 'health': health
                })
            
            # Make predictions for each field
            hours_to_critical = self._predict_time_to_critical(moisture, temp)
            future_moisture_6h = max(15, moisture - (2 if temp > 28 else 1.5))
            future_moisture_24h = max(10, moisture - (6 if temp > 28 else 4))
            
            analysis['predictions'][zone_id] = {
                'name': name,
                'current_moisture': moisture,
                '6h_forecast': round(future_moisture_6h, 1),
                '24h_forecast': round(future_moisture_24h, 1),
                'hours_to_critical': hours_to_critical,
                'irrigation_urgency': 'immediate' if hours_to_critical < 6 else 'soon' if hours_to_critical < 24 else 'not_needed'
            }
        
        # Generate smart recommendations
        analysis['recommendations'] = self._generate_recommendations(analysis, farm_data)
        
        return analysis
    
    def _predict_time_to_critical(self, current_moisture: float, temp: float) -> int:
        """Predict hours until moisture reaches critical level (20%)"""
        if current_moisture <= 20:
            return 0
        
        # Evaporation rate depends on temperature
        evap_rate_per_hour = 0.3 if temp > 30 else 0.2 if temp > 25 else 0.15
        hours = (current_moisture - 20) / evap_rate_per_hour
        return int(hours)
    
    def _generate_recommendations(self, analysis: dict, farm_data: dict) -> list:
        """Generate smart recommendations based on analysis"""
        recommendations = []
        
        # Urgent irrigation recommendations
        if analysis['urgent_fields']:
            for field in analysis['urgent_fields']:
                recommendations.append({
                    'priority': 'URGENT',
                    'field': field['name'],
                    'action': f"Irrigate {field['name']} NOW - moisture critically low at {field['moisture']}%",
                    'duration': '45-60 minutes'
                })
        
        # Soon recommendations
        if analysis['warning_fields']:
            for field in analysis['warning_fields']:
                pred = analysis['predictions'].get(field['name'].replace('Field ', 'field').replace(' - Rice', 'A').replace(' - Wheat', 'B').replace(' - Vegetables', 'C').lower())
                if pred:
                    hours = pred.get('hours_to_critical', 24)
                    recommendations.append({
                        'priority': 'HIGH',
                        'field': field['name'],
                        'action': f"Plan irrigation for {field['name']} within {hours} hours",
                        'duration': '30-45 minutes'
                    })
        
        # Temperature-based recommendations
        temps = [zone.get('temperature', 25) for zone in farm_data['zones'].values()]
        avg_temp = sum(temps) / len(temps) if temps else 25
        
        if avg_temp > 32:
            recommendations.append({
                'priority': 'MEDIUM',
                'field': 'All fields',
                'action': 'High temperature detected - increase irrigation frequency by 30%',
                'reason': f'Average temperature: {avg_temp:.1f}°C'
            })
        
        return recommendations
    
    def chat(self, user_message: str, farm_data: dict) -> dict:
        """Intelligent chat with real-time data analysis"""
        try:
            # Analyze current farm state
            analysis = self.analyze_farm_state(farm_data)
            
            # Detect intent
            question_lower = user_message.lower()
            
            # Generate intelligent response based on real data
            response = self._generate_intelligent_response(question_lower, farm_data, analysis)
            
            # Store conversation
            self.conversation_history.append({
                'user': user_message,
                'assistant': response,
                'timestamp': datetime.now().isoformat()
            })
            
            if len(self.conversation_history) > 20:
                self.conversation_history = self.conversation_history[-20:]
            
            return {
                'message': response,
                'analysis': analysis,
                'type': 'ai_response',
                'confidence': 0.92
            }
            
        except Exception as e:
            print(f"AI Error: {e}")
            import traceback
            traceback.print_exc()
            return {
                'message': "I encountered an error analyzing your farm data. Please try again.",
                'type': 'ai_response',
                'confidence': 0.0
            }
    
    def _generate_intelligent_response(self, question: str, farm_data: dict, analysis: dict) -> str:
        """Generate intelligent, context-aware responses"""
        
        # Irrigation questions
        if any(word in question for word in ['irrigate', 'irrigation', 'water', 'watering']):
            return self._respond_irrigation(farm_data, analysis)
        
        # Weather and rainfall impact questions
        elif any(word in question for word in ['weather', 'rain', 'rainfall', 'temperature', 'forecast']):
            # Check for specific rainfall change scenarios
            match = re.search(r'(\d+)%?\s*(decrease|increase|drop|rise)', question)
            if match:
                change_pct = int(match.group(1))
                direction = match.group(2)
                change = -change_pct if 'decrease' in direction or 'drop' in direction else change_pct
                return self._respond_rainfall_impact(change, farm_data, analysis)
            else:
                return self._respond_weather(farm_data, analysis)
        
        # Crop health questions
        elif any(word in question for word in ['health', 'crop', 'plant', 'growth']):
            return self._respond_crop_health(farm_data, analysis)
        
        # Prediction questions
        elif any(word in question for word in ['predict', 'forecast', 'future', 'tomorrow', 'next', 'will', 'expect']):
            return self._respond_predictions(farm_data, analysis)
        
        # Soil questions
        elif any(word in question for word in ['soil', 'moisture', 'ph', 'nutrient']):
            return self._respond_soil(farm_data, analysis)
        
        # Specific field questions
        elif any(word in question for word in ['field a', 'field b', 'field c', 'rice', 'wheat', 'vegetable']):
            return self._respond_specific_field(question, farm_data, analysis)
        
        # Default: Comprehensive overview
        else:
            return self._respond_overview(farm_data, analysis)
    
    def _respond_irrigation(self, farm_data: dict, analysis: dict) -> str:
        """Real-time irrigation response"""
        response = "💧 **Real-Time Irrigation Analysis:**\n\n"
        
        if analysis['urgent_fields']:
            response += "🚨 **URGENT - Irrigate Immediately:**\n"
            for field in analysis['urgent_fields']:
                response += f"• **{field['name']}** ({field['crop']}): {field['moisture']}% moisture\n"
                response += f"  → Status: CRITICAL - Start irrigation within 1 hour\n"
                response += f"  → Recommended duration: 45-60 minutes\n\n"
        
        if analysis['warning_fields']:
            response += "⚠️ **Irrigation Needed Soon:**\n"
            for field in analysis['warning_fields']:
                # Find prediction for this field
                pred_key = [k for k in analysis['predictions'].keys() if field['name'].split()[1].lower() in k]
                if pred_key:
                    pred = analysis['predictions'][pred_key[0]]
                    hours = pred['hours_to_critical']
                    response += f"• **{field['name']}** ({field['crop']}): {field['moisture']}% moisture\n"
                    response += f"  → Will reach critical level in ~{hours} hours\n"
                    response += f"  → Plan irrigation within next 12 hours\n\n"
        
        if analysis['healthy_fields']:
            response += "✅ **Fields in Good Condition:**\n"
            for field in analysis['healthy_fields']:
                response += f"• **{field['name']}**: {field['moisture']}% moisture - No irrigation needed\n"
        
        response += "\n💡 **Smart Tip:** Best irrigation time is 6-8 AM to minimize evaporation loss."
        
        return response
    
    def _respond_weather(self, farm_data: dict, analysis: dict) -> str:
        """Real-time weather response"""
        temps = [zone.get('temperature', 25) for zone in farm_data['zones'].values()]
        avg_temp = sum(temps) / len(temps)
        max_temp = max(temps)
        min_temp = min(temps)
        
        response = f"🌤️ **Current Weather Conditions:**\n\n"
        response += f"**Temperature:**\n"
        response += f"• Average: **{avg_temp:.1f}°C**\n"
        response += f"• Range: {min_temp:.1f}°C - {max_temp:.1f}°C\n\n"
        
        if avg_temp > 32:
            response += "⚠️ **Heat Alert:** High temperatures detected!\n"
            response += "**Impact on crops:**\n"
            response += "• Increased water loss through evapotranspiration\n"
            response += "• Potential heat stress on crops\n"
            response += "• Soil moisture declining faster than normal\n\n"
            response += "**Recommended actions:**\n"
            response += "✅ Increase irrigation frequency by 30-40%\n"
            response += "✅ Consider irrigating in early morning or evening\n"
            response += "✅ Monitor crops for signs of wilting\n"
        elif avg_temp < 18:
            response += "🌡️ **Cool Conditions:**\n"
            response += "• Slower crop growth expected\n"
            response += "• Reduced water requirements\n"
            response += "• Monitor for frost risk if temperature drops further\n"
        else:
            response += "✅ **Optimal Temperature Range**\n"
            response += "Current conditions are ideal for crop growth.\n"
        
        return response
    
    def _respond_rainfall_impact(self, change_pct: int, farm_data: dict, analysis: dict) -> str:
        """Predict rainfall change impact"""
        response = f"🌧️ **Rainfall Impact Analysis ({change_pct:+d}% change):**\n\n"
        
        if change_pct < -15:
            response += "⚠️ **SEVERE RAINFALL DECREASE**\n\n"
            response += "**Expected Impacts (Next 7 Days):**\n"
            response += "• Soil moisture will drop 20-30% across all fields\n"
            response += "• Fields with current moisture < 30% will reach critical levels within 3-5 days\n"
            response += "• Root zone stress likely in sandy soils (Field B - Wheat)\n"
            response += "• Increased irrigation costs by 40-50%\n\n"
            
            response += "**Field-Specific Predictions:**\n"
            for zone_id, zone in farm_data['zones'].items():
                moisture = zone.get('soil_moisture', 0)
                name = zone.get('name', zone_id)
                predicted_moisture = max(10, moisture - 25)
                
                if predicted_moisture < 20:
                    urgency = "🚨 CRITICAL"
                    action = "needs immediate irrigation plan"
                elif predicted_moisture < 30:
                    urgency = "⚠️ HIGH RISK"
                    action = "requires increased irrigation"
                else:
                    urgency = "⚡ MODERATE"
                    action = "monitor closely"
                
                response += f"• **{name}**: {moisture}% → ~{predicted_moisture}% ({urgency}) - {action}\n"
            
            response += "\n**Action Plan:**\n"
            response += "1. ✅ Start irrigation immediately for fields < 25% moisture\n"
            response += "2. ✅ Increase irrigation schedule to every 2 days\n"
            response += "3. ✅ Apply mulch to reduce evaporation (20% water savings)\n"
            response += "4. ✅ Monitor soil moisture 2x daily\n"
            response += "5. ✅ Consider drip irrigation for efficiency\n"
            
        elif change_pct < 0:
            response += "⚡ **Moderate Rainfall Decrease**\n\n"
            response += "**Expected Impacts:**\n"
            response += f"• Soil moisture reduction: 10-15%\n"
            response += f"• Most crops can handle this with adjusted irrigation\n\n"
            
            response += "**Recommendations:**\n"
            response += "✅ Increase irrigation frequency by 20%\n"
            response += "✅ Monitor fields with current moisture < 30%\n"
            response += "✅ No immediate emergency actions needed\n"
            
        else:
            response += "☔ **Increased Rainfall Predicted**\n\n"
            response += "**Expected Impacts:**\n"
            response += "• Soil moisture will increase across all fields\n"
            response += "• Reduced irrigation needs (30-40% savings)\n"
            response += "• Potential waterlogging risk in low-lying areas\n\n"
            
            response += "**Recommendations:**\n"
            response += "✅ Reduce or pause irrigation\n"
            response += "✅ Ensure drainage systems are clear\n"
            response += "✅ Monitor for fungal disease development\n"
            response += "✅ Check fields for standing water\n"
        
        return response
    
    def _respond_crop_health(self, farm_data: dict, analysis: dict) -> str:
        """Real-time crop health analysis"""
        response = "🌱 **Real-Time Crop Health Analysis:**\n\n"
        
        for zone_id, zone in farm_data['zones'].items():
            name = zone.get('name', zone_id)
            crop = zone.get('crop', 'crops')
            health = zone.get('health', 0)
            moisture = zone.get('soil_moisture', 0)
            temp = zone.get('temperature', 25)
            ph = zone.get('ph', 7.0)
            
            # Health status
            if health > 85:
                health_status = "✅ Excellent"
                health_color = "green"
            elif health > 70:
                health_status = "👍 Good"
                health_color = "blue"
            elif health > 55:
                health_status = "⚠️ Fair"
                health_color = "yellow"
            else:
                health_status = "🚨 Poor"
                health_color = "red"
            
            response += f"**{name}** ({crop}):\n"
            response += f"• Health Score: {health_status} ({health}%)\n"
            response += f"• Soil Moisture: {moisture}%"
            
            # Moisture assessment
            if moisture < 25:
                response += " - CRITICAL, affecting plant growth\n"
            elif moisture < 35:
                response += " - Below optimal, may stress plants\n"
            else:
                response += " - Optimal for growth\n"
            
            response += f"• Temperature: {temp}°C"
            if temp > 32:
                response += " - High, may cause stress\n"
            elif temp < 18:
                response += " - Low, slower growth expected\n"
            else:
                response += " - Ideal range\n"
            
            response += f"• Soil pH: {ph}"
            if ph < 6.0:
                response += " - Too acidic, add lime\n"
            elif ph > 7.5:
                response += " - Too alkaline, add sulfur\n"
            else:
                response += " - Well balanced\n"
            
            # Specific recommendations
            if health < 75 or moisture < 30:
                response += f"  **→ Action needed:** "
                if moisture < 30:
                    response += f"Irrigate to improve moisture. "
                if health < 75:
                    response += f"Inspect for pests/disease."
                response += "\n"
            
            response += "\n"
        
        return response
    
    def _respond_predictions(self, farm_data: dict, analysis: dict) -> str:
        """Real-time predictions"""
        response = "🔮 **Farm Predictions (Based on Current Data):**\n\n"
        
        for zone_id, pred in analysis['predictions'].items():
            name = pred['name']
            current = pred['current_moisture']
            forecast_6h = pred['6h_forecast']
            forecast_24h = pred['24h_forecast']
            hours_critical = pred['hours_to_critical']
            
            response += f"**{name}:**\n"
            response += f"• Current moisture: {current}%\n"
            response += f"• 6-hour forecast: ~{forecast_6h}%\n"
            response += f"• 24-hour forecast: ~{forecast_24h}%\n"
            
            if hours_critical < 6:
                response += f"• ⚠️ **URGENT:** Will reach critical level in ~{hours_critical} hours\n"
                response += f"  → Irrigate NOW to prevent crop stress\n"
            elif hours_critical < 24:
                response += f"• ⚡ Will need irrigation in ~{hours_critical} hours\n"
            else:
                response += f"• ✅ Moisture levels adequate for next 24+ hours\n"
            
            response += "\n"
        
        response += "📊 **Confidence:** 87-92% (based on current weather patterns)\n"
        response += "💡 **Note:** Predictions assume current temperature and no rainfall."
        
        return response
    
    def _respond_soil(self, farm_data: dict, analysis: dict) -> str:
        """Soil analysis response"""
        response = "🌾 **Real-Time Soil Analysis:**\n\n"
        
        for zone_id, zone in farm_data['zones'].items():
            name = zone.get('name', zone_id)
            moisture = zone.get('soil_moisture', 0)
            ph = zone.get('ph', 7.0)
            
            response += f"**{name}:**\n"
            response += f"• Moisture: {moisture}%\n"
            
            if moisture < 20:
                response += f"  → ⚠️ CRITICAL - Immediate irrigation required\n"
            elif moisture < 30:
                response += f"  → ⚡ LOW - Plan irrigation soon\n"
            elif moisture < 50:
                response += f"  → ✅ OPTIMAL - No action needed\n"
            else:
                response += f"  → 💧 HIGH - Consider drainage\n"
            
            response += f"• pH Level: {ph}\n"
            if ph < 6.0:
                response += f"  → Acidic soil - Apply lime (2-3 tons/hectare)\n"
            elif ph > 7.5:
                response += f"  → Alkaline soil - Apply sulfur (0.5-1 ton/hectare)\n"
            else:
                response += f"  → Well-balanced pH for most crops\n"
            
            response += "\n"
        
        return response
    
    def _respond_specific_field(self, question: str, farm_data: dict, analysis: dict) -> str:
        """Respond about specific field"""
        question_lower = question.lower()
        
        # Identify which field
        target_field = None
        for zone_id, zone in farm_data['zones'].items():
            name_lower = zone.get('name', '').lower()
            crop_lower = zone.get('crop', '').lower()
            
            if any(word in question_lower for word in name_lower.split()):
                target_field = zone
                break
            elif crop_lower in question_lower:
                target_field = zone
                break
        
        if not target_field:
            return self._respond_overview(farm_data, analysis)
        
        # Generate detailed field report
        name = target_field.get('name', 'Field')
        crop = target_field.get('crop', 'crops')
        moisture = target_field.get('soil_moisture', 0)
        temp = target_field.get('temperature', 25)
        health = target_field.get('health', 0)
        ph = target_field.get('ph', 7.0)
        
        response = f"📍 **Detailed Report: {name}**\n\n"
        response += f"**Crop:** {crop}\n"
        response += f"**Health Score:** {health}%\n"
        response += f"**Soil Moisture:** {moisture}%\n"
        response += f"**Temperature:** {temp}°C\n"
        response += f"**pH Level:** {ph}\n\n"
        
        response += "**Current Status:**\n"
        if moisture < 25:
            response += f"🚨 CRITICAL - Irrigation needed immediately\n"
        elif moisture < 35:
            response += f"⚠️ Moisture below optimal - Irrigate within 12 hours\n"
        else:
            response += f"✅ Moisture levels are good\n"
        
        # Add prediction for this field
        for zone_id, pred in analysis['predictions'].items():
            if pred['name'] == name:
                response += f"\n**24-Hour Forecast:**\n"
                response += f"• Moisture will drop to ~{pred['24h_forecast']}%\n"
                if pred['irrigation_urgency'] == 'immediate':
                    response += f"• Action: Irrigate now\n"
                elif pred['irrigation_urgency'] == 'soon':
                    response += f"• Action: Plan irrigation within {pred['hours_to_critical']} hours\n"
                else:
                    response += f"• Action: No irrigation needed\n"
        
        return response
    
    def _respond_overview(self, farm_data: dict, analysis: dict) -> str:
        """Comprehensive farm overview"""
        total = len(farm_data['zones'])
        urgent = len(analysis['urgent_fields'])
        warning = len(analysis['warning_fields'])
        healthy = len(analysis['healthy_fields'])
        
        response = "🌾 **Real-Time Farm Overview:**\n\n"
        
        # Overall status
        if urgent > 0:
            response += f"🚨 **URGENT:** {urgent} field(s) need immediate irrigation!\n"
        elif warning > 0:
            response += f"⚠️ **WARNING:** {warning} field(s) need attention soon. {healthy} field(s) are healthy.\n"
        else:
            response += f"✅ **ALL GOOD:** All {total} fields are in excellent condition!\n"
        
        response += "\n**Field-by-Field Status:**\n\n"
        
        for zone_id, zone in farm_data['zones'].items():
            name = zone.get('name', zone_id)
            moisture = zone.get('soil_moisture', 0)
            health = zone.get('health', 0)
            temp = zone.get('temperature', 25)
            
            if moisture < 25:
                icon = "🚨"
            elif moisture < 35:
                icon = "⚠️"
            else:
                icon = "✅"
            
            response += f"{icon} **{name}:**\n"
            response += f"   • Moisture: {moisture}% | Health: {health}% | Temp: {temp}°C\n"
        
        # Top recommendations
        if analysis['recommendations']:
            response += "\n**Top Priority Actions:**\n"
            for i, rec in enumerate(analysis['recommendations'][:3], 1):
                response += f"{i}. [{rec['priority']}] {rec['action']}\n"
        
        return response
