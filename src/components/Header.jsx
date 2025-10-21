// src/components/Header.jsx
import '../styles/Header.css'
import logo from '../assets/frota-logo.svg' 

// Componente Header corrigido
function Header({ current, onNavigate, onLogout }) {
  const dataAtual = new Date();
  const ano = dataAtual.getFullYear(); 
  const mes = String(dataAtual.getMonth() + 1).padStart(2, '0'); 
  const dia = String(dataAtual.getDate()).padStart(2, '0'); 
  const dataFormatada = `${dia}/${mes}/${ano}`;

  return (
    <header className="topbar">
      <div className="container topbar__inner">
        <div className="brand" href="#">
            <img src={logo} alt="Frota Viva" className="brand__logo"/>
          <strong>Frota Viva</strong>
          <span className="muted">{dataFormatada}</span>
        </div>
        <nav className="nav">
          {['relatorios','veiculos','entregas'].map(key => (
            <a key={key}
               href="#"
               className={`nav__item ${current===key? 'nav__item--active':''}`}
               onClick={(e)=>{e.preventDefault(); onNavigate(key)}}>
              {key==='relatorios'?'Relatórios': key==='veiculos'?'Veículos':'Entregas'}
            </a>
          ))}
        </nav>
        <div className="actions">
          <button 
            className="btn btn--ghost avatar__btn" 
            onClick={() => onNavigate('perfil')}
          >
            <div className="avatar__img">👤</div>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header
