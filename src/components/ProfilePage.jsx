// src/components/ProfilePage.jsx
import { useState, useRef, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import '../styles/ProfilePage.css';
import {
  updateUserName,
  updateUserEmail,
  updateUserPhone,
  updateUserPassword,
  updateUserPhoto
} from '../firebase/config';

// Modal Editar Foto
function EditPhotoModal({ onClose, onConfirm, currentUser }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Função para validar tipos de imagem
  const isValidImageFile = (file) => {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];
    return validTypes.includes(file.type.toLowerCase());
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && isValidImageFile(file)) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, GIF, WebP, BMP, TIFF)');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file && isValidImageFile(file)) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Por favor, arraste um arquivo de imagem válido (JPG, PNG, GIF, WebP, BMP, TIFF)');
    }
  };

  const updateProfilePhoto = async (photoURL) => {
    if (!currentUser) return;

    try {
      // Atualizar no Firebase Auth
      await updateProfile(currentUser, { photoURL });

      // Atualizar no Firestore
      await updateDoc(doc(db, 'driver', currentUser.uid), {
        photoUrl: photoURL,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar foto no Firebase:', error);
      return { success: false, error: error.message };
    }
  };

  // Função para redimensionar imagem
  const resizeImage = (file, maxWidth = 600, maxHeight = 600, quality = 0.7) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleConfirm = async () => {
    if (!selectedFile) {
      alert('Por favor, selecione uma imagem');
      return;
    }

    // Validar tipo de arquivo novamente
    if (!isValidImageFile(selectedFile)) {
      alert('Tipo de arquivo não suportado. Use JPG, PNG, GIF, WebP, BMP ou TIFF');
      return;
    }

    // Validar tamanho do arquivo (máximo 3MB)
    const maxSize = 3 * 1024 * 1024; // 3MB
    if (selectedFile.size > maxSize) {
      alert('Arquivo muito grande. Máximo permitido: 3MB');
      return;
    }

    setLoading(true);
    setUploadProgress(10);

    try {
      // Redimensionar imagem antes do upload para evitar timeout
      setUploadProgress(30);

      const resizedFile = await resizeImage(selectedFile);

      setUploadProgress(50);

      const result = await updateUserPhoto(currentUser, resizedFile);

      setUploadProgress(90);

      if (result.success) {
        setUploadProgress(100);
        alert('Foto de perfil atualizada com sucesso!');
        onConfirm(result.photoURL);
        onClose();
      } else {
        alert('Erro ao atualizar foto: ' + result.error);
      }
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      alert('Erro ao atualizar foto. Tente com uma imagem menor.');
    }

    setLoading(false);
    setUploadProgress(0);
  };

  const openCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const openGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal__container modal__container--photo" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Editar Foto de Perfil</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <div
            className="photo__upload"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              cursor: 'pointer',
              height: '250px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #ccc',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#f9f9f9'
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            ) : (
              <div className="photo__placeholder" style={{
                textAlign: 'center',
                color: '#666',
                padding: '20px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
                <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  Arraste uma imagem ou clique para selecionar
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/tiff"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/tiff"
            capture="environment"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {loading && (
            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              <div style={{
                width: '100%',
                height: '8px',
                background: '#e2e8f0',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '8px'
              }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #667eea, #764ba2)',
                  width: `${uploadProgress}%`,
                  transition: 'width 0.3s ease',
                  borderRadius: '4px'
                }}></div>
              </div>
              <span style={{ fontSize: '12px', color: '#667eea' }}>{uploadProgress}%</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button
              className="btn btn--secondary"
              onClick={openCamera}
              disabled={loading}
              style={{ flex: 1 }}
            >
              📷 Câmera
            </button>
            <button
              className="btn btn--secondary"
              onClick={openGallery}
              disabled={loading}
              style={{ flex: 1 }}
            >
              🖼️ Galeria
            </button>
          </div>

          <button
            className="btn btn--primary btn--full"
            onClick={handleConfirm}
            disabled={loading || !selectedFile}
            style={{ marginTop: '10px' }}
          >
            {loading ? `Enviando... ${uploadProgress}%` : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal Editar Detalhes
function EditDetailsModal({ onClose, userData, onSave, currentUser }) {
  const [selectedField, setSelectedField] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleConfirm = async () => {
    if (!selectedField) {
      alert('Por favor, selecione um campo para editar');
      return;
    }

    // Validações específicas
    if (selectedField === 'nome' && !formData.nome.trim()) {
      alert('Por favor, digite um nome válido');
      return;
    }

    if (selectedField === 'email' && !formData.email.includes('@')) {
      alert('Por favor, digite um e-mail válido');
      return;
    }

    if (selectedField === 'telefone' && !formData.telefone.trim()) {
      alert('Por favor, digite um telefone válido');
      return;
    }

    if (selectedField === 'senha' && (!formData.senha || !formData.confirmarSenha)) {
      alert('Por favor, preencha a senha e confirmação');
      return;
    }

    setLoading(true);
    let result;

    switch (selectedField) {
      case 'nome':
        result = await updateUserName(currentUser, formData.nome);
        break;
      case 'email':
        result = await updateUserEmail(currentUser, formData.email);
        break;
      case 'telefone':
        result = await updateUserPhone(currentUser, formData.telefone);
        break;
      case 'senha':
        result = await updateUserPassword(currentUser, formData.senha, formData.confirmarSenha);
        break;
      default:
        setLoading(false);
        return;
    }

    setLoading(false);

    if (result.success) {
      alert(result.message);
      if (selectedField !== 'senha') {
        onSave({ [selectedField]: formData[selectedField] });
      }
      onClose();
    } else {
      alert('Erro: ' + result.error);
    }
  };

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className={`modal__container ${selectedField === 'senha' ? 'modal__container--large' : ''}`} onClick={(e) => e.stopPropagation()}>
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
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>
                Nota: Você pode precisar fazer login novamente após alterar o e-mail
              </p>
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
                  placeholder="Nova senha (mínimo 6 caracteres)"
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
            <button
              className="btn btn--primary btn--full"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
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

  const handleConfirm = () => {
    if (!isChecked) {
      alert('Por favor, confirme que está ciente da desativação');
      return;
    }

    if (confirmText !== userName) {
      alert('O nome digitado não corresponde ao seu nome');
      return;
    }

    if (onConfirm) {
      onConfirm();
    }
    alert('Conta desativada com sucesso!');
    onClose();
  };

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal__container" onClick={(e) => e.stopPropagation()}>
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
            Para confirmar a desativação da conta, digite "<strong>{userName}</strong>" na caixa abaixo:
          </p>
          <input
            type="text"
            className="form__input"
            placeholder="Seu nome"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <button
            className="btn btn--primary btn--full"
            onClick={handleConfirm}
          >
            Confirmar
          </button>
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

  const handleConfirm = () => {
    if (!isChecked) {
      alert('Por favor, confirme que está ciente da deleção');
      return;
    }

    if (confirmName !== userName) {
      alert('O nome digitado não corresponde ao seu nome');
      return;
    }

    if (!confirmPassword) {
      alert('Por favor, digite sua senha');
      return;
    }

    if (onConfirm) {
      onConfirm();
    }
    alert('Conta apagada com sucesso!');
    onClose();
  };

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal__container" onClick={(e) => e.stopPropagation()}>
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
            Para confirmar a deleção da conta, digite "<strong>{userName}</strong>" na caixa abaixo:
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
          <button
            className="btn btn--primary btn--full"
            onClick={handleConfirm}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// Página de Perfil Principal
function ProfilePage({ usuario }) {
  const [showEditPhoto, setShowEditPhoto] = useState(false);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [userData, setUserData] = useState({
    nome: usuario?.displayName || usuario?.nome || 'Ronaldo da Silva Santos',
    email: usuario?.email || 'ronaldo.santos@frotaviva.com',
    telefone: usuario?.telefone || '+55 (11) 96622-7529',
    senha: '***********',
    photoURL: usuario?.photoURL || null
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        // Carregar dados do Firestore
        const userDoc = await getDoc(doc(db, 'driver', currentUser.uid));

        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          setUserData(prev => ({
            ...prev,
            nome: firestoreData.displayName || currentUser.displayName || prev.nome,
            email: currentUser.email || prev.email,
            photoURL: firestoreData.photoUrl || currentUser.photoURL || prev.photoURL
          }));
        } else {
          // Se não existe no Firestore, usar dados do Auth
          setUserData(prev => ({
            ...prev,
            nome: currentUser.displayName || prev.nome,
            email: currentUser.email || prev.email,
            photoURL: currentUser.photoURL || prev.photoURL
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    }
  };

  const getProfileImageSrc = () => {
    if (userData.photoURL) {
      return userData.photoURL;
    }
    return '/default-avatar.svg'; // Imagem padrão
  };

  const handleSaveDetails = (updatedData) => {
    setUserData(prev => ({ ...prev, ...updatedData }));
  };

  const handlePhotoUpdate = (photoURL) => {
    setUserData(prev => ({ ...prev, photoURL }));
  };

  return (
    <main className="profile__page">
      <div className="profile__container">

        <div className="profile__avatar">
          <div className="avatar__circle">
            {userData.photoURL ? (
              <img
                src={getProfileImageSrc()}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '50%'
                }}
                onError={(e) => {
                  e.target.src = '/default-avatar.svg';
                }}
              />
            ) : (
              '👤'
            )}
          </div>
          <button
            className="avatar__edit"
            onClick={() => setShowEditPhoto(true)}
            title="Editar foto de perfil"
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
        <EditPhotoModal
          onClose={() => setShowEditPhoto(false)}
          onConfirm={handlePhotoUpdate}
          currentUser={auth.currentUser}
        />
      )}

      {showEditDetails && (
        <EditDetailsModal
          onClose={() => setShowEditDetails(false)}
          userData={userData}
          onSave={handleSaveDetails}
          currentUser={usuario}
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