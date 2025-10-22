// App.jsx
import './App.css'
import { useState } from 'react'
import SplashScreen from './components/SplashScreen.jsx'
import Login from './components/Login.jsx'
import CadastroScreen from './components/Cadastro.jsx'
import Header from './components/Header.jsx'
import Dashboard from './components/Dashboard.jsx'
import Deliveries from './components/Deliveries.jsx'
import Vehicles from './components/Vehicles.jsx'
import ProfilePage from './components/ProfilePage.jsx'
import Rotas from './components/Rotas.jsx'


export default function App() {
  const [tela, setTela] = useState('splash')
  const [page, setPage] = useState('relatorios')
  const [usuario, setUsuario] = useState(null)
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null)
  
  const handleLogin = (resultado) => {
    setUsuario(resultado.usuario)
    setTela('app')
  }
  
  const handleCadastro = () => {
    setTela('login')
  }
  
  const handleLogout = () => {
    setUsuario(null)
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

  if (tela === 'splash') {
    return <SplashScreen onComplete={() => setTela('login')} />
  }
  
  if (tela === 'login') {
    return <Login onLogin={handleLogin} onNavigateToCadastro={() => setTela('cadastro')} />
  }
  
  if (tela === 'cadastro') {
    return <CadastroScreen onVoltar={() => setTela('login')} onCadastro={handleCadastro} />
  }

  return (
    <div>
      <Header current={page} onNavigate={setPage} onLogout={handleLogout} />
      {page === 'relatorios' && <Dashboard />}
      {page === 'entregas' && <Deliveries onViewRoute={handleViewRoute} />}
      {page === 'veiculos' && <Vehicles />}
      {page === 'perfil' && <ProfilePage usuario={usuario} onLogout={handleLogout} />}
      {page === 'rotas' && <Rotas deliveryId={selectedDeliveryId} onBack={handleBackFromRotas} />}
    </div>
  )
}