import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { API_URL } from '../config/api';
import { getUser, logout } from '../utils/auth';
import logoBda from '../img/logo-bda.png';
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
  const [qrCodeModal, setQrCodeModal] = useState({ open: false, link: '', material: '' });

  useEffect(() => {
    carregarCautelas();
  }, []);

  const carregarCautelas = async () => {
    try {
      const response = await axios.get(`${API_URL}/cautelas`);
      const dados = response.data || [];
      setCautelas(dados);
      // O useEffect vai atualizar cautelasFiltradas automaticamente
    } catch (error) {
      console.error('Erro ao carregar cautelas:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar cautelas' });
      setCautelas([]);
    }
  };

  // Função auxiliar para normalizar texto (remover acentos e espaços extras)
  const normalizarTexto = (texto) => {
    if (!texto) return '';
    return String(texto)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .trim();
  };

  // Função para filtrar e ordenar cautelas
  useEffect(() => {
    if (!cautelas || cautelas.length === 0) {
      setCautelasFiltradas([]);
      return;
    }

    let resultado = [...cautelas];

    // Filtro por busca (material, descrição, responsável)
    if (busca && busca.trim()) {
      const termoBusca = normalizarTexto(busca);
      resultado = resultado.filter(cautela => {
        if (!cautela) return false;
        
        // Normalizar todos os campos para busca
        const material = normalizarTexto(cautela.material);
        const descricao = normalizarTexto(cautela.descricao);
        const responsavelNome = normalizarTexto(cautela.responsavel_nome);
        const responsavelEmail = normalizarTexto(cautela.responsavel_email);
        const quantidade = String(cautela.quantidade || '').trim();
        
        return material.includes(termoBusca) ||
               descricao.includes(termoBusca) ||
               responsavelNome.includes(termoBusca) ||
               responsavelEmail.includes(termoBusca) ||
               quantidade.includes(termoBusca);
      });
    }

    // Filtro por status
    if (filtroStatus && filtroStatus !== 'todos') {
      resultado = resultado.filter(cautela => cautela && cautela.status === filtroStatus);
    }

    // Filtro por tipo de material
    if (filtroTipo && filtroTipo !== 'todos') {
      resultado = resultado.filter(cautela => cautela && cautela.tipo_material === filtroTipo);
    }

    // Ordenação
    resultado.sort((a, b) => {
      if (!a || !b) return 0;
      
      const dataA = new Date(a.data_criacao || 0);
      const dataB = new Date(b.data_criacao || 0);
      
      if (ordenacao === 'recente') {
        return dataB - dataA; // Mais recente primeiro
      } else if (ordenacao === 'antiga') {
        return dataA - dataB; // Mais antiga primeiro
      } else if (ordenacao === 'material') {
        return String(a.material || '').localeCompare(String(b.material || ''));
      } else if (ordenacao === 'responsavel') {
        return String(a.responsavel_nome || '').localeCompare(String(b.responsavel_nome || ''));
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

  const abrirQRCode = (link, material) => {
    setQrCodeModal({ open: true, link, material });
  };

  const fecharQRCode = () => {
    setQrCodeModal({ open: false, link: '', material: '' });
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
              <span className="logo-icon">
                <img src={logoBda} alt="Logo BDA" className="logo-img" />
              </span>
              <h1>SisGeMat</h1>
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

        {/* Barra de Busca e Filtros */}
        <div className="card">
          <h2>Buscar e Filtrar Cautelas</h2>
          <div className="filters-container">
            <div className="search-group">
              <label htmlFor="busca">🔍 Buscar:</label>
              <input
                type="text"
                id="busca"
                placeholder="Buscar por material, descrição, responsável ou email..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filters-row">
              <div className="filter-group">
                <label htmlFor="filtroStatus">Status:</label>
                <select
                  id="filtroStatus"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="cautelado">Cautelado</option>
                  <option value="descautelado">Descautelado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="filtroTipo">Tipo:</label>
                <select
                  id="filtroTipo"
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="filter-select"
                >
                  <option value="todos">Todos</option>
                  <option value="permanente">Permanente</option>
                  <option value="consumivel">Consumível</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="ordenacao">Ordenar por:</label>
                <select
                  id="ordenacao"
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value)}
                  className="filter-select"
                >
                  <option value="recente">Mais Recente</option>
                  <option value="antiga">Mais Antiga</option>
                  <option value="material">Material (A-Z)</option>
                  <option value="responsavel">Responsável (A-Z)</option>
                </select>
              </div>
            </div>

            {busca || filtroStatus !== 'todos' || filtroTipo !== 'todos' ? (
              <div className="results-info">
                Mostrando {cautelasFiltradas.length} de {cautelas.length} cautela(s)
                <button 
                  className="btn-clear-filters"
                  onClick={() => {
                    setBusca('');
                    setFiltroStatus('todos');
                    setFiltroTipo('todos');
                  }}
                >
                  Limpar Filtros
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Lista de Cautelas */}
        <div className="card">
          <h2>Lista de Cautelas ({cautelasFiltradas.length})</h2>
          {cautelas.length === 0 ? (
            <p className="loading">Nenhuma cautela criada ainda.</p>
          ) : cautelasFiltradas.length === 0 ? (
            <p className="loading">Nenhuma cautela encontrada com os filtros aplicados.</p>
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
                        {cautela.link_assinatura && (
                          <>
                            <button
                              className="btn btn-secondary"
                              onClick={() => copiarLink(cautela.link_assinatura)}
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                              title="Copiar link de assinatura"
                            >
                              Link
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => abrirQRCode(cautela.link_assinatura, cautela.material)}
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                              title="Gerar QR Code do link"
                            >
                              QR Code
                            </button>
                          </>
                        )}
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

      {/* Modal de QR Code */}
      {qrCodeModal.open && (
        <div className="modal-overlay" onClick={fecharQRCode}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>QR Code - {qrCodeModal.material}</h2>
              <button className="modal-close" onClick={fecharQRCode}>×</button>
            </div>
            <div className="modal-body">
              <div className="qr-code-container">
                <QRCodeSVG 
                  value={qrCodeModal.link} 
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="qr-link-container">
                <p className="qr-link-label">Link de assinatura:</p>
                <div className="qr-link-input-group">
                  <input 
                    type="text" 
                    value={qrCodeModal.link} 
                    readOnly 
                    className="qr-link-input"
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={() => copiarLink(qrCodeModal.link)}
                  >
                    Copiar
                  </button>
                </div>
              </div>
              <p className="qr-instructions">
                Escaneie o QR Code com seu celular para acessar a página de assinatura
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;

