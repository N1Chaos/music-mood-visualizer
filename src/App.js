import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Plot from "react-plotly.js";
import "./App.css";

function LyricsTempoPlot({ lyrics = [], tempo = 100, energy = 0.5, mood = "calm" }) {
  // Palette par mood
  const palettes = {
    joy: ["#FFD700", "#FF69B4", "#00FF00"],
    energy: ["#FF0000", "#FFA500", "#FFFF00"],
    calm: ["#1E90FF", "#00CED1", "#98FB98"],
    sad: ["#2F4F4F", "#483D8B", "#696969"],
  };
  const colors = palettes[mood] || ["#FFFFFF"];

  // Fallback lyrics mock
  const words = lyrics.length ? lyrics : ["La", "musique", "est", "une", "émotion"];
  const x = words.map((_, i) => i); // index du mot
  const y = words.map(() => Math.random() * tempo); // intensité aléatoire
  const sizes = words.map(() => 10 + (tempo / 10) * (0.5 + energy));

  return (
    <Plot
      data={[
        {
          x,
          y,
          mode: "markers+text",
          type: "scatter",
          text: words,
          textposition: "top center",
          marker: {
            size: sizes,
            color: colors,
            opacity: 0.7,
          },
        },
      ]}
      layout={{
        title: "Lyrics & Tempo",
        paper_bgcolor: "black",
        font: { color: "white" },
        xaxis: { showgrid: false, zeroline: false, visible: false },
        yaxis: { showgrid: false, zeroline: false, visible: false },
      }}
      style={{ width: "100%", height: "600px" }}
    />
  );
}

function App() {
  const [songInput, setSongInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const canvasRef = useRef(null);

  // Effets par humeur (simplifié ici pour garder ton système actuel)
  const moodEffects = useMemo(
    () => ({
      joy: { particles: 50, colors: ["#FFD700", "#FF6B6B"], speed: 3, shape: "circle" },
      energy: { particles: 80, colors: ["#FF0000", "#FFFF00"], speed: 6, shape: "triangle" },
      calm: { particles: 20, colors: ["#1E90FF", "#98FB98"], speed: 1.5, shape: "wave" },
      sad: { particles: 15, colors: ["#2F4F4F", "#483D8B"], speed: 1, shape: "rain" },
    }),
    []
  );

  const handleInputChange = (e) => setSongInput(e.target.value);

  // Ton dessin canvas (je simplifie mais garde ton principe de particules + pulsation)
  const drawMoodVisualization = useCallback(
    (mood = "sad", tempo = 100, energy = 0.5) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (canvas.animationId) cancelAnimationFrame(canvas.animationId);

      const moodConfig = moodEffects[mood] || moodEffects.sad;
      const particles = Array.from({ length: moodConfig.particles }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 6 + 2,
        speedX: (Math.random() - 0.5) * moodConfig.speed,
        speedY: (Math.random() - 0.5) * moodConfig.speed,
        color: moodConfig.colors[Math.floor(Math.random() * moodConfig.colors.length)],
      }));

      let time = 0;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Cercle pulsant au centre
        const pulse = Math.sin(time * tempo / 60) * 30 * energy;
        ctx.fillStyle = moodConfig.colors[0];
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 80 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Particules
        particles.forEach((p) => {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
          if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
        });

        // Texte (infos chanson)
        if (currentSong) {
          ctx.fillStyle = "#fff";
          ctx.font = "16px Arial";
          ctx.textAlign = "center";
          ctx.fillText(`${currentSong.name} - ${currentSong.artist}`, centerX, 30);
          ctx.fillText(`Tempo: ${tempo} BPM | Mood: ${mood}`, centerX, 50);
        }

        time += 0.016;
        canvas.animationId = requestAnimationFrame(animate);
      };
      animate();
    },
    [currentSong, moodEffects]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!songInput.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch("/.netlify/functions/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songName: songInput }),
      });
      const data = await response.json();
      setCurrentSong(data);
      drawMoodVisualization(data.mood, data.tempo || 100, data.energy || 0.5);
    } catch (err) {
      console.error("Error:", err);
      const mockData = {
        name: songInput,
        artist: "Artist",
        tempo: 100,
        mood: ["joy", "energy", "calm", "sad"][Math.floor(Math.random() * 4)],
        energy: Math.random(),
        lyrics: ["mock", "lyrics", "example", "for", "visualization"],
        status: "mock_fallback",
      };
      setCurrentSong(mockData);
      drawMoodVisualization(mockData.mood, mockData.tempo, mockData.energy);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    drawMoodVisualization("calm", 100, 0.5);
    return () => {
      if (canvasRef.current?.animationId) {
        cancelAnimationFrame(canvasRef.current.animationId);
      }
    };
  }, [drawMoodVisualization]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎵 Music Mood Visualizer</h1>
        <p>Visualisation artistique + paroles avec tempo</p>
      </header>

      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={songInput}
          onChange={handleInputChange}
          placeholder="Entrez un nom de chanson..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Analyse..." : "Visualiser"}
        </button>
      </form>

      <div
        className="visualization-container"
        style={{ display: "flex", gap: "20px", marginTop: "20px" }}
      >
        <canvas
          ref={canvasRef}
          width="600"
          height="600"
          className="mood-canvas"
        />
        {currentSong && (
          <div style={{ flex: 1 }}>
            <LyricsTempoPlot
              lyrics={currentSong.lyrics || []}
              tempo={currentSong.tempo}
              energy={currentSong.energy}
              mood={currentSong.mood}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
