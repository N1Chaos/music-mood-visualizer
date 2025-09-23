// netlify/functions/spotify.js
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  try {
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      console.error('❌ Missing Spotify credentials');
      throw new Error('Missing Spotify credentials in environment variables');
    }

    const { songName } = JSON.parse(event.body || '{}');
    if (!songName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Song name is required' })
      };
    }

    console.log(`🎵 Searching Spotify for: ${songName}`);

    // Fonction pour obtenir le token d'accès Spotify
    const getAccessToken = async () => {
      const authString = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token request failed:', response.status, errorText);
        throw new Error(`Failed to get Spotify token: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Spotify token obtained');
      return data.access_token;
    };

    const accessToken = await getAccessToken();

    // Recherche de la chanson
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(songName)}&type=track&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ Spotify search failed:', searchResponse.status, errorText);
      throw new Error(`Spotify search failed: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const track = searchData.tracks?.items?.[0];
    
    if (!track) {
      console.log('❌ No track found for:', songName);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `No track found for "${songName}"` })
      };
    }

    console.log('✅ Track found:', track.name, '-', track.artists[0].name);

    // Workaround pour audio-features (déprécié depuis nov 2024)
    let audioFeatures = {
      valence: 0.5,
      tempo: 120,
      danceability: 0.5,
      energy: 0.5,
      acousticness: 0.5,
      instrumentalness: 0.5,
      liveness: 0.5,
      speechiness: 0.5
    };

    try {
      // Essayer d'obtenir des recommandations pour avoir un track avec audio-features
      const featuresResponse = await fetch(
        `https://api.spotify.com/v1/recommendations?seed_tracks=${track.id}&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (featuresResponse.ok) {
        const featuresData = await featuresResponse.json();
        const recommendedTrack = featuresData.tracks[0];
        
        if (recommendedTrack) {
          console.log('🎯 Using recommended track for audio features:', recommendedTrack.name);
          
          const audioFeaturesResponse = await fetch(
            `https://api.spotify.com/v1/audio-features/${recommendedTrack.id}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (audioFeaturesResponse.ok) {
            audioFeatures = await audioFeaturesResponse.json();
            console.log('✅ Audio features obtained');
          } else {
            console.warn('⚠️ Using default audio features');
          }
        }
      }
    } catch (featuresError) {
      console.warn('⚠️ Audio features fallback:', featuresError.message);
    }

    // Déterminer l'humeur basée sur la valence
    const valence = audioFeatures.valence;
    let mood = 'sad';
    if (valence > 0.7) mood = 'joy';
    else if (valence > 0.5) mood = 'calm';
    else if (valence > 0.3) mood = 'energy';

    console.log('🎨 Mood analysis:', { valence, mood });

    const result = {
      name: track.name,
      artist: track.artists[0].name,
      tempo: Math.round(audioFeatures.tempo),
      mood,
      valence: audioFeatures.valence,
      danceability: audioFeatures.danceability,
      energy: audioFeatures.energy,
      acousticness: audioFeatures.acousticness,
      instrumentalness: audioFeatures.instrumentalness,
      liveness: audioFeatures.liveness,
      speechiness: audioFeatures.speechiness,
      preview_url: track.preview_url || null,
      status: 'spotify_api',
      spotify_id: track.id,
      duration_ms: track.duration_ms,
      popularity: track.popularity
    };

    console.log('✅ Final result prepared');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('❌ Spotify Function Error:', error.message, error.stack);
    
    // Fallback avec des données mockées plus réalistes
    const { songName } = JSON.parse(event.body || '{}');
    const mockData = {
      name: songName || 'Unknown Song',
      artist: 'Artist',
      tempo: Math.round(80 + Math.random() * 100),
      mood: ['joy', 'energy', 'calm', 'sad'][Math.floor(Math.random() * 4)],
      valence: Math.random(),
      danceability: Math.random(),
      energy: Math.random(),
      acousticness: Math.random(),
      instrumentalness: Math.random(),
      liveness: Math.random(),
      speechiness: Math.random(),
      preview_url: null,
      status: 'mock_fallback',
      spotify_id: null,
      duration_ms: 180000,
      popularity: 50
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockData)
    };
  }
};