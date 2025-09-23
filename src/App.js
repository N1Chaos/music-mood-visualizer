import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Plot from 'react-plotly.js';
import './App.css';

function App() {
  const [songInput, setSongInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [audioFeatures, setAudioFeatures] = useState(null);
  const [lyrics, setLyrics] = useState(null);
  const [activeTab, setActiveTab] = useState('visualization');
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);

useEffect(() => {
  return () => {
    // Nettoie l'audio quand le composant est démonté
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };
}, []);

  // Palette de couleurs enrichie par émotion avec dégradés dynamiques
  const moodEffects = useMemo(() => ({
    joy: {
      particles: 80,
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFA500', '#FF1493', '#00FF00', '#FFFF00', '#FF69B4'],
      speed: 5,
      shape: 'circle',
      background: ['#FFE4E1', '#FFF0F5', '#FFEFD5', '#FFDAB9'],
      animation: 'sunburst',
      intensity: 1.8
    },
    energy: {
      particles: 120,
      colors: ['#FF0000', '#FF4500', '#FFD700', '#32CD32', '#00BFFF', '#8A2BE2', '#FF00FF', '#00FFFF'],
      speed: 10,
      shape: 'triangle',
      background: ['#000000', '#2F4F4F', '#800000', '#2E8B57'],
      animation: 'vortex',
      intensity: 2.5
    },
    calm: {
      particles: 40,
      colors: ['#1E90FF', '#00CED1', '#98FB98', '#87CEEB', '#DDA0DD', '#AFEEEE', '#B0E0E6', '#F0E68C'],
      speed: 2,
      shape: 'wave',
      background: ['#F0F8FF', '#F5FFFA', '#F0FFF0', '#FFF5EE'],
      animation: 'ripple',
      intensity: 1.2
    },
    sad: {
      particles: 25,
      colors: ['#2F4F4F', '#696969', '#778899', '#483D8B', '#556B2F', '#8B4513', '#800000', '#4B0082'],
      speed: 1.2,
      shape: 'rain',
      background: ['#2F2F2F', '#1a1a2a', '#2a1a1a', '#1a2a2a'],
      animation: 'fog',
      intensity: 0.8
    }
  }), []);

  const handleInputChange = (e) => {
    setSongInput(e.target.value);
  };

  const playMoodSound = useCallback((mood) => {
    if (!window.AudioContext && !window.webkitAudioContext) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      const frequencies = {
        joy: [440, 554, 659, 880],
        energy: [220, 330, 440, 550],
        calm: [330, 392, 494, 587],
        sad: [110, 131, 165, 196]
      };
      oscillator.frequency.setValueAtTime(
        frequencies[mood]?.[Math.floor(Math.random() * frequencies[mood].length)] || 440,
        audioContext.currentTime
      );
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      oscillator.start();
      setTimeout(() => oscillator.stop(), 2000);
    } catch (error) {
      console.log('Audio error:', error);
    }
  }, []);

  // Nouvelle fonction pour récupérer les paroles
  const fetchLyrics = async (artist, title) => {
  try {
    console.log(`Fetching lyrics for: ${artist} - ${title}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5s
    const response = await fetch('/.netlify/functions/lyrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artist, title }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.error('Lyrics API error:', response.status, response.statusText);
      return null;
    }
    const data = await response.json();
    console.log('Lyrics data:', data);
    return data.lyrics;
  } catch (error) {
    console.error('Lyrics API error:', error);
    return null;
  }
};
  // Nouvelle fonction pour analyser les paroles
  const analyzeLyrics = (lyricsText) => {
    if (!lyricsText) {
    console.log('No lyrics provided for analysis');
    return null;
  }

    const words = lyricsText.toLowerCase().split(/\s+/);
    const wordCount = words.length;
    const uniqueWords = new Set(words).size;

    const positiveWords = ['love', 'happy', 'joy', 'beautiful', 'good', 'amazing', 'wonderful'];
    const negativeWords = ['sad', 'hurt', 'pain', 'cry', 'bad', 'alone', 'broken'];

    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const sentimentScore = (positiveCount - negativeCount) / words.length;

    return {
      wordCount,
      uniqueWords,
      vocabularyRichness: (uniqueWords / wordCount * 100).toFixed(1),
      sentiment: sentimentScore > 0 ? 'positive' : sentimentScore < 0 ? 'negative' : 'neutral',
      sentimentScore: (sentimentScore * 100).toFixed(1)
    };
  };

  // Configuration des graphiques Plotly
  const createAudioFeaturesChart = (features) => {
    if (!features) return null;

    const featureNames = ['Danceability', 'Energy', 'Valence', 'Acousticness', 'Instrumentalness', 'Liveness', 'Speechiness'];
    const featureValues = [
      features.danceability * 100,
      features.energy * 100,
      features.valence * 100,
      features.acousticness * 100,
      features.instrumentalness * 100,
      features.liveness * 100,
      features.speechiness * 100
    ];
    return {
      data: [{
        type: 'bar',
        x: featureValues,
        y: featureNames,
        orientation: 'h',
        marker: {
          color: featureValues.map(val => {
            if (val > 70) return '#4ECDC4';
            if (val > 40) return '#FFD700';
            return '#FF6B6B';
          }),
          line: {
            color: 'white',
            width: 1
          }
        }
      }],
      layout: {
        title: 'Audio Features Analysis',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: 'white' },
        xaxis: { range: [0, 100], title: 'Percentage' },
        yaxis: { title: 'Features' },
        margin: { t: 50, r: 30, b: 50, l: 100 }
      }
    };
  };

  const createSentimentChart = (lyricsAnalysis, mood) => {
    const moodColors = {
      joy: '#FFD700',
      energy: '#FF6B6B',
      calm: '#4ECDC4',
      sad: '#778899'
    };
    return {
      data: [{
        type: 'indicator',
        mode: 'gauge+number+delta',
        value: lyricsAnalysis?.sentimentScore || 0,
        delta: { reference: 0 },
        gauge: {
          axis: { range: [-100, 100] },
          bar: { color: moodColors[mood] || '#4ECDC4' },
          steps: [
            { range: [-100, -33], color: '#FF6B6B' },
            { range: [-33, 33], color: '#FFD700' },
            { range: [33, 100], color: '#4ECDC4' }
          ]
        }
      }],
      layout: {
        title: 'Lyrics Sentiment Analysis',
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { color: 'white' }
      }
    };
  };

  // Fonction pour jouer l'extrait audio
  const playPreview = (previewUrl) => {
  if (!previewUrl) {
    setError('Aucun extrait audio disponible.');
    return;
  }

  // Arrête l'audio précédent
  if (audioRef.current) {
    audioRef.current.pause();
  }

  const audio = new Audio(previewUrl);
  audioRef.current = audio;

  // Événements simplifiés
  audio.onloadedmetadata = () => {
    setDuration(audio.duration);
  };

  audio.ontimeupdate = () => {
    setCurrentTime(audio.currentTime);
  };

  audio.onended = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  audio.onplay = () => setIsPlaying(true);
  audio.onpause = () => setIsPlaying(false);

  // Lecture
  audio.volume = 0.7;
  audio.play().catch(err => {
    console.error('Erreur audio:', err);
    setError('Lecture audio impossible.');
  });

  // Arrêt après 30s
  setTimeout(() => {
    if (!audio.paused) {
      audio.pause();
    }
  }, 30000);
};

const stopPreview = () => {
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
    setIsPlaying(false);
    setCurrentTime(0);
  }
};

  // Fonctions de dessin avancées
  const drawSunburst = (ctx, x, y, size, time, colors) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 0.5);

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const rayLength = size * (0.7 + Math.sin(time * 3 + i) * 0.3);
      const gradient = ctx.createLinearGradient(0, 0, Math.cos(angle) * rayLength, Math.sin(angle) * rayLength);

      gradient.addColorStop(0, colors[i % colors.length] + 'FF');
      gradient.addColorStop(1, colors[i % colors.length] + '00');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * rayLength, Math.sin(angle) * rayLength);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawVortex = (ctx, x, y, size, time, colors) => {
    ctx.save();
    ctx.translate(x, y);

    for (let i = 0; i < 8; i++) {
      const radius = size * (0.2 + i * 0.1);
      const points = 6 + i * 3;

      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let j = 0; j <= points; j++) {
        const angle = (j / points) * Math.PI * 2 + time * (i + 1) * 0.5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawRipple = (ctx, x, y, size, time, colors) => {
    for (let i = 0; i < 5; i++) {
      const radius = size * 0.3 + (time * 20 + i * 30) % 100;
      const alpha = 1 - (radius - size * 0.3) / 100;

      if (alpha > 0) {
        ctx.strokeStyle = colors[i % colors.length].replace(')', `,${alpha})`).replace('RGB', 'RGBA');
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const drawFog = (ctx, x, y, size, time, colors) => {
    ctx.save();
    ctx.translate(x, y);

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = size * 0.4 + Math.sin(time + i) * size * 0.1;
      const alpha = 0.3 + Math.sin(time * 2 + i) * 0.2;

      ctx.fillStyle = colors[i % colors.length].replace(')', `,${alpha})`).replace('RGB', 'RGBA');
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        size * 0.1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  };

  const drawMoodVisualization = useCallback((mood = 'sad', tempo = 100, energy = 0.5) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (canvas.animationId) {
      cancelAnimationFrame(canvas.animationId);
    }
    const moodConfig = moodEffects[mood] || moodEffects.sad;
    const particles = [];
    const intensity = energy * moodConfig.intensity;

    for (let i = 0; i < moodConfig.particles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 8 + 3,
        speedX: (Math.random() - 0.5) * moodConfig.speed * intensity,
        speedY: (Math.random() - 0.5) * moodConfig.speed * intensity,
        color: moodConfig.colors[Math.floor(Math.random() * moodConfig.colors.length)],
        life: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        pulse: Math.random() * Math.PI * 2
      });
    }

    let time = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const animate = () => {
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.width);
      gradient.addColorStop(0, moodConfig.background[0]);
      gradient.addColorStop(0.5, moodConfig.background[1]);
      gradient.addColorStop(1, moodConfig.background[2]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centralSize = 100 + Math.sin(time * tempo / 60) * 50 * intensity;

      switch(moodConfig.animation) {
        case 'sunburst':
          drawSunburst(ctx, centerX, centerY, centralSize, time, moodConfig.colors);
          break;
        case 'vortex':
          drawVortex(ctx, centerX, centerY, centralSize, time, moodConfig.colors);
          break;
        case 'ripple':
          drawRipple(ctx, centerX, centerY, centralSize, time, moodConfig.colors);
          break;
        case 'fog':
          drawFog(ctx, centerX, centerY, centralSize, time, moodConfig.colors);
          break;
        default:
          ctx.beginPath();
          ctx.arc(centerX, centerY, centralSize, 0, Math.PI * 2);
          ctx.fillStyle = moodConfig.colors[0];
          ctx.fill();
      }

      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;
        particle.pulse += 0.1;

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        const pulseSize = particle.size * (0.8 + Math.sin(particle.pulse) * 0.4);
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = particle.life;

        switch(moodConfig.shape) {
          case 'triangle':
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.moveTo(0, -pulseSize);
            ctx.lineTo(pulseSize, pulseSize);
            ctx.lineTo(-pulseSize, pulseSize);
            ctx.closePath();
            ctx.fill();
            break;
          case 'wave':
            ctx.strokeStyle = particle.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, pulseSize, 0, Math.PI * 1.8);
            ctx.stroke();
            break;
          case 'rain':
            ctx.fillStyle = particle.color;
            ctx.fillRect(-pulseSize/3, -pulseSize*2, pulseSize/1.5, pulseSize*3);
            break;
          default:
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
      });

      if (currentSong) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.fillText(`${currentSong.name} - ${currentSong.artist}`, centerX, 40);
        ctx.font = '14px Arial';
        ctx.fillText(`Tempo: ${tempo} BPM | Mood: ${mood} | Energy: ${Math.round(energy * 100)}%`, centerX, 70);
        ctx.shadowBlur = 0;
      }

      time += 0.016;
      canvas.animationId = requestAnimationFrame(animate);
    };
    animate();
  }, [currentSong, moodEffects]);

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!songInput.trim()) return;
  
  setIsLoading(true);
  setError(null);

  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseURL = isDevelopment ? 'http://localhost:8888' : '';

    console.log('🔍 Base URL:', baseURL);
    
    // Appel Spotify
    const response = await fetch(`${baseURL}/.netlify/functions/spotify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songName: songInput })
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('🎵 Données Spotify reçues:', data);

    // Appel Lyrics
    let lyricsText = null;
    let lyricsAnalysis = null;
    
    try {
      const lyricsResponse = await fetch(`${baseURL}/.netlify/functions/lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          artist: data.artist, 
          title: data.name 
        })
      });

      if (lyricsResponse.ok) {
        const lyricsData = await lyricsResponse.json();
        lyricsText = lyricsData.lyrics;
        lyricsAnalysis = analyzeLyrics(lyricsText);
        console.log('📝 Analyse des paroles:', lyricsAnalysis);
      }
    } catch (lyricsError) {
      console.warn('⚠️ Erreur lyrics:', lyricsError);
    }

    // Mise à jour de l'état
    setCurrentSong(data);
    setAudioFeatures(data);
    setLyrics(lyricsAnalysis);
    
    // Déclenchement des effets visuels et sonores
    drawMoodVisualization(data.mood, data.tempo || 100, data.energy || 0.5);
    playMoodSound(data.mood);
    
    // Lecture de l'extrait audio si disponible
    if (data.preview_url) {
      playPreview(data.preview_url);
    } else {
      setError('Aucun extrait audio disponible pour cette chanson.');
    }

  } catch (err) {
    console.error('Erreur:', err);
    setError('Erreur lors de l\'analyse de la chanson. Veuillez réessayer.');
    
    // Fallback mock data
    const mockData = {
      name: songInput,
      artist: 'Artist',
      tempo: 80 + Math.random() * 100,
      mood: ['joy', 'energy', 'calm', 'sad'][Math.floor(Math.random() * 4)],
      danceability: Math.random(),
      energy: Math.random(),
      valence: Math.random(),
      acousticness: Math.random(),
      instrumentalness: Math.random(),
      liveness: Math.random(),
      speechiness: Math.random(),
      status: 'mock_fallback'
    };
    setCurrentSong(mockData);
    setAudioFeatures(mockData);
    setLyrics(analyzeLyrics(getMockLyrics('Artist', songInput)));
    drawMoodVisualization(mockData.mood, mockData.tempo, mockData.energy);
  } finally {
    setIsLoading(false);
  }
};

// Ajoutez cette fonction si elle n'existe pas
const getMockLyrics = (artist, title) => {
  return `Mock lyrics for ${title} by ${artist}\n\nThis is a test lyrics content for demonstration.`;
};


  useEffect(() => {
    drawMoodVisualization('calm', 100, 0.5);

    const currentCanvas = canvasRef.current;
    return () => {
      if (currentCanvas?.animationId) {
        cancelAnimationFrame(currentCanvas.animationId);
      }
    };
  }, [drawMoodVisualization]);

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎵 Advanced Music Mood Visualizer</h1>
        <p>Analyse complète : émotions, paroles et caractéristiques audio</p>
      </header>
      <div className="controls">
        <form onSubmit={handleSubmit} className="search-form">
          <div className="input-group">
            <input
              type="text"
              value={songInput}
              onChange={handleInputChange}
              placeholder="Entrez un nom de chanson... (ex: Bohemian Rhapsody)"
              disabled={isLoading}
              className="song-input"
            />
            <button type="submit" disabled={isLoading} className="visualize-btn">
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Analyse en cours...
                </>
              ) : (
                '🎨 Analyser la musique'
              )}
            </button>
          </div>
        </form>
      </div>
      {error && (
  <div className="error-message">
    <p>{error}</p>
  </div>
)}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Analyse des émotions musicales...</p>
        </div>
      )}
      {currentSong && (
        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'visualization' ? 'active' : ''}`}
              onClick={() => setActiveTab('visualization')}
            >
              🎨 Visualisation
            </button>
            <button
              className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              📊 Analyse Audio
            </button>
            <button
              className={`tab ${activeTab === 'lyrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('lyrics')}
            >
              📝 Analyse Paroles
            </button>
          </div>
          <div className="tab-content">
            {activeTab === 'visualization' && (
  <div className="visualization-container">
    <canvas
      ref={canvasRef}
      width="800"
      height="600"
      className="mood-canvas"
      aria-label="Visualisation interactive des émotions musicales"
    />
    
    {currentSong.preview_url && (
      <div className="audio-controls">
        <div className="audio-info">
          <h4>🎵 Extrait audio (30 secondes)</h4>
          <p>{currentSong.name} - {currentSong.artist}</p>
        </div>
        
        <div className="audio-player">
          <button
            onClick={isPlaying ? stopPreview : () => playPreview(currentSong.preview_url)}
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Lecture'}
          </button>
          
          <button onClick={stopPreview} className="stop-btn">
            ⏹️ Arrêt
          </button>
          
          {/* Barre de progression */}
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
            </div>
            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    )}
  </div>
)}
            {activeTab === 'analysis' && audioFeatures && (
              <div className="charts-container">
                <div className="chart">
                  <Plot
                    {...createAudioFeaturesChart(audioFeatures)}
                    config={{ displayModeBar: false }}
                    style={{ width: '100%', height: '400px' }}
                  />
                </div>
              </div>
            )}
            {activeTab === 'lyrics' && (
  <div className="lyrics-analysis">
    {lyrics ? (
      <>
        <div className="chart">
          <Plot
            {...createSentimentChart(lyrics, currentSong.mood)}
            config={{ displayModeBar: false }}
            style={{ width: '100%', height: '300px' }}
          />
        </div>
        <div className="lyrics-stats">
          <h4>Statistiques des paroles :</h4>
          <p>Mots total : {lyrics.wordCount}</p>
          <p>Mots uniques : {lyrics.uniqueWords}</p>
          <p>Richesse du vocabulaire : {lyrics.vocabularyRichness}%</p>
          <p>Sentiment : {lyrics.sentiment} ({lyrics.sentimentScore}%)</p>
        </div>
      </>
    ) : (
      <div className="lyrics-error">
        <p>Paroles non disponibles pour cette chanson. Essayez une autre chanson ou vérifiez l'orthographe.</p>
      </div>
    )}

  </div>
)}
          </div>
        </div>
      )}
      {currentSong && (
        <div className="song-info">
          <h3>🎵 {currentSong.name} - {currentSong.artist}</h3>
          <div className="metrics">
            <span>🎼 Tempo: {currentSong.tempo} BPM</span>
            <span>🎨 Humeur: {currentSong.mood}</span>
            <span>💃 Danceabilité: {Math.round((currentSong.danceability || 0.5) * 100)}%</span>
            <span>⚡ Énergie: {Math.round((currentSong.energy || 0.5) * 100)}%</span>
            {currentSong.preview_url && <span>🎵 Extrait audio disponible</span>}
            {currentSong.status === 'mock_fallback' && (
              <span style={{color: '#ff6b6b'}}>⚠️ Données simulées</span>
            )}
          </div>
        </div>
      )}
      <footer className="app-footer">
        <p>Analyse avancée de la musique avec visualisations interactives</p>
      </footer>
    </div>
  );
}

export default App;