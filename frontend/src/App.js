import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";

const Dashboard = () => <div>Dashboard Content</div>;
const Timesheets = () => <div>Timesheets Content</div>;
const Invoices = () => <div>Invoices Content</div>;

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
