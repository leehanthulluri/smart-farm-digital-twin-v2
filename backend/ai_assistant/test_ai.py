if __name__ == "__main__":
    from pprint import pprint
    from farm_ai_assistant import FarmAIAssistant

    ai = FarmAIAssistant()
    farm_data = {
        "zones": {
            "fieldA": {"name": "Field A - Rice", "crop": "Rice", "soil_moisture": 35, "temperature": 28, "health": 80, "ph": 6.8},
            "fieldB": {"name": "Field B - Wheat", "crop": "Wheat", "soil_moisture": 22, "temperature": 29, "health": 72, "ph": 7.2},
            "fieldC": {"name": "Field C - Vegetables", "crop": "Veggies", "soil_moisture": 41, "temperature": 27, "health": 90, "ph": 6.5}
        }
    }
    message = "Do I need to irrigate?"
    response = ai.chat(message, farm_data)
    pprint(response)
