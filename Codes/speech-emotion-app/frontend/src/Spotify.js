const SPOTIFY_CLIENT_ID = "d62d694333e7452baadaa8bb6e1bb41a";
const SPOTIFY_CLIENT_SECRET = "4825e6889ba44fc8a62c83de842d56ed";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const SEARCH_URL = "https://api.spotify.com/v1/search";

let accessToken = null;

const getAccessToken = async () => {
  if (accessToken) return accessToken;

  const authString = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authString}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  accessToken = data.access_token;
  setTimeout(() => (accessToken = null), data.expires_in * 1000); // Token expires in ~1 hour
  return accessToken;
};

const getSongsByEmotion = async (emotion) => {
  const token = await getAccessToken();
  let query = "";

  // Map emotions to mood-appropriate search terms
  switch (emotion.toLowerCase()) {
    case "anger":
      query = "genre:chill track:calm"; // Calming music
      break;
    case "sadness":
      query = "genre:pop track:upbeat"; // Uplifting music
      break;
    case "happiness":
      query = "genre:acoustic track:chill"; // Neutral/chill to maintain happiness
      break;
    case "surprise":
      query = "genre:indie track:exciting"; // Exciting to sustain curiosity
      break;
    case "neutral":
      query = "genre:instrumental track:inspiring"; // Chill or inspiring
      break;
    default:
      query = "genre:pop track:mixed"; // Default fallback
  }

  const response = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}&type=track&limit=5`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (data.tracks && data.tracks.items) {
    return data.tracks.items.map((track) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((artist) => artist.name).join(", "),
    }));
  }
  return [];
};

export { getSongsByEmotion };