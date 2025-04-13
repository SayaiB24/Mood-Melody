import os
import librosa
import numpy as np
import pandas as pd
import joblib
import tensorflow as tf
from sklearn.preprocessing import StandardScaler, LabelEncoder
from collections import Counter

# Suppress warnings
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

# Define model and scaler paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
FEATURES_CSV = os.path.join(MODELS_DIR, "extracted_features_cleaned.csv")
RF_MODEL = os.path.join(MODELS_DIR, "rf_final_175_features.pkl")
XGB_MODEL = os.path.join(MODELS_DIR, "xgb_final_175_features.pkl")
RF_TUNED_MODEL = os.path.join(MODELS_DIR, "rf_tuned_final_175.pkl")
XGB_TUNED_MODEL = os.path.join(MODELS_DIR, "xgb_tuned_final_175.pkl")
MLP_MODEL = os.path.join(MODELS_DIR, "mlp_titan_175_features.keras")
CNN_MODEL = os.path.join(MODELS_DIR, "cnn_spectrogram_5_classes.keras")

# Load models and scaler
rf_model = joblib.load(RF_MODEL)
xgb_model = joblib.load(XGB_MODEL)
rf_tuned_model = joblib.load(RF_TUNED_MODEL)
xgb_tuned_model = joblib.load(XGB_TUNED_MODEL)
mlp_model = tf.keras.models.load_model(MLP_MODEL)
cnn_model = tf.keras.models.load_model(CNN_MODEL)

scaler = StandardScaler()
scaler.fit(pd.read_csv(FEATURES_CSV).drop("Emotion", axis=1))
le = LabelEncoder()
le.fit(['anger', 'happy', 'neutral', 'sad', 'surprise'])

def extract_features(audio_path):
    try:
        y, sr = librosa.load(audio_path, sr=22050)  # Force sample rate
        print(f"Loaded audio: length={len(y)}, sample_rate={sr}")
        if len(y) < sr:  # Ensure at least 1 second of audio
            print(f"Audio too short ({len(y)/sr} seconds), padding to 1 second")
            y = np.pad(y, (0, sr - len(y)), mode='constant')
        
        n_fft = min(1024, len(y))
        hop_length = n_fft // 4
        
        zcr = np.mean(librosa.feature.zero_crossing_rate(y, hop_length=hop_length))
        rmse = np.mean(librosa.feature.rms(y=y, frame_length=n_fft, hop_length=hop_length))
        mfccs = np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13, n_fft=n_fft, hop_length=hop_length), axis=1)
        chroma = np.mean(librosa.feature.chroma_stft(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length), axis=1)
        mel_spectrogram = np.mean(librosa.feature.melspectrogram(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length), axis=1)
        spectral_contrast = np.mean(librosa.feature.spectral_contrast(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length), axis=1)
        spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length))
        spectral_bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length))
        spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length))
        tonnetz = np.mean(librosa.feature.tonnetz(y=librosa.effects.harmonic(y), sr=sr), axis=1)
        try:
            f0, _, _ = librosa.pyin(y, fmin=50, fmax=300, sr=sr)
            pitch_mean = np.nanmean(f0) if np.any(~np.isnan(f0)) else 0
            pitch_var = np.nanvar(f0) if np.any(~np.isnan(f0)) else 0
        except:
            pitch_mean, pitch_var = 0, 0
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
        tempo = tempo.item()
        intervals = librosa.effects.split(y, top_db=20)
        voiced_duration = sum((end - start) for start, end in intervals) / sr
        total_duration = len(y) / sr
        voiced_ratio = voiced_duration / total_duration if total_duration > 0 else 0
        
        features = [zcr, rmse, spectral_centroid, spectral_bandwidth, spectral_rolloff,
                    pitch_mean, pitch_var, tempo, voiced_ratio] + \
                   list(mfccs) + list(chroma) + list(mel_spectrogram) + \
                   list(spectral_contrast) + list(tonnetz)
        
        features = np.array(features, dtype=float)
        if features.shape[0] != 175:
            raise ValueError(f"Feature count mismatch: expected 175, got {features.shape[0]}")
        return features
    except Exception as e:
        print(f"Error extracting features from {audio_path}: {e}")
        return None

def extract_spectrogram(audio_path):
    try:
        y, sr = librosa.load(audio_path, sr=16000)
        print(f"Loaded audio for spectrogram: length={len(y)}, sample_rate={sr}")
        if len(y) < sr:  # Ensure at least 1 second of audio
            print(f"Audio too short ({len(y)/sr} seconds), padding to 1 second")
            y = np.pad(y, (0, sr - len(y)), mode='constant')
        mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128)
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
        max_len = 256
        if mel_spec_db.shape[1] < max_len:
            mel_spec_db = np.pad(mel_spec_db, ((0, 0), (0, max_len - mel_spec_db.shape[1])), mode='constant')
        else:
            mel_spec_db = mel_spec_db[:, :max_len]
        return mel_spec_db[..., np.newaxis][np.newaxis, :]
    except Exception as e:
        print(f"Error extracting spectrogram from {audio_path}: {e}")
        return None

def predict_emotion(file_path):
    # Extract features and spectrogram
    features = extract_features(file_path)
    spectrogram = extract_spectrogram(file_path)

    if features is None or spectrogram is None:
        return {"error": "Feature extraction failed"}

    # Scale features for sklearn and MLP models
    features_scaled = scaler.transform([features])

    # Predict using all models
    rf_pred = rf_model.predict(features_scaled)[0]  # String
    xgb_pred = le.inverse_transform([xgb_model.predict(features_scaled)[0]])[0]  # Integer to string
    rf_tuned_pred = rf_tuned_model.predict(features_scaled)[0]  # String
    xgb_tuned_pred = le.inverse_transform([xgb_tuned_model.predict(features_scaled)[0]])[0]  # Integer to string
    mlp_pred = le.inverse_transform([np.argmax(mlp_model.predict(features_scaled, verbose=0))])[0]  # Prob to string
    cnn_pred = le.inverse_transform([np.argmax(cnn_model.predict(spectrogram, verbose=0))])[0]  # Prob to string
    
    # Collect all predictions
    predictions = [rf_pred, xgb_pred, rf_tuned_pred, xgb_tuned_pred, mlp_pred, cnn_pred]
    
    # Find the majority prediction
    majority_prediction = Counter(predictions).most_common(1)[0][0]
    
    # Return predictions as a dictionary
    return {
        "rf": rf_pred,
        "xgb": xgb_pred,
        "rf_tuned": rf_tuned_pred,
        "xgb_tuned": xgb_tuned_pred,
        "mlp": mlp_pred,
        "cnn": cnn_pred,
        "majority": majority_prediction
    }