
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { songName, artist } = JSON.parse(event.body);
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key missing');
    }

    // Recherche YouTube
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(songName + ' ' + artist)}&type=video&videoDuration=short&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const videoId = data.items[0].id.videoId;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
          video_id: videoId,
          title: data.items[0].snippet.title
        })
      };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Video not found' }) };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};