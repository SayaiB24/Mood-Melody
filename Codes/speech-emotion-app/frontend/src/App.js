import React, { useState } from "react";
import "./App.css";
import AudioRecorder from "./components/AudioRecorder";
import FileUploader from "./components/FileUploader";
import ResultsDisplay from "./components/ResultsDisplay";
import MusicPlayer from "./components/MusicPlayer";
import { getSongsByEmotion } from "./Spotify";
import { uploadAudio } from "./api";
import background1 from "./assets/background1.jpg"; // DJ turntable
import background2 from "./assets/background2.jpg"; // Musical notes

function App() {
  const [results, setResults] = useState({});
  const [songs, setSongs] = useState([]);
  const [manualEmotion, setManualEmotion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRecordComplete = (response) => {
    console.log("Record complete, response:", response);
    setResults(response);
    setIsLoading(false);
    if (response && response.majority) {
      fetchSongs(response.majority);
    } else {
      console.warn("No majority prediction in response:", response);
    }
  };

  const handleUpload = async (file) => {
    setResults({});
    setSongs([]);
    setIsLoading(true);
    try {
      const response = await uploadAudio(file);
      console.log("Upload response:", response);
      setResults(response);
      if (response.majority) {
        fetchSongs(response.majority);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setResults({ error: "Upload failed" });
    }
    setIsLoading(false);
  };

  const fetchSongs = async (emotion) => {
    try {
      const songsList = await getSongsByEmotion(emotion);
      setSongs(songsList);
    } catch (error) {
      console.error("Error fetching songs:", error);
      setSongs([]);
    }
  };

  const handleManualSearch = () => {
    if (manualEmotion) {
      setResults({});
      setSongs([]);
      fetchSongs(manualEmotion);
    }
  };

  const clearResults = () => {
    setResults({});
    setSongs([]);
    setManualEmotion("");
  };

  const getMoodMessage = (emotion) => {
    switch (emotion?.toLowerCase()) {
      case "anger":
        return "You seem angry. Here are some songs to calm you down.";
      case "sadness":
        return "You seem sad. Here are some songs to boost your mood.";
      case "happiness":
        return "You seem happy! Here are some songs to keep the vibe going.";
      case "surprise":
        return "You seem surprised! Here are some exciting tracks for you.";
      case "neutral":
        return "You seem neutral. Here are some inspiring songs to enjoy.";
      default:
        return "";
    }
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId).scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="App">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-left">Mood Melody</div>
        <ul className="navbar-right">
          <li><a href="#predict" onClick={(e) => { e.preventDefault(); scrollToSection("predict"); }}>Predict</a></li>
          <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection("contact"); }}>About Us</a></li>
        </ul>
      </nav>

      {/* Header Section */}
      <header className="header-section" style={{ backgroundImage: `url(${background1})` }}>
        <div className="header-content">
          <h1>Mood Melody</h1>
          <p>Sing to your soul</p>
          <div className="header-decoration">
            <span>🎵</span> <span>Let the music heal you</span> <span>🎶</span>
          </div>
        </div>
      </header>

      {/* Main Interface Section */}
      <main className="main-section" id="predict" style={{ backgroundImage: `url(${background2})` }}>
        <div className="main-content">
          <div className="controls">
            <AudioRecorder
              onRecordComplete={handleRecordComplete}
              onStartRecording={() => {
                setResults({});
                setSongs([]);
              }}
            />
            <FileUploader onUpload={handleUpload} />
            <button onClick={clearResults} className="clear-button">
              Clear
            </button>
          </div>
          {isLoading ? (
            <div className="loading">
              <p>Loading... Please wait</p>
              <div className="spinner"></div>
            </div>
          ) : (
            <ResultsDisplay results={results} />
          )}
          <div className="song-list">
            {songs.length > 0 ? (
              <>
                <p className="mood-message">{getMoodMessage(results.majority)}</p>
                {songs.map((song) => (
                  <MusicPlayer key={song.id} songId={song.id} />
                ))}
              </>
            ) : (
              <p>No songs available</p>
            )}
          </div>
          <div className="manual-search">
            <input
              type="text"
              value={manualEmotion}
              onChange={(e) => setManualEmotion(e.target.value)}
              placeholder="Enter emotion (e.g., happy)"
            />
            <button onClick={handleManualSearch}>Get Songs Manually</button>
          </div>
        </div>
      </main>

      {/* Contact Section */}
      <footer className="contact-section" id="contact">
        <div className="contact-content">
          <p>Contact Us:</p>
          <p>Sayali Bambal <a href="mailto:sayalibambal218@gmail.com">sayalibambal218@gmail.com</a></p>
          <p>Rochan Awasthi <a href="mailto:rochansawasthi@gmail.com">rochansawasthi@gmail.com</a></p>
        </div>
      </footer>
    </div>
  );
}

export default App;