// src/App.js
import React from "react";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";

function App() {
  return (
    <div className="nk-app-root">
      <Header />
      <div className="nk-main-container">
        <Sidebar />
        <main className="nk-main-content">
          <h1>Welcome to TimePulse!</h1>
        </main>
      </div>
    </div>
  );
}

export default App;
