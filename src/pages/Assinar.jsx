import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';
import { API_URL } from '../config/api';
import './Assinar.css';

function Assinar() {
  const { uuid } = useParams();
  const [cautela, setCautela] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const signatureRef = useRef(null);
  const [fotoBase64, setFotoBase64] = useState(null);
  const [mostrarCamera, setMostrarCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    carregarCautela();
  }, [uuid]);

  const carregarCautela = async () => {
    try {
      const response = await axios.get(`${API_URL}/cautelas/${uuid}`);
      setCautela(response.data);
      
      if (response.data.status !== 'pendente') {
        if (response.data.status === 'cautelado') {
          setMessage({ 
            type: 'error', 
            text: 'Esta cautela já foi cautelada. Use o link de descautela para devolver.' 
          });
        } else if (response.data.status === 'descautelado') {
          setMessage({ 
            type: 'error', 
            text: 'Esta cautela já foi descautelada.' 
          });
        } else {
          setMessage({ 
            type: 'error', 
            text: 'Esta cautela não pode ser assinada no momento.' 
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cautela:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Cautela não encontrada' 
      });
    } finally {
      setLoading(false);
    }
  };

  const limparAssinatura = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } // Câmera frontal
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setMostrarCamera(true);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setMessage({ 
        type: 'error', 
        text: 'Erro ao acessar a câmera. Verifique as permissões.' 
      });
    }
  };

  const pararCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setMostrarCamera(false);
  };

  const capturarFoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const fotoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setFotoBase64(fotoDataUrl);
      pararCamera();
    }
  };

  const removerFoto = () => {
    setFotoBase64(null);
  };

  const handleSubmit = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setMessage({ type: 'error', text: 'Por favor, assine o documento' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const assinaturaBase64 = signatureRef.current.toDataURL('image/png');
      
      await axios.post(`${API_URL}/assinaturas/${uuid}`, {
        assinatura_base64: assinaturaBase64,
        foto_base64: fotoBase64
      });

      setMessage({ 
        type: 'success', 
        text: 'Assinatura e verificação facial salvas com sucesso! Obrigado.' 
      });
      
      // Limpar foto após salvar
      setFotoBase64(null);
      
      // Recarregar cautela para mostrar status atualizado
      setTimeout(() => {
        carregarCautela();
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erro ao salvar assinatura' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Limpar stream ao desmontar componente
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="assinar-page">
        <div className="container">
          <div className="loading">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!cautela) {
    return (
      <div className="assinar-page">
        <div className="container">
          <div className="card">
            <div className="error">Cautela não encontrada</div>
          </div>
        </div>
      </div>
    );
  }

  const jaAssinada = cautela.status !== 'pendente';
  const isCautelado = cautela.status === 'cautelado';
  const isDescautelado = cautela.status === 'descautelado';

  return (
    <div className="assinar-page">
      <div className="container">
        <h1>Assinar Cautela de Material</h1>

        <div className="card">
          <h2>Detalhes da Cautela</h2>
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
          </div>
        </div>

        {message.text && (
          <div className={`card ${message.type === 'error' ? 'error' : 'success'}`}>
            {message.text}
          </div>
        )}

        {jaAssinada && cautela.assinatura_base64 && (
          <div className="card">
            <h2>Assinatura Registrada</h2>
            <div className="assinatura-preview">
              <img 
                src={cautela.assinatura_base64} 
                alt="Assinatura" 
                style={{ maxWidth: '100%', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <p style={{ marginTop: '10px', color: '#666' }}>
              Assinada em: {new Date(cautela.data_assinatura).toLocaleString('pt-BR')}
            </p>
          </div>
        )}

        {!jaAssinada && (
          <>
            <div className="card">
              <h2>Assinatura Digital</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Por favor, assine o documento desenhando no campo abaixo:
              </p>
              
              <div className="signature-container">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: 'signature-canvas',
                    width: 800,
                    height: 300
                  }}
                  backgroundColor="#ffffff"
                  penColor="#000000"
                />
              </div>

              <div className="signature-actions">
                <button
                  className="btn btn-secondary"
                  onClick={limparAssinatura}
                  disabled={submitting}
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="card">
              <h2>Verificação Facial</h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Tire uma foto para verificação de identidade:
              </p>

              {!mostrarCamera && !fotoBase64 && (
                <button
                  className="btn btn-primary"
                  onClick={iniciarCamera}
                  disabled={submitting}
                  style={{ marginBottom: '20px' }}
                >
                  📷 Iniciar Câmera
                </button>
              )}

              {mostrarCamera && (
                <div className="camera-container">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      maxWidth: '640px',
                      border: '2px solid #dc2626',
                      borderRadius: '8px',
                      marginBottom: '15px'
                    }}
                  />
                  <div className="camera-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={pararCamera}
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={capturarFoto}
                      disabled={submitting}
                    >
                      📸 Capturar Foto
                    </button>
                  </div>
                </div>
              )}

              {fotoBase64 && (
                <div className="foto-preview">
                  <img
                    src={fotoBase64}
                    alt="Foto capturada"
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      border: '2px solid #dc2626',
                      borderRadius: '8px',
                      marginBottom: '15px'
                    }}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={removerFoto}
                    disabled={submitting}
                  >
                    Remover Foto
                  </button>
                </div>
              )}
            </div>

            <div className="card">
              <div className="signature-actions">
                <button
                  className="btn btn-success"
                  onClick={handleSubmit}
                  disabled={submitting}
                  style={{ width: '100%', fontSize: '18px', padding: '15px' }}
                >
                  {submitting ? 'Salvando...' : 'Confirmar Assinatura e Verificação Facial'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Assinar;

