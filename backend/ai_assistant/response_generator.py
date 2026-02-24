"""
Simple Working Response Generator
"""
import random
from datetime import datetime

class ResponseGenerator:
    """Simple response generator that works"""
    
    @staticmethod
    def generate_conversational_response(question: str, farm_data: dict, analysis: dict) -> str:
        """Generate response based on question keywords"""
        question_lower = question.lower()
        
        # Irrigation questions
        if any(word in question_lower for word in ['irrigate', 'irrigation', 'water']):
            response = "💧 **Irrigation Status:**\n\n"
            
            for zone_id, zone in farm_data['zones'].items():
                moisture = zone.get('soil_moisture', 0)
                name = zone.get('name', zone_id)
                
                if moisture < 25:
                    response += f"🚨 **{name}**: URGENT - Needs irrigation NOW! (Moisture: {moisture}%)\n"
                elif moisture < 35:
                    response += f"⚠️ **{name}**: Should irrigate soon (Moisture: {moisture}%)\n"
                else:
                    response += f"✅ **{name}**: Good moisture level (Moisture: {moisture}%)\n"
            
            return response
        
        # Weather/rainfall questions
        elif any(word in question_lower for word in ['weather', 'rain', 'temperature', 'forecast']):
            if 'decrease' in question_lower or 'drop' in question_lower:
                return "🌧️ **Rainfall Decrease Impact:**\n\n" + \
                       "⚠️ If rainfall decreases significantly, you'll need to:\n" + \
                       "• Increase irrigation frequency by 30-40%\n" + \
                       "• Monitor soil moisture daily\n" + \
                       "• Focus on fields with lower current moisture first\n" + \
                       "• Consider mulching to reduce evaporation"
            
            # General weather
            temps = [zone.get('temperature', 25) for zone in farm_data['zones'].values()]
            avg_temp = sum(temps) / len(temps)
            
            return f"🌤️ **Weather Status:**\n\n" + \
                   f"Average temperature: **{avg_temp:.1f}°C**\n\n" + \
                   ("⚠️ High temperature - increase irrigation\n" if avg_temp > 30 else "✅ Temperature is good for crops\n")
        
        # Crop health questions
        elif any(word in question_lower for word in ['health', 'crop', 'plant']):
            response = "🌱 **Crop Health Analysis:**\n\n"
            
            for zone_id, zone in farm_data['zones'].items():
                name = zone.get('name', zone_id)
                health = zone.get('health', 0)
                moisture = zone.get('soil_moisture', 0)
                
                if health > 80:
                    status = "✅ Excellent"
                elif health > 65:
                    status = "👍 Good"
                else:
                    status = "⚠️ Needs attention"
                
                response += f"**{name}**: {status} ({health}% health, {moisture}% moisture)\n"
            
            return response
        
        # Prediction questions
        elif any(word in question_lower for word in ['predict', 'future', 'tomorrow', 'next']):
            response = "🔮 **Predictions (Next 24 Hours):**\n\n"
            
            for zone_id, zone in farm_data['zones'].items():
                name = zone.get('name', zone_id)
                moisture = zone.get('soil_moisture', 0)
                
                # Simple prediction
                predicted = max(15, moisture - 3)
                
                response += f"**{name}**: Moisture will drop to ~{predicted:.1f}%\n"
                if predicted < 25:
                    response += f"  → ⚠️ Will need irrigation!\n"
            
            return response
        
        # Default farm overview
        else:
            critical = sum(1 for zone in farm_data['zones'].values() if zone.get('soil_moisture', 0) < 25)
            warning = sum(1 for zone in farm_data['zones'].values() if 25 <= zone.get('soil_moisture', 0) < 35)
            good = len(farm_data['zones']) - critical - warning
            
            if critical > 0:
                status = f"🚨 {critical} field(s) need IMMEDIATE irrigation!"
            elif warning > 0:
                status = f"⚠️ {warning} field(s) need irrigation soon. {good} field(s) are fine."
            else:
                status = f"✅ All {len(farm_data['zones'])} fields are in good condition!"
            
            response = f"Hello! Here's your farm status:\n\n{status}\n\n**Field Details:**\n"
            
            for zone_id, zone in farm_data['zones'].items():
                name = zone.get('name', zone_id)
                moisture = zone.get('soil_moisture', 0)
                health = zone.get('health', 0)
                
                emoji = "🚨" if moisture < 25 else "⚠️" if moisture < 35 else "✅"
                response += f"{emoji} **{name}**: {moisture}% moisture, {health}% health\n"
            
            return response
