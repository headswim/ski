import React from 'react';
import Game from './components/Game'
import './App.css'

function App() {
  return (
    <div className="App">
      <Game />
      <div className="game-controls">
        <h2>Ski Free Game</h2>
        <p>Use the arrow keys to steer:</p>
      </div>
    </div>
  )
}

export default App
