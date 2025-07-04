import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";

// Temporary placeholders
const Dashboard = () => <div>Dashboard Page</div>;
const Timesheets = () => <div>Timesheets Page</div>;
const Invoices = () => <div>Invoices Page</div>;

function App() {
  return (
    <BrowserRouter>
      <div className="nk-app-root">
        <Header />
        <div className="nk-main-container">
          <Sidebar />
          <main className="nk-main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/timesheets" element={<Timesheets />} />
              <Route path="/invoices" element={<Invoices />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
