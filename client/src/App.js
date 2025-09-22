import React, { useState } from 'react';
import './App.css';

function App() {
  const [songInput, setSongInput] = useState('');

  const handleInputChange = (e) => {
    setSongInput(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Song submitted:', songInput);
    // Placeholder pour futur appel API
  };

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
      <canvas id="moodCanvas" width="400" height="400" style={{ border: '1px solid black' }}>
        Placeholder visualization
      </canvas>
    </div>
  );
}

export default App;