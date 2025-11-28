import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { getUser, logout } from '../utils/auth';
import logoBda from '../img/logo-bda.png';
import './Usuarios.css';

function Usuarios() {
  const navigate = useNavigate();
  const user = getUser();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nome_completo: '',
    role: 'user',
    ativo: true
  });

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users`);
      setUsuarios(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao carregar usuários' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const abrirModal = (usuario = null) => {
    if (usuario) {
      setEditingUser(usuario);
      setFormData({
        username: usuario.username,
        email: usuario.email,
        password: '',
        nome_completo: usuario.nome_completo || '',
        role: usuario.role || 'user',
        ativo: usuario.ativo !== undefined ? usuario.ativo : true
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        nome_completo: '',
        role: 'user',
        ativo: true
      });
    }
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      nome_completo: '',
      role: 'user',
      ativo: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (editingUser) {
        // Atualizar usuário
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await axios.put(`${API_URL}/users/${editingUser.id}`, updateData);
        setMessage({ type: 'success', text: 'Usuário atualizado com sucesso!' });
      } else {
        // Criar novo usuário
        if (!formData.password) {
          setMessage({ type: 'error', text: 'Senha é obrigatória para novos usuários' });
          setLoading(false);
          return;
        }
        await axios.post(`${API_URL}/users`, formData);
        setMessage({ type: 'success', text: 'Usuário criado com sucesso!' });
      }
      
      fecharModal();
      carregarUsuarios();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao salvar usuário' 
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarSenha = async (userId) => {
    const novaSenha = prompt('Digite a nova senha (mínimo 8 caracteres):');
    if (!novaSenha || novaSenha.length < 8) {
      alert('Senha deve ter no mínimo 8 caracteres');
      return;
    }

    try {
      setLoading(true);
      await axios.put(`${API_URL}/users/${userId}/password`, { password: novaSenha });
      setMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao atualizar senha' 
      });
    } finally {
      setLoading(false);
    }
  };

  const deletarUsuario = async (userId) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${API_URL}/users/${userId}`);
      setMessage({ type: 'success', text: 'Usuário deletado com sucesso!' });
      carregarUsuarios();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao deletar usuário' 
      });
    } finally {
      setLoading(false);
    }
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
    <div className="usuarios-page">
      <header className="usuarios-page-header">
        <div className="header-left">
          <div className="logo-header">
            <span className="logo-icon">
              <img src={logoBda} alt="Logo BDA" className="logo-img" />
            </span>
            <h1>SisGeMat</h1>
          </div>
        </div>
        <div className="header-right">
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/')}
              style={{ marginRight: '10px' }}
            >
              Voltar
            </button>
          </div>
          <div className="user-info">
            <span>{user?.username || 'Usuário'}</span>
            <button className="btn-logout" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>
      <div className="usuarios-container">
        <div className="usuarios-header">
          <h2>Gerenciamento de Usuários</h2>
          <button 
            className="btn btn-primary"
            onClick={() => abrirModal()}
          >
            + Novo Usuário
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {loading && usuarios.length === 0 ? (
          <p className="loading">Carregando usuários...</p>
        ) : (
          <div className="usuarios-table-container">
            <table className="usuarios-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Nome Completo</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Último Login</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.id}</td>
                    <td>{usuario.username}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.nome_completo || '-'}</td>
                    <td>
                      <span className={`role-badge role-${usuario.role}`}>
                        {usuario.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${usuario.ativo ? 'status-ativo' : 'status-inativo'}`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      {usuario.ultimo_login 
                        ? new Date(usuario.ultimo_login).toLocaleString('pt-BR')
                        : 'Nunca'
                      }
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => abrirModal(usuario)}
                          title="Editar usuário"
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => atualizarSenha(usuario.id)}
                          title="Alterar senha"
                        >
                          Senha
                        </button>
                        {usuario.id !== user?.id && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deletarUsuario(usuario.id)}
                            title="Deletar usuário"
                          >
                            Deletar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Criar/Editar Usuário */}
      {showModal && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button className="modal-close" onClick={fecharModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={!!editingUser}
                  placeholder="Digite o username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Digite o email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Senha {!editingUser && '*'}
                  {editingUser && <span className="hint">(deixe em branco para não alterar)</span>}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!editingUser}
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div className="form-group">
                <label htmlFor="nome_completo">Nome Completo</label>
                <input
                  type="text"
                  id="nome_completo"
                  name="nome_completo"
                  value={formData.nome_completo}
                  onChange={handleChange}
                  placeholder="Digite o nome completo"
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {editingUser && (
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="ativo"
                      checked={formData.ativo}
                      onChange={handleChange}
                    />
                    Usuário ativo
                  </label>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={fecharModal}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;

