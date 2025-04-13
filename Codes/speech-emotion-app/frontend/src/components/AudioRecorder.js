import React, { useState, useEffect } from "react";
import { uploadAudio, recordAudio } from "../api";

function AudioRecorder({ onRecordComplete, onStartRecording }) {
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [startTime, setStartTime] = useState(null);

  let audioChunks = [];

  const startRecording = async () => {
    console.log("Starting recording...");
    // Clear previous results when starting recording
    if (onStartRecording) {
      onStartRecording();
    }
    setRecording(true);
    audioChunks = [];
    setStartTime(Date.now());
    try {
      const { recorder: recorderInstance, stream } = await recordAudio();
      recorderInstance.ondataavailable = (event) => {
        console.log("Data available:", event.data.size, "bytes");
        audioChunks.push(event.data);
      };
      recorderInstance.onstop = () => {
        console.log("Recording stopped, chunks:", audioChunks.length);
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        console.log("Audio blob created:", audioBlob.size, "bytes");
        if (audioBlob.size === 0) {
          console.error("Audio blob is empty, cannot upload.");
          setRecording(false);
          setRecorder(null);
          return;
        }
        uploadAudio(audioBlob)
          .then((response) => {
            console.log("Upload successful, response:", response);
            onRecordComplete(response);
            setRecording(false);
            setRecorder(null);
          })
          .catch((error) => {
            console.error("Upload error:", error);
            setRecording(false);
            setRecorder(null);
          });
      };
      setRecorder({ recorder: recorderInstance, stream });
      recorderInstance.start();
    } catch (error) {
      console.error("Recording setup error:", error);
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (recorder && recording) {
      const duration = (Date.now() - startTime) / 1000;
      console.log("Stopping recording after", duration, "seconds...");
      if (duration < 1) {
        console.warn("Recording too short, waiting 1 second...");
        setTimeout(() => recorder.recorder.stop(), 1000 - duration * 1000);
      } else {
        recorder.recorder.stop();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (recorder) {
        recorder.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recorder]);

  return (
    <div>
      {!recording ? (
        <button onClick={startRecording}>Start Recording</button>
      ) : (
        <>
          <button disabled>Recording...</button>
          <button onClick={stopRecording} style={{ marginLeft: "10px" }}>
            Stop Recording
          </button>
        </>
      )}
    </div>
  );
}

export default AudioRecorder;