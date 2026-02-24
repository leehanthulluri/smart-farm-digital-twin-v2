"""
Rules Engine for Smart Farm AI
Defines all agricultural rules and thresholds
"""

class FarmingRules:
    """Agricultural knowledge base and decision rules"""
    
    # Sensor thresholds
    THRESHOLDS = {
        'soil_moisture': {
            'critical_low': 15,
            'low': 25,
            'optimal_min': 30,
            'optimal_max': 50,
            'high': 60,
            'critical_high': 70
        },
        'temperature': {
            'critical_low': 10,
            'low': 15,
            'optimal_min': 20,
            'optimal_max': 30,
            'high': 35,
            'critical_high': 40
        },
        'humidity': {
            'low': 40,
            'optimal_min': 50,
            'optimal_max': 70,
            'high': 80
        },
        'ph': {
            'acidic': 5.5,
            'optimal_min': 6.0,
            'optimal_max': 7.5,
            'alkaline': 8.0
        }
    }
    
    # Crop-specific requirements
    CROP_REQUIREMENTS = {
        'Rice': {
            'moisture_min': 35,
            'temp_optimal': (25, 30),
            'ph_optimal': (6.0, 7.0)
        },
        'Wheat': {
            'moisture_min': 25,
            'temp_optimal': (20, 25),
            'ph_optimal': (6.5, 7.5)
        },
        'Vegetables': {
            'moisture_min': 30,
            'temp_optimal': (18, 28),
            'ph_optimal': (6.0, 7.0)
        }
    }
    
    @staticmethod
    def analyze_soil_moisture(value: float, crop: str = None) -> dict:
        """Analyze soil moisture level"""
        thresholds = FarmingRules.THRESHOLDS['soil_moisture']
        
        if crop and crop in FarmingRules.CROP_REQUIREMENTS:
            crop_min = FarmingRules.CROP_REQUIREMENTS[crop]['moisture_min']
        else:
            crop_min = thresholds['optimal_min']
        
        if value < thresholds['critical_low']:
            return {
                'status': 'critical',
                'level': 'critically low',
                'action': 'immediate_irrigation',
                'urgency': 'high',
                'message': 'Soil is dangerously dry'
            }
        elif value < crop_min:
            return {
                'status': 'warning',
                'level': 'low',
                'action': 'irrigation_needed',
                'urgency': 'medium',
                'message': 'Soil moisture below optimal'
            }
        elif value <= thresholds['optimal_max']:
            return {
                'status': 'good',
                'level': 'optimal',
                'action': 'monitor',
                'urgency': 'low',
                'message': 'Soil moisture is healthy'
            }
        elif value < thresholds['critical_high']:
            return {
                'status': 'warning',
                'level': 'high',
                'action': 'reduce_irrigation',
                'urgency': 'medium',
                'message': 'Soil is too wet'
            }
        else:
            return {
                'status': 'critical',
                'level': 'critically high',
                'action': 'stop_irrigation',
                'urgency': 'high',
                'message': 'Risk of waterlogging'
            }
    
    @staticmethod
    def analyze_temperature(value: float, crop: str = None) -> dict:
        """Analyze temperature level"""
        thresholds = FarmingRules.THRESHOLDS['temperature']
        
        if value < thresholds['critical_low']:
            return {
                'status': 'critical',
                'level': 'too cold',
                'action': 'frost_protection',
                'urgency': 'high',
                'message': 'Risk of frost damage'
            }
        elif value < thresholds['optimal_min']:
            return {
                'status': 'warning',
                'level': 'cool',
                'action': 'monitor',
                'urgency': 'low',
                'message': 'Temperature below optimal'
            }
        elif value <= thresholds['optimal_max']:
            return {
                'status': 'good',
                'level': 'optimal',
                'action': 'none',
                'urgency': 'none',
                'message': 'Temperature is ideal'
            }
        elif value < thresholds['critical_high']:
            return {
                'status': 'warning',
                'level': 'warm',
                'action': 'increase_irrigation',
                'urgency': 'medium',
                'message': 'Temperature above optimal'
            }
        else:
            return {
                'status': 'critical',
                'level': 'too hot',
                'action': 'heat_stress_mitigation',
                'urgency': 'high',
                'message': 'Risk of heat stress'
            }
    
    @staticmethod
    def analyze_ph(value: float, crop: str = None) -> dict:
        """Analyze soil pH level"""
        thresholds = FarmingRules.THRESHOLDS['ph']
        
        if value < thresholds['acidic']:
            return {
                'status': 'warning',
                'level': 'too acidic',
                'action': 'add_lime',
                'urgency': 'medium',
                'message': 'Soil is too acidic'
            }
        elif value <= thresholds['optimal_max']:
            return {
                'status': 'good',
                'level': 'optimal',
                'action': 'none',
                'urgency': 'none',
                'message': 'pH is balanced'
            }
        else:
            return {
                'status': 'warning',
                'level': 'too alkaline',
                'action': 'add_sulfur',
                'urgency': 'medium',
                'message': 'Soil is too alkaline'
            }
    
    @staticmethod
    def predict_irrigation_need(zone_data: dict) -> dict:
        """Predict if irrigation is needed"""
        moisture = zone_data.get('soil_moisture', 0)
        temp = zone_data.get('temperature', 25)
        crop = zone_data.get('crop', 'Vegetables')
        
        # Get crop requirements
        if crop in FarmingRules.CROP_REQUIREMENTS:
            required_moisture = FarmingRules.CROP_REQUIREMENTS[crop]['moisture_min']
        else:
            required_moisture = 30
        
        # Calculate irrigation priority
        moisture_deficit = required_moisture - moisture
        temp_factor = 1.0 if temp < 30 else 1.2  # Higher temps increase need
        
        if moisture < 20:
            return {
                'needed': True,
                'urgency': 'immediate',
                'estimated_hours': 0,
                'reason': 'Critical moisture level'
            }
        elif moisture < required_moisture:
            hours_until_critical = int((moisture - 15) * 4 / temp_factor)
            return {
                'needed': True,
                'urgency': 'soon',
                'estimated_hours': hours_until_critical,
                'reason': f'Approaching minimum for {crop}'
            }
        else:
            return {
                'needed': False,
                'urgency': 'none',
                'estimated_hours': 48,
                'reason': 'Moisture levels adequate'
            }
