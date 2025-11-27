// Configuração da API
// Em produção, a variável VITE_API_URL deve ser configurada no Vercel
// Para desenvolvimento local, crie um arquivo .env com VITE_API_URL=http://localhost:3001/api

export const API_URL = import.meta.env.VITE_API_URL || 'https://cautela-back-production.up.railway.app/api';

export default API_URL;

