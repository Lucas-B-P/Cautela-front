import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import logoBda from '../img/logo-bda.png';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/auth/login`, formData);
      
      // Salvar token e informações do usuário
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirecionar para a página principal
      navigate('/');
    } catch (err) {
      console.error('Erro no login:', err);
      setError(
        err.response?.data?.error || 
        'Erro ao fazer login. Verifique suas credenciais.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <div className="logo-icon">
              <img src={logoBda} alt="Logo BDA" className="logo-img" />
            </div>
            <h1>SisGeMat</h1>
            <p className="logo-subtitle">Sistema de Gestão de Materiais</p>
          </div>
        </div>

        <div className="login-card">
          <h2>Entrar no Sistema</h2>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Usuário ou Email</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
                placeholder="Digite seu usuário ou email"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="Digite sua senha"
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn-login"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <div className="login-footer">
          <p>{[
            'D', 'e', 's', 'e', 'n', 'v', 'o', 'l', 'v', 'i', 'd', 'o', ' ',
            'p', 'o', 'r', ' ', 'S', 'd', ' ', 'B', 'o', 'r', 'b', 'a', ' ',
            '-', ' ', '4', 'º', 'B', 'd', 'a', ' ', 'C', ' ', 'M', 'e', 'c',
            ' ', '-', ' ', '2', '0', '2', '5'
          ].join('')}</p>
        </div>
      </div>
    </div>
  );
}

export default Login;

