const SpotifyWebApi = require('spotify-web-api-node');

exports.handler = async (event) => {
  // Headers CORS pour autoriser les requêtes cross-origin
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Gérer la pré-requête OPTIONS pour CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const { songName } = JSON.parse(event.body);
    if (!songName) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: 'Song name required' }) 
      };
    }

    const spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    });

    // Get token
    const tokenData = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(tokenData.body.access_token);

    // Search track
    const search = await spotifyApi.searchTracks(songName, { limit: 1 });
    if (!search.body.tracks.items.length) {
      return { 
        statusCode: 404, 
        headers,
        body: JSON.stringify({ error: 'Track not found' }) 
      };
    }
    const track = search.body.tracks.items[0];

    // Get audio features
    const audioFeatures = await spotifyApi.getAudioFeaturesForTrack(track.id);
    const valence = audioFeatures.body.valence;
    let mood = 'sad';
    if (valence > 0.7) mood = 'joy';
    else if (valence > 0.5) mood = 'calm';
    else if (valence > 0.3) mood = 'energy';

    const result = {
      name: track.name,
      artist: track.artists[0].name,
      tempo: Math.round(audioFeatures.body.tempo),
      mood,
      valence,
      danceability: audioFeatures.body.danceability,
      energy: audioFeatures.body.energy,
      preview_url: track.preview_url // Ajouté pour potentiellement lire un extrait
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Spotify Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch data from Spotify',
        details: error.message 
      })
    };
  }
};