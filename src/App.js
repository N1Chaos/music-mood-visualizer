import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './App.css';

function App() {
  const [songInput, setSongInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const canvasRef = useRef(null);

  // Utilisation de useMemo pour stabiliser l'objet moodEffects
  const moodEffects = useMemo(() => ({
    joy: {
      particles: 50,
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFA500'],
      speed: 3,
      shape: 'circle'
    },
    energy: {
      particles: 80,
      colors: ['#FF0000', '#FF8C00', '#FFFF00', '#FF1493'],
      speed: 6,
      shape: 'triangle'
    },
    calm: {
      particles: 20,
      colors: ['#1E90FF', '#00CED1', '#98FB98', '#87CEEB'],
      speed: 1.5,
      shape: 'wave'
    },
    sad: {
      particles: 15,
      colors: ['#2F4F4F', '#696969', '#778899', '#483D8B'],
      speed: 1,
      shape: 'rain'
    }
  }), []);

  const handleInputChange = (e) => {
    setSongInput(e.target.value);
  };

  const playMoodSound = useCallback((mood) => {
    if (!window.AudioContext && !window.webkitAudioContext) {
      console.log('AudioContext not supported');
      return;
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      switch(mood) {
        case 'joy':
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.type = 'sine';
          break;
        case 'energy':
          oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
          oscillator.type = 'square';
          break;
        case 'calm':
          oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
          oscillator.type = 'sine';
          break;
        case 'sad':
          oscillator.frequency.setValueAtTime(110, audioContext.currentTime);
          oscillator.type = 'triangle';
          break;
        default:
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.type = 'sine';
          break;
      }
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
      }, 3000);
    } catch (error) {
      console.log('Audio error:', error);
    }
  }, []);

  const drawMoodVisualization = useCallback((mood = 'sad', tempo = 100, energy = 0.5) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (canvas.animationId) {
      cancelAnimationFrame(canvas.animationId);
    }

    const moodConfig = moodEffects[mood] || moodEffects.sad;
    const particles = [];
    const particleCount = moodConfig.particles;

    const intensity = energy * 2;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 6 + 2,
        speedX: (Math.random() - 0.5) * moodConfig.speed * intensity,
        speedY: (Math.random() - 0.5) * moodConfig.speed * intensity,
        color: moodConfig.colors[i % moodConfig.colors.length],
        life: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1
      });
    }

    let time = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 200);
      gradient.addColorStop(0, moodConfig.colors[0] + '80');
      gradient.addColorStop(1, moodConfig.colors[1] + '20');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const pulse = Math.sin(time * tempo / 60) * 30 * intensity;
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = moodConfig.colors[0];
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80 + pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      const barCount = 12;
      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2;
        const barHeight = 30 + Math.sin(time * 2 + i) * 25 * intensity;
        const x = centerX + Math.cos(angle) * 120 - 5;
        const y = centerY + Math.sin(angle) * 120 - barHeight / 2;
        
        ctx.fillStyle = moodConfig.colors[i % moodConfig.colors.length];
        ctx.fillRect(x, y, 10, barHeight);
      }

      particles.forEach((particle) => {
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life;

        switch(moodConfig.shape) {
          case 'triangle':
            ctx.beginPath();
            ctx.moveTo(0, -particle.size);
            ctx.lineTo(particle.size, particle.size);
            ctx.lineTo(-particle.size, particle.size);
            ctx.closePath();
            ctx.fill();
            break;
          case 'wave':
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, Math.PI * 1.5);
            ctx.stroke();
            break;
          case 'rain':
            ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size * 3);
            break;
          default:
            ctx.beginPath();
            ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            ctx.fill();
            break;
        }

        ctx.restore();

        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
        
        const edgeDist = Math.min(
          particle.x,
          canvas.width - particle.x,
          particle.y,
          canvas.height - particle.y
        );
        particle.life = Math.min(1, edgeDist / 50);
      });

      if (currentSong) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentSong.name} - ${currentSong.artist}`, centerX, 30);
        ctx.font = '14px Arial';
        ctx.fillText(`Tempo: ${tempo} BPM | Mood: ${mood}`, centerX, 50);
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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🎵 Données Spotify:', data);

      setCurrentSong(data);
      drawMoodVisualization(data.mood, data.tempo || 100, data.energy || 0.5);
      playMoodSound(data.mood);
      
    } catch (err) {
      console.error('Error:', err);
      // Fallback aux données mock si l'API échoue
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
    drawMoodVisualization('sad', 100, 0.5);
    
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
        <p>Discover the emotional landscape of your favorite songs</p>
      </header>

      <div className="controls">
        <form onSubmit={handleSubmit} className="search-form">
          <div className="input-group">
            <input
              type="text"
              value={songInput}
              onChange={handleInputChange}
              placeholder="Enter a song name... (e.g., Bohemian Rhapsody)"
              disabled={isLoading}
              className="song-input"
            />
            <button type="submit" disabled={isLoading} className="visualize-btn">
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                '🎨 Visualize Mood'
              )}
            </button>
          </div>
        </form>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Analyzing song emotions...</p>
        </div>
      )}

      <div className="visualization-container">
        <canvas 
          ref={canvasRef} 
          width="800" 
          height="600" 
          className="mood-canvas"
          aria-label="Interactive music mood visualization"
        />
      </div>

      {currentSong && (
        <div className="song-info">
          <h3>Now Visualizing:</h3>
          <p><strong>{currentSong.name}</strong> by {currentSong.artist}</p>
          <div className="metrics">
            <span>🎼 Tempo: {currentSong.tempo} BPM</span>
            <span>🎨 Mood: {currentSong.mood}</span>
            <span>💃 Danceability: {Math.round((currentSong.danceability || 0.5) * 100)}%</span>
            <span>⚡ Energy: {Math.round((currentSong.energy || 0.5) * 100)}%</span>
            {currentSong.status === 'mock_fallback' && (
              <span style={{color: '#ff6b6b'}}>⚠️ Using simulated data</span>
            )}
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>Experience the emotional power of music through visual art</p>
      </footer>
    </div>
  );
}

export default App;