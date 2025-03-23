# Car Driving Game

A simple 3D first-person driving game built with React, Vite, and Three.js. Control a car as it drives down an endless road.

## Features

- First-person view from inside a car
- Side-to-side movement using arrow keys or A/D keys
- Endless scrolling road with trees and environment
- Simple 3D graphics using Three.js
- Smooth animations and physics

## Prerequisites

- Node.js (v14+)
- npm or yarn

## Installation

1. Clone this repository or extract the project files.
2. Navigate to the project directory:
   ```bash
   cd car-driving-game
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Game

To start the development server:

```bash
npm run dev
```

The game will open in your browser at `http://localhost:5173/`.

## Controls

- **Left Arrow** or **A**: Move car left
- **Right Arrow** or **D**: Move car right

## Technologies Used

- React
- TypeScript
- Three.js
- @react-three/fiber (React bindings for Three.js)
- @react-three/drei (Useful helpers for react-three-fiber)
- @react-three/cannon (Physics engine)
- Vite (Build tool)

## Project Structure

- `src/components/Game.tsx`: Main game component
- `src/components/Car.tsx`: Car model and controls
- `src/components/RoadScene.tsx`: Road and environment
- `src/App.tsx`: Main application entry point

## Customization

You can customize various aspects of the game by modifying constants in the components:

- In `RoadScene.tsx`, change `ROAD_SPEED`, `ROAD_WIDTH`, etc.
- In `Game.tsx`, adjust the `moveSpeed` for faster or slower movement

## Future Improvements

- Add obstacles and collision detection
- Implement score/distance tracking
- Add acceleration and deceleration
- Improve graphics and add more environment details
- Add mobile touch controls
