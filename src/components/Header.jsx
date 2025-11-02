// src/components/Header.jsx
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/Header.css'
import logo from '../assets/frota-logo.svg'

// Componente Header corrigido
function Header({ current, onNavigate, onLogout, usuario }) {
  const [userProfile, setUserProfile] = useState({
    displayName: '',
    photoURL: ''
  });

  const dataAtual = new Date();
  const ano = dataAtual.getFullYear();
  const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
  const dia = String(dataAtual.getDate()).padStart(2, '0');
  const dataFormatada = `${dia}/${mes}/${ano}`;

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        // Tentar carregar do Firestore primeiro
        const userDoc = await getDoc(doc(db, 'driver', currentUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserProfile({
            displayName: userData.displayName || currentUser.displayName || usuario?.nome || 'Usuário',
            photoURL: userData.photoUrl || currentUser.photoURL || ''
          });
        } else {
          // Fallback para dados do Auth
          setUserProfile({
            displayName: currentUser.displayName || usuario?.nome || 'Usuário',
            photoURL: currentUser.photoURL || ''
          });
        }
      } catch (error) {
        console.error('Erro ao carregar perfil do usuário:', error);
        setUserProfile({
          displayName: usuario?.nome || 'Usuário',
          photoURL: ''
        });
      }
    }
  };

  const getProfileImageSrc = () => {
    if (userProfile.photoURL) {
      return userProfile.photoURL;
    }
    return null; // Retorna null para usar o emoji padrão
  };

  return (
    <header className="topbar">
      <div className="container topbar__inner">
        <div className="brand" href="#">
          <img src={logo} alt="Frota Viva" className="brand__logo" />
          <strong>Frota Viva</strong>
          <span className="muted">{dataFormatada}</span>
        </div>
        <nav className="nav">
          {['relatorios', 'veiculos', 'entregas', 'bi'].map(key => (
            <a key={key}
              href="#"
              className={`nav__item ${current === key ? 'nav__item--active' : ''}`}
              onClick={(e) => { e.preventDefault(); onNavigate(key) }}>
              {key === 'relatorios' ? 'Relatórios' : key === 'veiculos' ? 'Veículos' : key === 'entregas' ? 'Entregas' : 'BI'}
            </a>
          ))}
        </nav>
        <div className="actions">
          <div className="user-info">
            <span className="user-name">{userProfile.displayName}</span>
            <button
              className="btn btn--ghost avatar__btn"
              onClick={() => onNavigate('perfil')}
              title="Perfil do usuário"
            >
              <div className="avatar__img">
                {getProfileImageSrc() ? (
                  <img
                    src={getProfileImageSrc()}
                    alt="Foto de perfil"
                    className="avatar__photo"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <span className="avatar__fallback" style={{ display: getProfileImageSrc() ? 'none' : 'block' }}>
                  👤
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header
