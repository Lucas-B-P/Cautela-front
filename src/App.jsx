// RGVzZW52b2x2aWRvIHBvciBTZCBCb3JiYSAtIDTigJpCZGEgQyBNZWMgLSAyMDI1
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Assinar from './pages/Assinar';
import Historico from './pages/Historico';
import ProtectedRoute from './components/ProtectedRoute';
import Theme from './components/Theme';
import { getToken, logout, isTokenExpired } from './utils/auth';
import { API_URL } from './config/api';
import './App.css';

// Configurar axios para incluir token automaticamente
axios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && !isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
    }
    return Promise.reject(error);
  }
);

function App() {
  useEffect(() => {
    // Verificar token ao carregar a aplicação
    const token = getToken();
    if (token && isTokenExpired(token)) {
      logout();
    }
  }, []);

  return (
    <Router>
      <Theme />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } 
        />
        <Route path="/assinar/:uuid" element={<Assinar />} />
        <Route 
          path="/historico/:id" 
          element={
            <ProtectedRoute>
              <Historico />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

