// netlify/functions/lyrics.js
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
    const { artist, title } = JSON.parse(event.body || '{}');
    if (!artist || !title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Artist and title are required' })
      };
    }

    console.log(`📝 Fetching lyrics for: ${artist} - ${title}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
      { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'MusicMoodVisualizer/1.0'
        }
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log('❌ Lyrics API error, using mock lyrics');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ lyrics: getMockLyrics(artist, title) })
      };
    }

    const data = await response.json();
    console.log('✅ Lyrics obtained, length:', data.lyrics ? data.lyrics.length : 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        lyrics: data.lyrics || getMockLyrics(artist, title) 
      })
    };
    
  } catch (error) {
    console.error('❌ Lyrics Function Error:', error.message);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        lyrics: getMockLyrics('Unknown Artist', 'Unknown Title') 
      })
    };
  }
};

function getMockLyrics(artist, title) {
  const mockLyrics = [
    `Mock lyrics for "${title}" by ${artist}`,
    "",
    "[Verse 1]",
    "This is a test, we're singing along,",
    "To the rhythm of this beautiful song.",
    "The music flows, the feelings grow,",
    "In this moment, we're in the flow.",
    "",
    "[Chorus]",
    "Feel the rhythm, feel the beat,",
    "Moving together, never discrete.",
    "Heart is pounding, spirits high,",
    "Reaching upward, touch the sky.",
    "",
    "[Verse 2]",
    "Imagine a world with music and love,",
    "Guided by the stars from above.",
    "Every note tells a story true,",
    "Connecting me and you.",
    "",
    "[Bridge]",
    "Through the highs and through the lows,",
    "The melody continues to grow.",
    "A universal language we all understand,",
    "Across every sea, every land.",
    "",
    "[Outro]",
    "The music fades, but memories stay,",
    "Carrying us through night and day."
  ].join('\n');
  
  console.log('🎭 Using mock lyrics for:', artist, '-', title);
  return mockLyrics;
}