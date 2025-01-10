from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from services.GeminiService import GeminiService
from services.TavilyService import TavilyService
from pydantic import BaseModel
import logging

router = APIRouter()

class Message(BaseModel):
    msg: str
    choice: int 

gemini_service = GeminiService()
tavily_service = TavilyService()

@router.post("/get_response")
async def get_response(message: Message):
    try:
        # Call the Gemini service for classification
        if message.choice == 1:
            # User chose GuideBot
            output = await gemini_service.get_gemini_response2(message.msg)
            return JSONResponse(content={"response": output})

        elif message.choice == 2:
            
            category = gemini_service.classify_input_with_gemini(message.msg)
            
            if category == "location":
                return JSONResponse(content={"response": "I'm sorry, I cannot assist in searching map locations. Please ask me something about pets, their care, or related topics that are not related to map location search."})
            elif category != "pet care":
                return JSONResponse(content={"response": "I'm sorry, I can only assist with pet care-related questions. Please ask me something about pets, their care, or related topics."})
            
            # Call Gemini API to get the pet care response
            content = tavily_service.search_tavily(message.msg)
            if (content == "I'm sorry, but the Tavily service is currently unavailable. Please try again later."):
                return JSONResponse(content={"response": content})
            response = gemini_service.get_gemini_response(message.msg, content)
            return JSONResponse(content={"response": response})
        else:
            # Handle invalid choice
            return JSONResponse(content={"response": "Invalid choice. Please select 1 for GuideBot or 2 for PetBuddy."}, status_code=400)
    except Exception as e:
        logging.error(f"Error while processing the chat message: {e}")
        raise HTTPException(status_code=500, detail="Error processing request.")
