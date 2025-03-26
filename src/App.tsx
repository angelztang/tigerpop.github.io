import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<div>TigerPop Marketplace</div>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App; 