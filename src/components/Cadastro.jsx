import React, { useState } from 'react'
import logo from '../assets/frota-logo.svg'
import { registerUser } from '../firebase/config'

function Cadastro({ onVoltar, onCadastro }) {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [dados, setDados] = useState({
    nome: '',
    razaoSocial: '',
    cnpj: '',
    endereco: '',
    complemento: '',
    telefone: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  })
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setCarregando(true)
    setErro('')
    
    if (dados.senha !== dados.confirmarSenha) {
      setErro('As senhas não coincidem!')
      setCarregando(false)
      return
    }
    
    if (dados.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres!')
      setCarregando(false)
      return
    }
    
    try {
      const resultado = await registerUser(dados.email, dados.senha, {
        nome: dados.nome,
        razaoSocial: dados.razaoSocial,
        cnpj: dados.cnpj,
        endereco: dados.endereco,
        complemento: dados.complemento,
        telefone: dados.telefone
      })
      
      if (resultado.success) {
        alert('Cadastro realizado com sucesso!')
        onCadastro()
      } else {
        if (resultado.error.includes('email-already-in-use')) {
          setErro('Este email já está cadastrado!')
        } else if (resultado.error.includes('invalid-email')) {
          setErro('Email inválido!')
        } else if (resultado.error.includes('weak-password')) {
          setErro('Senha muito fraca!')
        } else {
          setErro('Erro ao cadastrar. Tente novamente.')
        }
      }
    } catch (erro) {
      setErro('Erro ao cadastrar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }
  
  const handleChange = (campo, valor) => {
    setDados(prev => ({ ...prev, [campo]: valor }))
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
          <h1>Bem vindo ao Frota Viva!</h1>
          <p className="auth__subtitle">Cadastre sua empresa para acessar o app</p>
          
          <form onSubmit={handleSubmit}>
            <div className="form__group">
              <input 
                type="text" 
                className="input" 
                placeholder="Nome"
                value={dados.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                required
              />
            </div>
            
            <div className="form__group">
              <input 
                type="text" 
                className="input" 
                placeholder="Razão Social"
                value={dados.razaoSocial}
                onChange={(e) => handleChange('razaoSocial', e.target.value)}
                required
              />
            </div>
            
            <div className="form__group">
              <input 
                type="text" 
                className="input" 
                placeholder="CNPJ"
                value={dados.cnpj}
                onChange={(e) => handleChange('cnpj', e.target.value)}
                required
              />
            </div>
            
            <div className="form__group">
              <input 
                type="text" 
                className="input" 
                placeholder="Endereço"
                value={dados.endereco}
                onChange={(e) => handleChange('endereco', e.target.value)}
                required
              />
            </div>
            
            <div className="form__group">
              <input 
                type="text" 
                className="input" 
                placeholder="Complemento"
                value={dados.complemento}
                onChange={(e) => handleChange('complemento', e.target.value)}
              />
            </div>
            
            <div className="form__group">
              <input 
                type="tel" 
                className="input" 
                placeholder="Telefone com DDD"
                value={dados.telefone}
                onChange={(e) => handleChange('telefone', e.target.value)}
                required
              />
            </div>
            
            <div className="form__group">
              <input 
                type="email" 
                className="input" 
                placeholder="Email"
                value={dados.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>
            
            <div className="form__group">
              <input 
                type="password" 
                className="input" 
                placeholder="Senha (mínimo 6 caracteres)"
                value={dados.senha}
                onChange={(e) => handleChange('senha', e.target.value)}
                required
              />
            </div>
            
            <div className="form__group">
              <input 
                type="password" 
                className="input" 
                placeholder="Confirmar Senha"
                value={dados.confirmarSenha}
                onChange={(e) => handleChange('confirmarSenha', e.target.value)}
                required
              />
            </div>
            
            {erro && <p className="auth__error">{erro}</p>}
            
            <div className="auth__actions">
              <button type="button" className="btn btn--ghost btn--full" onClick={onVoltar}>
                Já Possuo Conta
              </button>
              <button type="submit" className="btn btn--primary btn--full" disabled={carregando}>
                {carregando ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Cadastro