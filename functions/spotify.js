// functions/spotify.js
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { songName } = JSON.parse(event.body);
    
    // Get token
    const tokenData = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(tokenData.body.access_token);
    
    // Search track
    const search = await spotifyApi.searchTracks(songName, { limit: 1 });
    const track = search.body.tracks.items[0];
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        name: track.name,
        artist: track.artists[0].name,
        tempo: 120, // Simplified for demo
        mood: 'joy'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};