import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import { getUser, logout } from '../utils/auth';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();
  const user = getUser();
  const [formData, setFormData] = useState({
    material: '',
    descricao: '',
    tipo_material: 'permanente',
    quantidade: '',
    responsavel_nome: '',
    responsavel_email: ''
  });
  const [cautelas, setCautelas] = useState([]);
  const [cautelasFiltradas, setCautelasFiltradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('recente');

  useEffect(() => {
    carregarCautelas();
  }, []);

  const carregarCautelas = async () => {
    try {
      const response = await axios.get(`${API_URL}/cautelas`);
      setCautelas(response.data);
      setCautelasFiltradas(response.data);
    } catch (error) {
      console.error('Erro ao carregar cautelas:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar cautelas' });
    }
  };

  // Função para filtrar e ordenar cautelas
  useEffect(() => {
    let resultado = [...cautelas];

    // Filtro por busca (material, descrição, responsável)
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase();
      resultado = resultado.filter(cautela => 
        cautela.material?.toLowerCase().includes(termoBusca) ||
        cautela.descricao?.toLowerCase().includes(termoBusca) ||
        cautela.responsavel_nome?.toLowerCase().includes(termoBusca) ||
        cautela.responsavel_email?.toLowerCase().includes(termoBusca)
      );
    }

    // Filtro por status
    if (filtroStatus !== 'todos') {
      resultado = resultado.filter(cautela => cautela.status === filtroStatus);
    }

    // Filtro por tipo de material
    if (filtroTipo !== 'todos') {
      resultado = resultado.filter(cautela => cautela.tipo_material === filtroTipo);
    }

    // Ordenação
    resultado.sort((a, b) => {
      const dataA = new Date(a.data_criacao);
      const dataB = new Date(b.data_criacao);
      
      if (ordenacao === 'recente') {
        return dataB - dataA; // Mais recente primeiro
      } else if (ordenacao === 'antiga') {
        return dataA - dataB; // Mais antiga primeiro
      } else if (ordenacao === 'material') {
        return (a.material || '').localeCompare(b.material || '');
      } else if (ordenacao === 'responsavel') {
        return (a.responsavel_nome || '').localeCompare(b.responsavel_nome || '');
      }
      return 0;
    });

    setCautelasFiltradas(resultado);
  }, [cautelas, busca, filtroStatus, filtroTipo, ordenacao]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await axios.post(`${API_URL}/cautelas`, formData);
      setMessage({ 
        type: 'success', 
        text: `Cautela criada! Link de assinatura: ${response.data.link_assinatura}` 
      });
      setFormData({
        material: '',
        descricao: '',
        tipo_material: 'permanente',
        quantidade: '',
        responsavel_nome: '',
        responsavel_email: ''
      });
      carregarCautelas();
    } catch (error) {
      console.error('Erro ao criar cautela:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao criar cautela' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const copiarLink = (link) => {
    navigator.clipboard.writeText(link);
    setMessage({ type: 'success', text: 'Link copiado para a área de transferência!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const descautelar = async (cautelaId) => {
    if (!window.confirm('Deseja gerar link de descautela para esta cautela?')) {
      return;
    }

    try {
      console.log('Descautelar - ID:', cautelaId, 'Tipo:', typeof cautelaId);
      const response = await axios.post(`${API_URL}/cautelas/${cautelaId}/descautelar`);
      console.log('Resposta do descautelar:', response.data);
      setMessage({ 
        type: 'success', 
        text: `Link de descautela gerado! Link: ${response.data.link_assinatura}` 
      });
      carregarCautelas();
    } catch (error) {
      console.error('Erro ao descautelar:', error);
      console.error('Resposta do erro:', error.response?.data);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || `Erro ao descautelar: ${error.message}` 
      });
    }
  };

  const verHistorico = (cautelaId) => {
    navigate(`/historico/${cautelaId}`);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      logout();
    }
  };

  return (
    <div className="admin-page">
      <div className="container">
        <header className="admin-header">
          <div className="header-left">
            <div className="logo-header">
              <span className="logo-icon">🔒</span>
              <h1>Cautela</h1>
            </div>
            <p className="header-subtitle">Sistema de Gestão de Materiais</p>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user?.nome_completo || user?.username}</span>
              <button className="btn-logout" onClick={handleLogout}>
                Sair
              </button>
            </div>
          </div>
        </header>
        
        <div className="card">
          <h2>Criar Nova Cautela</h2>
          
          {message.text && (
            <div className={message.type === 'error' ? 'error' : 'success'}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Material *</label>
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleChange}
                required
                placeholder="Ex: Notebook Dell"
              />
            </div>

            <div className="form-group">
              <label>Tipo de Material *</label>
              <select
                name="tipo_material"
                value={formData.tipo_material}
                onChange={handleChange}
                required
              >
                <option value="permanente">Permanente (será devolvido)</option>
                <option value="consumivel">Consumível (não será devolvido)</option>
              </select>
              <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                {formData.tipo_material === 'permanente' 
                  ? 'Material que será devolvido após o uso' 
                  : 'Material que será consumido e não precisa ser devolvido'}
              </small>
            </div>

            <div className="form-group">
              <label>Descrição</label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Descrição detalhada do material"
              />
            </div>

            <div className="form-group">
              <label>Quantidade *</label>
              <input
                type="number"
                name="quantidade"
                value={formData.quantidade}
                onChange={handleChange}
                required
                min="1"
                placeholder="1"
              />
            </div>

            <div className="form-group">
              <label>Nome do Responsável *</label>
              <input
                type="text"
                name="responsavel_nome"
                value={formData.responsavel_nome}
                onChange={handleChange}
                required
                placeholder="Nome completo"
              />
            </div>

            <div className="form-group">
              <label>Email do Responsável *</label>
              <input
                type="email"
                name="responsavel_email"
                value={formData.responsavel_email}
                onChange={handleChange}
                required
                placeholder="email@exemplo.com"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Cautela'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>Cautelas Criadas</h2>
          {cautelas.length === 0 ? (
            <p className="loading">Nenhuma cautela criada ainda.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Tipo</th>
                  <th>Responsável</th>
                  <th>Quantidade</th>
                  <th>Status</th>
                  <th>Data Criação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {cautelasFiltradas.map((cautela) => (
                  <tr key={cautela.id}>
                    <td>{cautela.material}</td>
                    <td>
                      <span className={`status-badge ${cautela.tipo_material === 'permanente' ? 'status-assinado' : 'status-pendente'}`}>
                        {cautela.tipo_material === 'permanente' ? 'Permanente' : 'Consumível'}
                      </span>
                    </td>
                    <td>{cautela.responsavel_nome}</td>
                    <td>{cautela.quantidade}</td>
                    <td>
                      <span className={`status-badge status-${cautela.status}`}>
                        {cautela.status}
                      </span>
                    </td>
                    <td>
                      {new Date(cautela.data_criacao).toLocaleString('pt-BR')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => copiarLink(cautela.link_assinatura)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                          title="Copiar link de assinatura"
                        >
                          Link
                        </button>
                        {cautela.tipo_material === 'permanente' && cautela.status === 'cautelado' && (
                          <button
                            className="btn btn-primary"
                            onClick={() => descautelar(cautela.id)}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                            title="Gerar link de descautela"
                          >
                            Descautelar
                          </button>
                        )}
                        <button
                          className="btn btn-secondary"
                          onClick={() => verHistorico(cautela.id)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                          title="Ver histórico"
                        >
                          Histórico
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;

