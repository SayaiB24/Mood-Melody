from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from audio_processor import predict_emotion
import os

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3004"],  # Adjust if your frontend port differs 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Save uploaded file temporarily
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    # Get predictions
    result = predict_emotion(temp_path)

    # Clean up
    os.remove(temp_path)

    return result