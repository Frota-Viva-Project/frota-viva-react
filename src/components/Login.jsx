import React, { useState } from 'react'
import logo from '../assets/frota-logo.svg'
import { loginWithEmailAndPassword } from '../Utils/Login'

function Login({ onLogin, onNavigateToCadastro }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    
    try {
      const resultado = await loginWithEmailAndPassword(email, senha)
      
      if (resultado.success) {
        const token = await resultado.user.getIdToken()
        const dadosUsuario = {
          nome: resultado.user.displayName || 'Usuário',
          email: resultado.user.email,
          uid: resultado.user.uid,
          token: token
        }

        // Salvar token no localStorage também
        try {
          localStorage.setItem('frotaViva_token', token)
        } catch (storageError) {
          console.warn('Erro ao salvar token no localStorage:', storageError)
        }

        onLogin({
          sucesso: true,
          token: token,
          usuario: dadosUsuario
        })
      } else {
        setErro('Email ou senha incorretos. Tente novamente.')
      }
    } catch (erro) {
      console.error('Erro no login:', erro)
      setErro('Erro ao fazer login. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }
  
  return (
    <div className="auth">
      <div className="auth__left">
        <div className="auth__logo">
          <img src={logo} alt="" className='auth__image'/>
          <div className="auth__logo-text">FROTA VIVA</div>
        </div>
      </div>
      <div className="auth__right">
        <div className="auth__form">
          <h1>Bem vindo de volta!</h1>
          <p className="auth__subtitle">Insira seu email e senha para acessar o app</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form__group">
              <input 
                type="email" 
                className="input" 
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form__group">
              <input 
                type="password" 
                className="input" 
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            
            {erro && <p className="auth__error">{erro}</p>}
            
            <a href="#" className="auth__link" onClick={(e) => { e.preventDefault(); onNavigateToCadastro(); }}>
              Criar uma conta
            </a>
            
            <button type="submit" className="btn btn--primary btn--full" disabled={carregando}>
              {carregando ? 'Entrando...' : 'Acessar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login