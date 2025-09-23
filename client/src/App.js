import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [songInput, setSongInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);

  const handleInputChange = (e) => {
    setSongInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!songInput.trim()) return;
    
    setIsLoading(true);
    try {
      // Utilise la fonction Netlify au lieu de localhost
      const response = await fetch('/.netlify/functions/spotify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ songName: songInput })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Analysis:', data);
      
      // Vérifie si on a bien les données avant de dessiner
      if (data.mood || data.tempo) {
        drawMoodVisualization(data.mood || 'sad', data.tempo || 100);
      } else {
        console.error('Invalid data received:', data);
        drawMoodVisualization('sad', 100);
      }
    } catch (err) {
      console.error('Error:', err);
      // Affiche une visualisation d'erreur par défaut
      drawMoodVisualization('sad', 100);
    } finally {
      setIsLoading(false);
    }
  };

  const drawMoodVisualization = (mood = 'sad', tempo = 100) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    // Arrête l'animation précédente
    if (canvas.animationId) {
      cancelAnimationFrame(canvas.animationId);
    }

    const particles = [];
    const particleCount = 30;

    const colors = {
      joy: ['#ffeb3b', '#ff9800'],
      energy: ['#d32f2f', '#f44336'],
      calm: ['#4caf50', '#81c784'],
      sad: ['#1a237e', '#5e87d2']
    };
    const [baseColor, accentColor] = colors[mood] || colors.sad;

    // Ajuste l'animation selon le tempo
    const speedFactor = tempo / 100;

    // Initialise particules
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 2,
        speedX: (Math.random() * 1.5 - 0.75) * speedFactor,
        speedY: (Math.random() * 1.5 - 0.75) * speedFactor
      });
    }

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fond gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, baseColor);
      gradient.addColorStop(1, accentColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cercles pulsants (vitesse selon le tempo)
      const radius = 150 + 30 * Math.sin(time / (30 / speedFactor));
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Lignes verticales vibrantes
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(80 + i * 60, 50 + 15 * Math.sin(time * speedFactor + i));
        ctx.lineTo(80 + i * 60, 350 - 15 * Math.sin(time * speedFactor + i));
        ctx.stroke();
      }

      // Particules fluides
      particles.forEach((p) => {
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
      });

      time += 0.1 * speedFactor;
      canvas.animationId = requestAnimationFrame(animate);
    };
    animate();
  };

useEffect(() => {
  drawMoodVisualization('sad', 100);
  
  // Cleanup animation à la destruction du composant
  const currentCanvas = canvasRef.current;
  return () => {
    if (currentCanvas?.animationId) {
      cancelAnimationFrame(currentCanvas.animationId);
    }
  };
}, []);

  return (
    <div className="App">
      <h1>Music Mood Visualizer</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Enter Song Name:
          <input
            type="text"
            value={songInput}
            onChange={handleInputChange}
            placeholder="e.g., Bohemian Rhapsody"
            disabled={isLoading}
          />
        </label>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Analyzing...' : 'Visualize'}
        </button>
      </form>
      
      {isLoading && <div className="loading">Analyzing song mood...</div>}
      
      <canvas 
        id="moodCanvas" 
        ref={canvasRef} 
        width="400" 
        height="400" 
        aria-label="Music mood visualization"
      />
    </div>
  );
}

export default App;