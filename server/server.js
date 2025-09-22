const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const spotifyApi = new SpotifyWebApi({
  clientId: '802d8bdf1fd14423b99ad5a62071a590',
  clientSecret: '725d25c66b284cf1a2860a7a970908d0'
});

app.get('/auth/token', async (req, res) => {
  const data = await spotifyApi.clientCredentialsGrant();
  res.json({ token: data.body.access_token });
});

app.post('/analyze', async (req, res) => {
  const { songName } = req.body;
  try {
    const search = await spotifyApi.searchTracks(songName, { limit: 1 });
    const track = search.body.tracks.items[0];
    const audioFeatures = await spotifyApi.getAudioFeaturesForTrack(track.id);
    res.json({
      name: track.name,
      tempo: audioFeatures.body.tempo,
      mood: audioFeatures.body.valence > 0.5 ? 'joy' : 'sad'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log('Server on 5000'));