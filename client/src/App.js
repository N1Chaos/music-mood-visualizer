import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [songInput, setSongInput] = useState('');
  const canvasRef = useRef(null);

  const handleInputChange = (e) => {
    setSongInput(e.target.value);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    // const tokenRes = await fetch('http://localhost:5000/auth/token'); // Supprime
    const response = await fetch('http://localhost:5000/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songName: songInput })
    });
    const data = await response.json();
    console.log('Analysis:', data);
    drawMoodVisualization(data.mood || 'sad');
  } catch (err) {
    console.error(err);
  }
};

  const drawMoodVisualization = (mood = 'sad') => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 30;

    const colors = {
      joy: ['#ffeb3b', '#ff9800'], // Jaune éclatant, orange vif
      energy: ['#d32f2f', '#f44336'], // Rouge profond, corail
      calm: ['#4caf50', '#81c784'], // Vert émeraude, vert clair
      sad: ['#1a237e', '#5e87d2'] // Bleu nuit, cobalt
    };
    const [baseColor, accentColor] = colors[mood];

    // Initialise particules
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 2,
        speedX: Math.random() * 1.5 - 0.75,
        speedY: Math.random() * 1.5 - 0.75
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

      // Cercles pulsants
      const radius = 150 + 30 * Math.sin(time / 30);
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.arc(200, 200, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Lignes verticales vibrantes
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(80 + i * 60, 50 + 15 * Math.sin(time + i));
        ctx.lineTo(80 + i * 60, 350 - 15 * Math.sin(time + i));
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

      time += 0.1;
      requestAnimationFrame(animate);
    };
    animate();
  };

  useEffect(() => {
    drawMoodVisualization('sad'); // Valeur par défaut au chargement
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
          />
        </label>
        <button type="submit">Visualize</button>
      </form>
      <canvas id="moodCanvas" ref={canvasRef} width="400" height="400" />
    </div>
  );
}

export default App;