import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './pages/Admin';
import Assinar from './pages/Assinar';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Admin />} />
        <Route path="/assinar/:uuid" element={<Assinar />} />
      </Routes>
    </Router>
  );
}

export default App;

