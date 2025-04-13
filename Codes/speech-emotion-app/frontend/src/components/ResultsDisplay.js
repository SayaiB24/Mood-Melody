import React from "react";

function ResultsDisplay({ results }) {
  return (
    <div className="results">
      <h3>Emotion Prediction:</h3>
      {/* Comment out individual model predictions */}
      {/* <ul>
        {Object.entries(results).map(([model, emotion]) => (
          <li key={model}>
            {model === "majority" ? <strong>Final Prediction</strong> : model}: {emotion}
          </li>
        ))}
      </ul> */}
      {/* Show only the majority prediction */}
      {results.majority ? (
        <p className="emotion">
          {results.majority.charAt(0).toUpperCase() + results.majority.slice(1)}
        </p>
      ) : (
        <p>No prediction available</p>
      )}
    </div>
  );
}

export default ResultsDisplay;