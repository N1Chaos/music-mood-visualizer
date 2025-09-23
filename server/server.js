const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: ['http://localhost:3000', 'https://music-mood-visualizer.netlify.app']
}));
app.use(express.json());

// ⚠️ REMPLACE 'TON_CLIENT_SECRET' par ta vraie clé !
const spotifyApi = new SpotifyWebApi({
  clientId: '802d8bdf1fd14423b99ad5a62071a590',
  clientSecret: '725d25c66b284cf1a2860a7a970908d0'
});

// Fonction pour obtenir et configurer un token
const getAccessToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body.access_token);
    console.log('✅ Token Spotify configuré');
    return data.body.access_token;
  } catch (error) {
    console.error('❌ Erreur token:', error);
    throw error;
  }
};

// Configure le token au démarrage
getAccessToken();

// Rafraîchit le token toutes les 55 minutes (expire après 1h)
setInterval(() => {
  getAccessToken();
}, 55 * 60 * 1000);

app.get('/auth/token', async (req, res) => {
  try {
    const token = await getAccessToken();
    res.json({ access_token: token }); // ← Important: "access_token" et non "token"
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la génération du token' });
  }
});

app.post('/analyze', async (req, res) => {
  const { songName } = req.body;
  
  if (!songName) {
    return res.status(400).json({ error: 'Le nom de la chanson est requis' });
  }

  try {
    console.log(`🔍 Recherche de: "${songName}"`);
    
    // Recherche la chanson
    const search = await spotifyApi.searchTracks(songName, { limit: 1 });
    
    if (!search.body.tracks.items.length) {
      return res.status(404).json({ error: 'Chanson non trouvée' });
    }

    const track = search.body.tracks.items[0];
    console.log(`🎵 Trouvé: ${track.name} - ${track.artists[0].name}`);

    // Récupère les caractéristiques audio
    const audioFeatures = await spotifyApi.getAudioFeaturesForTrack(track.id);
    
    // Détermine l'humeur basée sur la valence (0-1)
    const valence = audioFeatures.body.valence;
    let mood = 'sad';
    if (valence > 0.7) mood = 'joy';
    else if (valence > 0.5) mood = 'calm';
    else if (valence > 0.3) mood = 'energy';

    const result = {
      name: track.name,
      artist: track.artists[0].name,
      tempo: Math.round(audioFeatures.body.tempo),
      valence: valence,
      mood: mood,
      danceability: audioFeatures.body.danceability,
      energy: audioFeatures.body.energy
    };

    console.log('📊 Résultat analyse:', result);
    res.json(result);

  } catch (err) {
    console.error('❌ Erreur analyse:', err);
    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse: ' + err.message 
    });
  }
});

// Route de test
app.get('/test', (req, res) => {
  res.json({ message: 'Backend fonctionne!', timestamp: new Date().toISOString() });
});

app.listen(5000, () => {
  console.log('🚀 Server running on port 5000');
  console.log('📊 Teste avec: http://localhost:5000/test');
  console.log('🔑 Token endpoint: http://localhost:5000/auth/token');
});