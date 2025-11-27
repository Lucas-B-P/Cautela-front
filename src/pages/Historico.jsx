import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import './Historico.css';

function Historico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [historico, setHistorico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('recente');

  useEffect(() => {
    carregarHistorico();
  }, [id]);

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/cautelas/${id}/historico`);
      setHistorico(response.data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao carregar histórico' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="historico-page">
        <div className="container">
          <div className="loading">Carregando histórico...</div>
        </div>
      </div>
    );
  }

  if (!historico) {
    return (
      <div className="historico-page">
        <div className="container">
          <div className="card">
            <div className="error">Histórico não encontrado</div>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { cautela, assinaturas: assinaturasOriginais, total_assinaturas } = historico;

  // Filtrar e ordenar assinaturas
  let assinaturasFiltradas = [...assinaturasOriginais];

  // Filtro por busca (nome, cargo)
  if (busca.trim()) {
    const termoBusca = busca.toLowerCase();
    assinaturasFiltradas = assinaturasFiltradas.filter(assinatura =>
      assinatura.nome?.toLowerCase().includes(termoBusca) ||
      assinatura.cargo?.toLowerCase().includes(termoBusca)
    );
  }

  // Filtro por tipo de assinatura
  if (filtroTipo !== 'todos') {
    assinaturasFiltradas = assinaturasFiltradas.filter(assinatura =>
      assinatura.tipo_assinatura === filtroTipo
    );
  }

  // Ordenação
  assinaturasFiltradas.sort((a, b) => {
    const dataA = new Date(a.data_assinatura);
    const dataB = new Date(b.data_assinatura);

    if (ordenacao === 'recente') {
      return dataB - dataA; // Mais recente primeiro
    } else if (ordenacao === 'antiga') {
      return dataA - dataB; // Mais antiga primeiro
    } else if (ordenacao === 'nome') {
      return (a.nome || '').localeCompare(b.nome || '');
    }
    return 0;
  });

  return (
    <div className="historico-page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Histórico da Cautela</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Voltar
          </button>
        </div>

        {message.text && (
          <div className={`card ${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        {/* Informações da Cautela */}
        <div className="card">
          <h2>Informações da Cautela</h2>
          <div className="cautela-info">
            <div className="info-row">
              <strong>Material:</strong>
              <span>{cautela.material}</span>
            </div>
            {cautela.descricao && (
              <div className="info-row">
                <strong>Descrição:</strong>
                <span>{cautela.descricao}</span>
              </div>
            )}
            <div className="info-row">
              <strong>Tipo:</strong>
              <span className={`status-badge ${cautela.tipo_material === 'permanente' ? 'status-assinado' : 'status-pendente'}`}>
                {cautela.tipo_material === 'permanente' ? 'Permanente' : 'Consumível'}
              </span>
            </div>
            <div className="info-row">
              <strong>Quantidade:</strong>
              <span>{cautela.quantidade}</span>
            </div>
            <div className="info-row">
              <strong>Responsável:</strong>
              <span>{cautela.responsavel_nome}</span>
            </div>
            <div className="info-row">
              <strong>Email:</strong>
              <span>{cautela.responsavel_email}</span>
            </div>
            <div className="info-row">
              <strong>Status:</strong>
              <span className={`status-badge status-${cautela.status}`}>
                {cautela.status}
              </span>
            </div>
            <div className="info-row">
              <strong>Data de Criação:</strong>
              <span>{new Date(cautela.data_criacao).toLocaleString('pt-BR')}</span>
            </div>
            {cautela.data_retirada && (
              <div className="info-row">
                <strong>Data de Retirada:</strong>
                <span>{new Date(cautela.data_retirada).toLocaleString('pt-BR')}</span>
              </div>
            )}
            {cautela.data_devolucao && (
              <div className="info-row">
                <strong>Data de Devolução:</strong>
                <span>{new Date(cautela.data_devolucao).toLocaleString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Histórico de Assinaturas */}
        <div className="card">
          <h2>Histórico de Assinaturas ({total_assinaturas})</h2>
          
          {/* Barra de Busca e Filtros */}
          {assinaturasOriginais.length > 0 && (
            <div className="filters-container">
              <div className="search-group">
                <label htmlFor="busca-assinaturas">🔍 Buscar:</label>
                <input
                  type="text"
                  id="busca-assinaturas"
                  placeholder="Buscar por nome ou cargo..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filters-row">
                <div className="filter-group">
                  <label htmlFor="filtroTipo">Tipo:</label>
                  <select
                    id="filtroTipo"
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="filter-select"
                  >
                    <option value="todos">Todos</option>
                    <option value="cautela">Cautela</option>
                    <option value="descautela">Descautela</option>
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
                    <option value="nome">Nome (A-Z)</option>
                  </select>
                </div>
              </div>

              {(busca || filtroTipo !== 'todos') && (
                <div className="results-info">
                  Mostrando {assinaturasFiltradas.length} de {assinaturasOriginais.length} assinatura(s)
                  <button 
                    className="btn-clear-filters"
                    onClick={() => {
                      setBusca('');
                      setFiltroTipo('todos');
                    }}
                  >
                    Limpar Filtros
                  </button>
                </div>
              )}
            </div>
          )}

          {assinaturasOriginais.length === 0 ? (
            <p className="loading">Nenhuma assinatura registrada ainda.</p>
          ) : assinaturasFiltradas.length === 0 ? (
            <p className="loading">Nenhuma assinatura encontrada com os filtros aplicados.</p>
          ) : (
            <div className="assinaturas-list">
              {assinaturasFiltradas.map((assinatura, index) => (
                <div key={assinatura.id} className="assinatura-item">
                  <div className="assinatura-header">
                    <h3>
                      {assinatura.tipo_assinatura === 'cautela' ? '📝 Cautela' : '↩️ Descautela'} 
                      #{index + 1}
                    </h3>
                    <span className="data-assinatura">
                      {new Date(assinatura.data_assinatura).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="assinatura-details">
                    <div className="info-row">
                      <strong>Nome:</strong>
                      <span>{assinatura.nome}</span>
                    </div>
                    {assinatura.cargo && (
                      <div className="info-row">
                        <strong>Cargo:</strong>
                        <span>{assinatura.cargo}</span>
                      </div>
                    )}
                  </div>
                  <div className="assinatura-preview">
                    <img 
                      src={assinatura.assinatura_base64} 
                      alt={`Assinatura ${assinatura.tipo_assinatura}`}
                      style={{ 
                        maxWidth: '100%', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px',
                        marginTop: '10px'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Historico;

