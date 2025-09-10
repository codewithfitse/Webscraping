import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Lobby from "./components/Lobby";
import Game from "./components/Game";
import Admin from "./components/Admin";
import Loading from "./components/Loading";
import "./styles/animations.css"; 
import Test from "./components/Test";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/game/:gameId" element={<Game />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/loading" element={<Loading />} /> 
        <Route path="/test/:gameId" element={<Test />} />
      </Routes>
    </Router>
  );
}

export default App;
