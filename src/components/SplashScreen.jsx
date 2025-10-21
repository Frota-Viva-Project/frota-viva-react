// src/components/SplashScreen.jsx
import React from "react";
import '../styles/SplashScreen.css';
import logo from '../assets/frota-logo.svg'

function SplashScreen({ onComplete }) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="splash">
      <div className="splash__content">
        {/* LOGO */}
        {/* Aqui vai o código do inline SVG */}
        <div className="splash__logo">
          <img src={logo} alt="" />
        </div>

        {/* TEXTO */}
        <div className="splash__text">
          <span className="splash__letter">F</span>
          <span className="splash__letter">R</span>
          <span className="splash__letter">O</span>
          <span className="splash__letter">T</span>
          <span className="splash__letter">A</span>
          <span className="splash__space"></span>
          <span className="splash__letter">V</span>
          <span className="splash__letter">I</span>
          <span className="splash__letter">V</span>
          <span className="splash__letter">A</span>
        </div>

        <div className="splash__tagline">Gestão Inteligente de Frotas</div>

        {/* Loader */}
        <div className="splash__loader">
          <div className="loader__bar"></div>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
