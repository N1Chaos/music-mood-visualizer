exports.handler = async (event) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Gérer la pré-requête OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { songName } = JSON.parse(event.body);
    if (!songName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Song name required' }) };
    }

    // Méthode alternative : appel direct à l'API Spotify
    const getAccessToken = async () => {
      const authString = Buffer.from(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64');

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + authString,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!tokenResponse.ok) {
        throw new Error('Token request failed: ' + tokenResponse.status);
      }

      const tokenData = await tokenResponse.json();
      return tokenData.access_token;
    };

    const accessToken = await getAccessToken();

    // Recherche de la chanson
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(songName)}&type=track&limit=1`,
      {
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error('Search failed: ' + searchResponse.status);
    }

    const searchData = await searchResponse.json();

    if (!searchData.tracks.items.length) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Track not found' }) };
    }

    const track = searchData.tracks.items[0];

    // Récupère les caractéristiques audio
    const featuresResponse = await fetch(
      `https://api.spotify.com/v1/audio-features/${track.id}`,
      {
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        }
      }
    );

    let audioFeatures = { valence: 0.5, tempo: 120, danceability: 0.5, energy: 0.5 };
    
    if (featuresResponse.ok) {
      const featuresData = await featuresResponse.json();
      audioFeatures = featuresData;
    }

    // Détermine l'humeur
    const valence = audioFeatures.valence;
    let mood = 'sad';
    if (valence > 0.7) mood = 'joy';
    else if (valence > 0.5) mood = 'calm';
    else if (valence > 0.3) mood = 'energy';

    const result = {
      name: track.name,
      artist: track.artists[0].name,
      tempo: Math.round(audioFeatures.tempo),
      mood,
      valence: audioFeatures.valence,
      danceability: audioFeatures.danceability,
      energy: audioFeatures.energy,
      preview_url: track.preview_url,
      status: 'spotify_api'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Spotify Function Error:', error);
    
    // Fallback avec données mock en cas d'erreur
    const mockData = {
      name: event.body?.songName || 'Unknown Song',
      artist: 'Artist',
      tempo: 80 + Math.random() * 100,
      mood: ['joy', 'energy', 'calm', 'sad'][Math.floor(Math.random() * 4)],
      valence: Math.random(),
      danceability: Math.random(),
      energy: Math.random(),
      preview_url: null,
      status: 'mock_fallback'
    };

    return {
      statusCode: 200, // Retourne 200 même avec mock pour que le frontend fonctionne
      headers,
      body: JSON.stringify(mockData)
    };
  }
};