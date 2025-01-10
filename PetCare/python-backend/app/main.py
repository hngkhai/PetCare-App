from fastapi import FastAPI,APIRouter
from fastapi.middleware.cors import CORSMiddleware
from controllers.ChatbotController import router as chatbot_router
# from controllers.GeminiAPIController import router as gemini_router
# from controllers.TavilyAPIController import router as tavily_router
import uvicorn
app = FastAPI()
router = APIRouter() 
origins = [
    "http://localhost:3000",
    "localhost:3000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Include the routers from different controllers
app.include_router(chatbot_router)
app.include_router(router)
# Define root route
@app.get("/")
def read_root():
    return {"message": "Hello, world!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)