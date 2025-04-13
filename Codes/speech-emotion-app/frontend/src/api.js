export const uploadAudio = async (audio) => {
    const formData = new FormData();
    formData.append("file", audio, "audio.wav");
  
    const response = await fetch("http://localhost:8000/predict", {
      method: "POST",
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error("Failed to upload audio to backend.");
    }
  
    return response.json();
  };
  
  export const recordAudio = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    return {
      recorder: mediaRecorder,
      stream: stream,
    };
  };