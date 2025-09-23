import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './App.css';

function App() {
  const [songInput, setSongInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const canvasRef = useRef(null);

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

    // Création des particules avancées
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
      // Fond animé avec dégradé dynamique
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.width);
      gradient.addColorStop(0, moodConfig.background[0]);
      gradient.addColorStop(0.5, moodConfig.background[1]);
      gradient.addColorStop(1, moodConfig.background[2]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Effet central principal selon l'humeur
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
    // Fallback visuel simple si aucune animation ne correspond
    ctx.beginPath();
    ctx.arc(centerX, centerY, centralSize, 0, Math.PI * 2);
    ctx.fillStyle = moodConfig.colors[0];
    ctx.fill();
}


      // Particules avec comportements avancés
      particles.forEach((particle) => {
        // Mise à jour de la particule
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;
        particle.pulse += 0.1;

        // Rebond sur les bords
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        // Effet de pulsation
        const pulseSize = particle.size * (0.8 + Math.sin(particle.pulse) * 0.4);

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.globalAlpha = particle.life;

        // Dessin selon la forme
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
          default: // circle
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
      });

      // Affichage des informations
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
    try {
      console.log('🔍 Recherche de:', songInput);
      
      const response = await fetch('/.netlify/functions/spotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songName: songInput })
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('🎵 Données Spotify:', data);

      setCurrentSong(data);
      drawMoodVisualization(data.mood, data.tempo || 100, data.energy || 0.5);
      playMoodSound(data.mood);
      
    } catch (err) {
      console.error('Error:', err);
      const mockData = {
        name: songInput,
        artist: 'Artist',
        tempo: 80 + Math.random() * 100,
        mood: ['joy', 'energy', 'calm', 'sad'][Math.floor(Math.random() * 4)],
        danceability: Math.random(),
        energy: Math.random(),
        status: 'mock_fallback'
      };
      
      setCurrentSong(mockData);
      drawMoodVisualization(mockData.mood, mockData.tempo, mockData.energy);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎵 Music Mood Visualizer</h1>
        <p>Découvrez le paysage émotionnel de vos musiques préférées</p>
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
                '🎨 Visualiser l\'émotion'
              )}
            </button>
          </div>
        </form>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Analyse des émotions musicales...</p>
        </div>
      )}

      <div className="visualization-container">
        <canvas 
          ref={canvasRef} 
          width="800" 
          height="600" 
          className="mood-canvas"
          aria-label="Visualisation interactive des émotions musicales"
        />
      </div>

      {currentSong && (
        <div className="song-info">
          <h3>En cours de visualisation :</h3>
          <p><strong>{currentSong.name}</strong> par {currentSong.artist}</p>
          <div className="metrics">
            <span>🎼 Tempo: {currentSong.tempo} BPM</span>
            <span>🎨 Humeur: {currentSong.mood}</span>
            <span>💃 Dansabilité: {Math.round((currentSong.danceability || 0.5) * 100)}%</span>
            <span>⚡ Énergie: {Math.round((currentSong.energy || 0.5) * 100)}%</span>
            {currentSong.status === 'mock_fallback' && (
              <span style={{color: '#ff6b6b'}}>⚠️ Données simulées</span>
            )}
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>Expérimentez la puissance émotionnelle de la musique à travers l'art visuel</p>
      </footer>
    </div>
  );
}

export default App;