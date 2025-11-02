// App.jsx
import './App.css'
import { useState, useEffect } from 'react'
import SplashScreen from './components/SplashScreen.jsx'
import Login from './components/Login.jsx'
import CadastroScreen from './components/Cadastro.jsx'
import Header from './components/Header.jsx'
import Dashboard from './components/Dashboard.jsx'
import Deliveries from './components/Deliveries.jsx'
import Vehicles from './components/Vehicles.jsx'
import ProfilePage from './components/ProfilePage.jsx'
import Rotas from './components/Rotas.jsx'
import BI from './components/BI.jsx'

import { auth } from './Utils/Login.js'
import { onAuthStateChanged } from 'firebase/auth'

// Funções para gerenciar localStorage
const salvarUsuarioLocalStorage = (usuario) => {
  try {
    localStorage.setItem('frotaViva_usuario', JSON.stringify(usuario))
    localStorage.setItem('frotaViva_loginTime', Date.now().toString())
    if (usuario.token) {
      localStorage.setItem('frotaViva_token', usuario.token)
    }
  } catch (error) {
    console.error('Erro ao salvar usuário no localStorage:', error)
  }
}

const obterUsuarioLocalStorage = () => {
  try {
    const usuario = localStorage.getItem('frotaViva_usuario')
    const loginTime = localStorage.getItem('frotaViva_loginTime')

    if (usuario && loginTime) {
      const tempoDecorrido = Date.now() - parseInt(loginTime)
      const TEMPO_EXPIRACAO = 7 * 24 * 60 * 60 * 1000 // 7 dias em millisegundos

      if (tempoDecorrido < TEMPO_EXPIRACAO) {
        return JSON.parse(usuario)
      } else {
        // Token expirado, limpar localStorage
        limparUsuarioLocalStorage()
      }
    }
  } catch (error) {
    console.error('Erro ao obter usuário do localStorage:', error)
  }
  return null
}

const limparUsuarioLocalStorage = () => {
  try {
    localStorage.removeItem('frotaViva_usuario')
    localStorage.removeItem('frotaViva_loginTime')
    localStorage.removeItem('frotaViva_token')
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error)
  }
}

export default function App() {
  const [tela, setTela] = useState('splash')
  const [page, setPage] = useState('relatorios')
  const [usuario, setUsuario] = useState(null)
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null)
  const [verificandoLogin, setVerificandoLogin] = useState(true)

  // Verificar se há usuário salvo no localStorage e validar com Firebase
  useEffect(() => {
    const verificarAutenticacao = () => {
      // Listener para mudanças no estado de autenticação do Firebase
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          // Usuário autenticado no Firebase
          console.log('✅ Usuário autenticado no Firebase:', firebaseUser.email)

          const dadosUsuario = {
            nome: firebaseUser.displayName || 'Usuário',
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            token: await firebaseUser.getIdToken()
          }

          setUsuario(dadosUsuario)
          salvarUsuarioLocalStorage(dadosUsuario)
          setTela('app')
        } else {
          // Não há usuário autenticado no Firebase
          // Verificar se há dados salvos no localStorage
          const usuarioSalvo = obterUsuarioLocalStorage()

          if (usuarioSalvo) {
            console.log('⚠️ Usuário no localStorage mas não autenticado no Firebase')
            // Limpar dados inválidos
            limparUsuarioLocalStorage()
          }

          console.log('ℹ️ Redirecionando para login')
          setTela('login')
        }

        setVerificandoLogin(false)
      })

      // Cleanup function
      return unsubscribe
    }

    // Aguardar um pouco para mostrar a splash screen
    const timer = setTimeout(() => {
      const unsubscribe = verificarAutenticacao()

      // Verificar token periodicamente (a cada 30 minutos)
      const tokenCheckInterval = setInterval(() => {
        const usuarioSalvo = obterUsuarioLocalStorage()
        if (!usuarioSalvo) {
          console.log('⚠️ Token expirado, redirecionando para login')
          handleLogout()
        }
      }, 30 * 60 * 1000) // 30 minutos

      // Cleanup quando o componente for desmontado
      return () => {
        if (unsubscribe) unsubscribe()
        clearInterval(tokenCheckInterval)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleLogin = (resultado) => {
    console.log('🔐 Login realizado com sucesso:', resultado.usuario.nome)
    setUsuario(resultado.usuario)
    salvarUsuarioLocalStorage(resultado.usuario)
    setTela('app')

    // Mostrar mensagem de boas-vindas
    setTimeout(() => {
      console.log(`👋 Bem-vindo de volta, ${resultado.usuario.nome}!`)
    }, 500)
  }

  const handleCadastro = () => {
    setTela('login')
  }

  const handleLogout = () => {
    console.log('🚪 Fazendo logout...')
    setUsuario(null)
    limparUsuarioLocalStorage()
    setTela('login')
  }

  const handleViewRoute = (deliveryId) => {
    setSelectedDeliveryId(deliveryId)
    setPage('rotas')
  }

  const handleBackFromRotas = () => {
    setPage('entregas')
    setSelectedDeliveryId(null)
  }

  if (tela === 'splash' || verificandoLogin) {
    return <SplashScreen onComplete={() => { }} />
  }

  if (tela === 'login') {
    return <Login onLogin={handleLogin} onNavigateToCadastro={() => setTela('cadastro')} />
  }

  if (tela === 'cadastro') {
    return <CadastroScreen onVoltar={() => setTela('login')} onCadastro={handleCadastro} />
  }

  return (
    <div>
      <Header current={page} onNavigate={setPage} onLogout={handleLogout} usuario={usuario} />
      {page === 'relatorios' && <Dashboard />}
      {page === 'entregas' && <Deliveries onViewRoute={handleViewRoute} />}
      {page === 'veiculos' && <Vehicles />}
      {page === 'bi' && <BI />}
      {page === 'perfil' && <ProfilePage usuario={usuario} onLogout={handleLogout} />}
      {page === 'rotas' && <Rotas deliveryId={selectedDeliveryId} onBack={handleBackFromRotas} />}
    </div>
  )
}