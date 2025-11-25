import { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function Admin() {
  const [formData, setFormData] = useState({
    material: '',
    descricao: '',
    quantidade: '',
    responsavel_nome: '',
    responsavel_email: ''
  });
  const [cautelas, setCautelas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    carregarCautelas();
  }, []);

  const carregarCautelas = async () => {
    try {
      const response = await axios.get(`${API_URL}/cautelas`);
      setCautelas(response.data);
    } catch (error) {
      console.error('Erro ao carregar cautelas:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar cautelas' });
    }
  };

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

  return (
    <div className="admin-page">
      <div className="container">
        <h1>Sistema de Cautela de Materiais</h1>
        
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
                  <th>Responsável</th>
                  <th>Quantidade</th>
                  <th>Status</th>
                  <th>Data Criação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {cautelas.map((cautela) => (
                  <tr key={cautela.id}>
                    <td>{cautela.material}</td>
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
                      <button
                        className="btn btn-secondary"
                        onClick={() => copiarLink(cautela.link_assinatura)}
                        style={{ fontSize: '14px', padding: '6px 12px' }}
                      >
                        Copiar Link
                      </button>
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

