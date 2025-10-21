// src/components/ProfilePage.jsx
import React, { useState } from 'react';
import '../styles/ProfilePage.css';

// Modal Editar Foto
function EditPhotoModal({ onClose, onConfirm }) {
  return (
    <div className="modal__overlay">
      <div className="modal__container">
        <div className="modal__header">
          <h2 className="modal__title">Editar Foto de Perfil</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <div className="photo__upload">
            <div className="photo__placeholder">
              Arraste uma imagem ou selecione um arquivo
            </div>
          </div>
          <button className="btn btn--secondary btn--full">Selecionar Arquivo</button>
          <button className="btn btn--primary btn--full">Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// Modal Editar Detalhes
function EditDetailsModal({ onClose, userData, onSave }) {
  const [selectedField, setSelectedField] = useState('');
  const [formData, setFormData] = useState({
    nome: userData.nome,
    email: userData.email,
    telefone: userData.telefone,
    senha: '',
    confirmarSenha: ''
  });

  const handleFieldChange = (e) => {
    setSelectedField(e.target.value);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal__overlay">
      <div className={`modal__container ${selectedField === 'senha' ? 'modal__container--large' : ''}`}>
        <div className="modal__header">
          <h2 className="modal__title">Editar Detalhes</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <select 
            className="form__select" 
            value={selectedField}
            onChange={handleFieldChange}
          >
            <option value="">Selecione</option>
            <option value="nome">Nome</option>
            <option value="email">E-mail</option>
            <option value="telefone">Telefone</option>
            <option value="senha">Senha</option>
          </select>

          {selectedField === 'nome' && (
            <div className="form__group">
              <label className="form__label">EDITAR SEU NOME</label>
              <input 
                type="text" 
                className="form__input"
                placeholder="Seu nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
              />
            </div>
          )}

          {selectedField === 'email' && (
            <div className="form__group">
              <label className="form__label">EDITAR SEU E-MAIL</label>
              <input 
                type="email" 
                className="form__input"
                placeholder="Seu email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
          )}

          {selectedField === 'telefone' && (
            <div className="form__group">
              <label className="form__label">EDITAR SEU TELEFONE</label>
              <input 
                type="tel" 
                className="form__input"
                placeholder="Seu telefone"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
              />
            </div>
          )}

          {selectedField === 'senha' && (
            <>
              <div className="form__group">
                <label className="form__label">EDITAR SUA SENHA</label>
                <input 
                  type="password" 
                  className="form__input"
                  placeholder="Nova senha"
                  value={formData.senha}
                  onChange={(e) => handleInputChange('senha', e.target.value)}
                />
              </div>
              <div className="form__group">
                <label className="form__label">CONFIRMAR SENHA</label>
                <input 
                  type="password" 
                  className="form__input"
                  placeholder="Confirme sua senha"
                  value={formData.confirmarSenha}
                  onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                />
              </div>
            </>
          )}

          {selectedField && (
            <button className="btn btn--primary btn--full">Confirmar</button>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal Desativar Conta
function DeactivateModal({ onClose, userName, onConfirm }) {
  const [confirmText, setConfirmText] = useState('');
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="modal__overlay">
      <div className="modal__container">
        <div className="modal__header">
          <h2 className="modal__title">Desativar Conta</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <p className="modal__text">
            Atenção! Ao confirmar a ação a seguir, o único jeito de reativar sua conta será conversando com gestores ou superiores. Tem certeza da ação a seguir?
          </p>
          <label className="checkbox__label">
            <input 
              type="checkbox" 
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
            />
            <span>Eu estou ciente da desativação da minha conta</span>
          </label>
          <p className="modal__instruction">
            Para confirmar a desativação da conta, digite "{userName}" na caixa abaixo:
          </p>
          <input 
            type="text" 
            className="form__input"
            placeholder="Seu nome"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <button className="btn btn--primary btn--full">Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// Modal Apagar Conta
function DeleteModal({ onClose, userName, onConfirm }) {
  const [confirmName, setConfirmName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="modal__overlay">
      <div className="modal__container">
        <div className="modal__header">
          <h2 className="modal__title">Apagar Conta</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <p className="modal__text">
            Atenção! Ao confirmar a ação a seguir, tem ciência que sua conta será excluída totalmente, sem maneira alguma de recuperá-la. Tem certeza da ação a seguir?
          </p>
          <label className="checkbox__label">
            <input 
              type="checkbox" 
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
            />
            <span>Eu estou ciente da deleção da minha conta</span>
          </label>
          <p className="modal__instruction">
            Para confirmar a deleção da conta, digite "{userName}" na caixa abaixo:
          </p>
          <input 
            type="text" 
            className="form__input"
            placeholder="Seu nome"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
          />
          <p className="modal__instruction">
            Para confirmar a deleção da conta, digite sua senha na caixa abaixo:
          </p>
          <input 
            type="password" 
            className="form__input"
            placeholder="Sua senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button className="btn btn--primary btn--full">Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// Página de Perfil Principal
function ProfilePage({ usuario, onLogout }) {
  const [showEditPhoto, setShowEditPhoto] = useState(false);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const userData = {
    nome: usuario?.nome || 'Ronaldo da Silva Santos',
    email: usuario?.email || 'ronaldo.santos@frotaviva.com',
    telefone: usuario?.telefone || '+55 (11) 96622-7529',
    senha: '***********'
  };

  return (
    <main className="profile__page">
      <div className="profile__container">
        
        <div className="profile__avatar">
          <div className="avatar__circle">👤</div>
          <button 
            className="avatar__edit"
            onClick={() => setShowEditPhoto(true)}
          >
            ✏️
          </button>
        </div>

        <h1 className="profile__welcome">Bem-Vindo, {userData.nome.split(' ')[0]}!</h1>

        <div className="profile__content">
          <div className="profile__details">
            <div className="details__header">
              <h2 className="details__title">Detalhes</h2>
            </div>
            <div className="details__info">
              <p><strong>Nome:</strong> {userData.nome}</p>
              <p><strong>E-mail:</strong> {userData.email}</p>
              <p><strong>Telefone:</strong> {userData.telefone}</p>
              <p><strong>Senha:</strong> {userData.senha}</p>
            </div>
            <button 
              className="btn btn--details"
              onClick={() => setShowEditDetails(true)}
            >
              Editar Detalhes
            </button>

            <div className="profile__actions">
              <button 
                className="btn btn--danger"
                onClick={() => setShowDeactivate(true)}
              >
                Desativar Conta
              </button>
              <button 
                className="btn btn--danger"
                onClick={() => setShowDelete(true)}
              >
                Apagar Conta
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEditPhoto && (
        <EditPhotoModal onClose={() => setShowEditPhoto(false)} />
      )}

      {showEditDetails && (
        <EditDetailsModal 
          onClose={() => setShowEditDetails(false)}
          userData={userData}
        />
      )}

      {showDeactivate && (
        <DeactivateModal 
          onClose={() => setShowDeactivate(false)}
          userName={userData.nome}
        />
      )}

      {showDelete && (
        <DeleteModal 
          onClose={() => setShowDelete(false)}
          userName={userData.nome}
        />
      )}
    </main>
  );
}

export default ProfilePage;