import React from "react";

function MusicPlayer({ songId }) {
  if (!songId) return null;

  return (
    <iframe
      src={`https://open.spotify.com/embed/track/${songId}`}
      width="300"
      height="80"
      frameBorder="0"
      allow="encrypted-media"
      title="Spotify Player"
    ></iframe>
  );
}

export default MusicPlayer;