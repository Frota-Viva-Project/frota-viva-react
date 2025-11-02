// src/components/Deliveries.jsx
import { useState } from 'react';
import { criarAlerta } from '../Utils/ManipuladorApi';
import '../styles/Deliveries.css'

function Deliveries({ onViewRoute }) {
  const [alertModal, setAlertModal] = useState(null);
  const [contactModal, setContactModal] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alertError, setAlertError] = useState('');

  const handleViewRoute = (deliveryId) => {
    onViewRoute(deliveryId);
  };

  const handleAlert = (deliveryIndex) => {
    setAlertModal(deliveryIndex);
    setAlertMessage('');
    setShowSuccess(false);
    setAlertError('');
    setIsLoading(false);
  };

  const handleContact = (deliveryIndex) => {
    setContactModal(deliveryIndex);
    setShowContactInfo(false);
  };

  const sendAlert = async () => {
    if (!alertMessage.trim()) return;

    setIsLoading(true);
    setAlertError('');

    try {
      // Usar o índice do modal + 1 como ID do caminhão (simulando)
      const caminhaoId = alertModal + 1;

      console.log(`📢 Enviando alerta para caminhão ${caminhaoId}:`, alertMessage);

      // Chamar a API para criar o alerta
      const resultado = await criarAlerta(caminhaoId, {
        titulo: 'Alerta do Despachante',
        categoria: 'AVISO',
        descricao: alertMessage.trim()
      });

      console.log('✅ Alerta criado com sucesso:', resultado);

      setShowSuccess(true);
      setTimeout(() => {
        setAlertModal(null);
        setShowSuccess(false);
        setAlertMessage('');
        setIsLoading(false);
      }, 2000);

    } catch (error) {
      console.error('❌ Erro ao criar alerta:', error);
      setAlertError('Erro ao enviar alerta. Tente novamente.');
      setIsLoading(false);
    }
  };

  const showContactDetails = () => {
    setShowContactInfo(true);
  };

  return (
    <main className="container panels">
      <div className="card panel deliveries__panel">
        <div className="panel__header">
          <span>Entregas</span>
          <select className="input input--select">
            <option>Selecionar</option>
          </select>
        </div>
        <div className="deliveries__grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="delivery__card">
              <div className="delivery__header">
                <div className="delivery__driver">
                  <span className="avatar">👤</span>
                  <span>Pedro Henrique Vicente Duarte</span>
                </div>
                <span className="delivery__id">Entrega #{i}0002</span>
              </div>
              <div className="delivery__details">
                <div className="detail__row">
                  <span className="label">CNPJ:</span>
                  <span>24-O</span>
                </div>
                <div className="detail__row">
                  <span className="label">Veículo Origem:</span>
                  <span>SP</span>
                </div>
                <div className="detail__row">
                  <span className="label">DIANHTTYV</span>
                  <span></span>
                </div>
                <div className="detail__row">
                  <span className="label">Reunião</span>
                  <span>Conosco</span>
                </div>
              </div>
              <div className="delivery__actions">
                <button
                  className="btn btn--navy"
                  onClick={() => handleViewRoute(i + 1)}
                >
                  Ver Rota
                </button>
                <button
                  className="btn btn--navy"
                  onClick={() => handleAlert(i)}
                >
                  Alertar Motorista
                </button>
                <button
                  className="btn btn--navy"
                  onClick={() => handleContact(i)}
                >
                  Contatar Motorista
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Alert Modal */}
      {alertModal !== null && (
        <div className="modal-overlay" onClick={() => setAlertModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Criar Alerta</h2>
              <button
                className="modal__close"
                onClick={() => setAlertModal(null)}
              >
                ✕
              </button>
            </div>
            {!showSuccess ? (
              <div className="modal__content">
                <label className="modal__label">Escreva o Alerta</label>
                <textarea
                  className="modal__textarea"
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows="4"
                  disabled={isLoading}
                />

                {alertError && (
                  <div className="alert-error" style={{
                    color: '#e53e3e',
                    fontSize: '14px',
                    marginBottom: '16px',
                    padding: '8px 12px',
                    backgroundColor: '#fed7d7',
                    borderRadius: '6px',
                    border: '1px solid #feb2b2'
                  }}>
                    {alertError}
                  </div>
                )}

                <button
                  className="btn btn--navy btn--full"
                  onClick={sendAlert}
                  disabled={!alertMessage.trim() || isLoading}
                  style={{
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></span>
                      Enviando...
                    </span>
                  ) : 'Enviar via API'}
                </button>
              </div>
            ) : (
              <div className="modal__success">
                <div className="success__icon">✓</div>
                <p className="success__text">Alerta Criado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {contactModal !== null && (
        <div className="modal-overlay" onClick={() => setContactModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Informações do Motorista</h2>
              <button
                className="modal__close"
                onClick={() => setContactModal(null)}
              >
                ✕
              </button>
            </div>
            {!showContactInfo ? (
              <div className="modal__content">
                <p className="modal__message">
                  Gostaria de visualizar as informações de contato do motorista?
                </p>
                <button
                  className="btn btn--navy btn--full"
                  onClick={showContactDetails}
                >
                  Visualizar
                </button>
              </div>
            ) : (
              <div className="modal__content">
                <div className="contact__info">
                  <div className="contact__row">
                    <span className="contact__label">Motorista:</span>
                    <span className="contact__value">Pedro Henrique Vicente Duarte</span>
                  </div>
                  <div className="contact__row">
                    <span className="contact__label">Telefone:</span>
                    <span className="contact__value">+55 (11) 96622-7529</span>
                  </div>
                  <div className="contact__row">
                    <span className="contact__label">Email:</span>
                    <span className="contact__value">pedro.duarte@frotaviva.com</span>
                  </div>
                  <div className="contact__row">
                    <span className="contact__label">Veículo:</span>
                    <span className="contact__value">BCD2E34</span>
                  </div>
                  <div className="contact__row">
                    <span className="contact__label">Status:</span>
                    <span className="contact__value status-active">🟢 Em andamento</span>
                  </div>
                  <div className="contact__row">
                    <span className="contact__label">Última atualização:</span>
                    <span className="contact__value">{new Date().toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default Deliveries;