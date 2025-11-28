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
  const signatureContainerRef = useRef(null);
  const [fotoBase64, setFotoBase64] = useState(null);
  const [mostrarCamera, setMostrarCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    carregarCautela();
  }, [uuid]);

  // Ajustar tamanho do canvas para mobile - corrigir calibração de toque
  useEffect(() => {
    if (!cautela || cautela.status !== 'pendente') return;

    const ajustarCanvas = () => {
      if (signatureRef.current && signatureContainerRef.current) {
        const container = signatureContainerRef.current;
        const canvas = signatureRef.current.getCanvas();
        
        if (canvas && container) {
          // Obter dimensões reais do container (descontando padding e bordas)
          const containerRect = container.getBoundingClientRect();
          const containerWidth = containerRect.width - 30; // Padding + borda
          const containerHeight = window.innerWidth < 768 
            ? Math.min(250, window.innerHeight * 0.25)
            : 300;
          
          // Ajustar tamanho interno do canvas para corresponder exatamente ao tamanho visual
          // Isso corrige o problema de calibração no mobile
          const currentData = signatureRef.current.isEmpty() 
            ? null 
            : signatureRef.current.toDataURL();
          
          canvas.width = containerWidth;
          canvas.height = containerHeight;
          
          // Restaurar conteúdo se houver
          if (currentData) {
            signatureRef.current.fromDataURL(currentData);
          }
        }
      }
    };

    // Ajustar após um delay para garantir que o DOM está renderizado
    const timeoutId = setTimeout(ajustarCanvas, 200);
    
    // Ajustar ao redimensionar
    window.addEventListener('resize', ajustarCanvas);
    window.addEventListener('orientationchange', () => {
      setTimeout(ajustarCanvas, 300);
    });

    return () => {
      window.removeEventListener('resize', ajustarCanvas);
      window.removeEventListener('orientationchange', ajustarCanvas);
      clearTimeout(timeoutId);
    };
  }, [cautela]);

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
      setMessage({ type: '', text: '' });
      
      // Parar qualquer stream existente primeiro
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', // Câmera frontal
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      streamRef.current = stream;
      
      // Configurar o vídeo antes de mostrar
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(err => {
            console.error('Erro ao reproduzir vídeo:', err);
          });
        };
      }
      
      setMostrarCamera(true);
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      let errorMessage = 'Erro ao acessar a câmera. ';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Permissão negada. Por favor, permita o acesso à câmera nas configurações do navegador.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'Nenhuma câmera encontrada.';
      } else {
        errorMessage += 'Verifique as permissões e tente novamente.';
      }
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
      setMostrarCamera(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
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
    // Validar assinatura
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      setMessage({ type: 'error', text: 'Por favor, assine o documento antes de confirmar.' });
      return;
    }

    // Validar foto (obrigatória)
    if (!fotoBase64) {
      setMessage({ type: 'error', text: 'Por favor, tire uma foto para verificação facial antes de confirmar.' });
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

  // Atualizar video quando mostrarCamera mudar
  useEffect(() => {
    if (mostrarCamera && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      const stream = streamRef.current;
      
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      
      video.onloadedmetadata = () => {
        video.play().catch(err => {
          console.error('Erro ao reproduzir vídeo:', err);
        });
      };
      
      // Tentar reproduzir imediatamente também
      video.play().catch(err => {
        console.error('Erro ao reproduzir vídeo:', err);
      });
    }
  }, [mostrarCamera]);

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
              <h2>Assinatura Digital <span style={{ color: '#dc2626', fontSize: '0.8em' }}>(Obrigatório)</span></h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Por favor, assine o documento desenhando no campo abaixo. Esta assinatura é obrigatória.
              </p>
              
              <div 
                className="signature-container"
                ref={signatureContainerRef}
              >
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: 'signature-canvas',
                    width: typeof window !== 'undefined' && window.innerWidth < 768 
                      ? Math.min(window.innerWidth - 100, 600)
                      : 800,
                    height: typeof window !== 'undefined' && window.innerWidth < 768 
                      ? Math.min(300, window.innerHeight * 0.3)
                      : 300
                  }}
                  backgroundColor="#ffffff"
                  penColor="#000000"
                  velocityFilterWeight={0.7}
                  minWidth={1.5}
                  maxWidth={3}
                  throttle={16}
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
              <h2>Verificação Facial <span style={{ color: '#dc2626', fontSize: '0.8em' }}>(Obrigatório)</span></h2>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                Tire uma foto para verificação de identidade. Esta verificação é obrigatória.
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
                  <div style={{ 
                    width: '100%', 
                    maxWidth: '640px', 
                    position: 'relative',
                    border: '2px solid #dc2626',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#000',
                    minHeight: '300px',
                    marginBottom: '15px'
                  }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '300px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    {!streamRef.current && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        textAlign: 'center'
                      }}>
                        Carregando câmera...
                      </div>
                    )}
                  </div>
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
                      disabled={submitting || !streamRef.current}
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
                  disabled={
                    submitting || 
                    !signatureRef.current || 
                    signatureRef.current.isEmpty() || 
                    !fotoBase64
                  }
                  style={{ 
                    width: '100%', 
                    fontSize: '18px', 
                    padding: '15px',
                    opacity: (!signatureRef.current || signatureRef.current.isEmpty() || !fotoBase64) ? 0.6 : 1,
                    cursor: (!signatureRef.current || signatureRef.current.isEmpty() || !fotoBase64) ? 'not-allowed' : 'pointer'
                  }}
                  title={
                    (!signatureRef.current || signatureRef.current.isEmpty()) && !fotoBase64
                      ? 'Complete a assinatura e tire uma foto para continuar'
                      : !signatureRef.current || signatureRef.current.isEmpty()
                      ? 'Complete a assinatura para continuar'
                      : !fotoBase64
                      ? 'Tire uma foto para continuar'
                      : 'Confirmar assinatura e verificação facial'
                  }
                >
                  {submitting ? 'Salvando...' : 'Confirmar Assinatura e Verificação Facial'}
                </button>
                {(!signatureRef.current || signatureRef.current.isEmpty() || !fotoBase64) && (
                  <p style={{ 
                    marginTop: '15px', 
                    color: '#dc2626', 
                    fontSize: '14px', 
                    textAlign: 'center',
                    fontWeight: '500'
                  }}>
                    {(!signatureRef.current || signatureRef.current.isEmpty()) && !fotoBase64
                      ? '⚠️ Complete a assinatura e tire uma foto para continuar'
                      : !signatureRef.current || signatureRef.current.isEmpty()
                      ? '⚠️ Complete a assinatura para continuar'
                      : '⚠️ Tire uma foto para continuar'}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Assinar;

