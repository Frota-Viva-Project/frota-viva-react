import React, { useState } from 'react'
import '../styles/Vehicle.css'

function Vehicles() {
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [agendamentoData, setAgendamentoData] = useState({
    tipo: '',
    local: '',
    descricao: '',
    responsavel: '',
    prioridade: 'media'
  })
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  
  // Dados mockados dos veículos
  const vehicles = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    placa: `XYZ-${1000 + i}`,
    modelo: i % 3 === 0 ? 'Volvo VM' : i % 3 === 1 ? 'Scania R450' : 'Mercedes Actros',
    motorista: ['Alex', 'João', 'Maria', 'Pedro', 'Carlos'][i % 5],
    status: i % 4 === 0 ? 'Inativo' : 'Ativo',
    ano: 2020 + (i % 5),
    km: (50000 + i * 5000).toLocaleString('pt-BR'),
    combustivel: 75 - (i * 5),
    capacidade: 15 + (i % 3) * 5,
    ultimaManutencao: `${10 + (i % 20)}/09/2025`,
    proximaManutencao: `${15 + (i % 15)}/11/2025`,
    custoManutencao: (3500 + i * 250).toLocaleString('pt-BR'),
    historico: [
      { data: '15/09/2025', descricao: 'Troca de óleo', valor: '450,00' },
      { data: '10/08/2025', descricao: 'Revisão completa', valor: '1.200,00' },
      { data: '22/07/2025', descricao: 'Troca de pneus', valor: '2.800,00' }
    ]
  }))
  
  // Gerar calendário do mês atual
  const getMonthData = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1
    
    return { year, month, firstDay: adjustedFirstDay, daysInMonth }
  }
  
  const changeMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }
  
  const { year, month, firstDay, daysInMonth } = getMonthData(currentDate)
  const selectedMonth = `${monthNames[month]}, ${year}`
  
  const handleViewVehicle = (vehicle) => {
    setSelectedVehicle(vehicle)
  }
  
  const handleCloseModal = () => {
    setSelectedVehicle(null)
  }
  
  const handleAgendarManutencao = () => {
    setShowAgendamentoModal(true)
  }
  
  const handleCloseAgendamento = () => {
    setShowAgendamentoModal(false)
    setSelectedDate(null)
    setCurrentDate(new Date())
    setAgendamentoData({
      tipo: '',
      local: '',
      descricao: '',
      responsavel: '',
      prioridade: 'media'
    })
  }
  
  const handleSubmitAgendamento = (e) => {
    e.preventDefault()
    console.log('Agendamento:', { ...agendamentoData, data: selectedDate }, 'Veículo:', selectedVehicle)
    alert(`Manutenção agendada com sucesso para ${selectedVehicle.placa}!`)
    handleCloseAgendamento()
    setSelectedVehicle(null)
  }
  
  return (
    <>
      <main className="container panels">
        <div className="card panel">
          <div className="panel__header">Veículos</div>
          <table>
            <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Motorista</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.placa}</td>
                  <td>{vehicle.modelo}</td>
                  <td>{vehicle.motorista}</td>
                  <td>
                    <span className={`tag ${vehicle.status.toLowerCase()}`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn--ghost btn--xs"
                      onClick={() => handleViewVehicle(vehicle)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      
      {selectedVehicle && !showAgendamentoModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhes do Veículo</h2>
              <button className="btn btn--ghost btn--xs modal-close" onClick={handleCloseModal}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="vehicle-details">
                <div className="detail-section">
                  <h3>Informações Básicas</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Placa:</span>
                      <span className="detail-value">{selectedVehicle.placa}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Modelo:</span>
                      <span className="detail-value">{selectedVehicle.modelo}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Motorista:</span>
                      <span className="detail-value">{selectedVehicle.motorista}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`tag ${selectedVehicle.status.toLowerCase()}`}>{selectedVehicle.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Especificações Técnicas</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Ano:</span>
                      <span className="detail-value">{selectedVehicle.ano}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Quilometragem:</span>
                      <span className="detail-value">{selectedVehicle.km} km</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Combustível:</span>
                      <span className="detail-value">{selectedVehicle.combustivel}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Capacidade:</span>
                      <span className="detail-value">{selectedVehicle.capacidade} ton</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Manutenção</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Última Manutenção:</span>
                      <span className="detail-value">{selectedVehicle.ultimaManutencao}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Próxima Manutenção:</span>
                      <span className="detail-value">{selectedVehicle.proximaManutencao}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Custo Total:</span>
                      <span className="detail-value">R$ {selectedVehicle.custoManutencao}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Histórico Recente</h3>
                  <div className="history-list">
                    {selectedVehicle.historico.map((item, i) => (
                      <div key={i} className="history-item">
                        <span className="history-date">{item.data}</span>
                        <span className="history-desc">{item.descricao}</span>
                        <span className="history-value">R$ {item.valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn--ghost" onClick={handleCloseModal}>Fechar</button>
              <button className="btn btn--primary" onClick={handleAgendarManutencao}>Agendar Manutenção</button>
            </div>
          </div>
        </div>
      )}
      
      {showAgendamentoModal && selectedVehicle && (
        <div className="modal-overlay-agenda" onClick={handleCloseAgendamento}>
          <div className="modal-agenda" onClick={(e) => e.stopPropagation()}>
            <div className="modal-agenda-header">
              <h2>Agendar Manutenção do Veículo [{selectedVehicle.placa} - {selectedVehicle.modelo}]</h2>
              <button className="modal-agenda-close" onClick={handleCloseAgendamento}>✕</button>
            </div>
            
            <div className="modal-agenda-body">
              <div className="calendar-section">
                <div className="calendar-header">
                  <button type="button" className="calendar-nav" onClick={() => changeMonth(-1)}>◄</button>
                  <span className="calendar-month">{selectedMonth}</span>
                  <button type="button" className="calendar-nav" onClick={() => changeMonth(1)}>►</button>
                </div>
                
                <div className="calendar">
                  <div className="calendar-weekdays">
                    {['Seg','Ter','Qua','Qui','Sex','Sab','Dom'].map(day => (
                      <div key={day} className="calendar-weekday">{day}</div>
                    ))}
                  </div>
                  <div className="calendar-days">
                    {Array.from({length: 35}).map((_, i) => {
                      const dayNum = i - firstDay + 1
                      const isValidDay = dayNum > 0 && dayNum <= daysInMonth
                      const isSelected = isValidDay && selectedDate === dayNum
                      const isToday = isValidDay && 
                        dayNum === new Date().getDate() && 
                        month === new Date().getMonth() && 
                        year === new Date().getFullYear()
                      
                      return (
                        <button
                          key={i}
                          type="button"
                          className={`calendar-day ${isSelected ? 'selected' : ''} ${!isValidDay ? 'empty' : ''} ${isToday ? 'today' : ''}`}
                          onClick={() => isValidDay && setSelectedDate(dayNum)}
                          disabled={!isValidDay}
                        >
                          {isValidDay ? dayNum : ''}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
              
              <div className="form-fields">
                <div className="form-group">
                  <label>Informe o Tipo da Manutenção:</label>
                  <select 
                    value={agendamentoData.tipo}
                    onChange={(e) => setAgendamentoData({...agendamentoData, tipo: e.target.value})}
                    required
                  >
                    <option value="">Selecionar</option>
                    <option value="preventiva">Preventiva</option>
                    <option value="corretiva">Corretiva</option>
                    <option value="revisao">Revisão</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Informe o Local da Manutenção:</label>
                  <input 
                    type="text"
                    placeholder="Digite o local"
                    value={agendamentoData.local}
                    onChange={(e) => setAgendamentoData({...agendamentoData, local: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Descreva o Problema:</label>
                  <input 
                    type="text"
                    placeholder="Descreva aqui"
                    value={agendamentoData.descricao}
                    onChange={(e) => setAgendamentoData({...agendamentoData, descricao: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Responsável pelo Agendamento:</label>
                  <input 
                    type="text"
                    placeholder="Seu nome"
                    value={agendamentoData.responsavel}
                    onChange={(e) => setAgendamentoData({...agendamentoData, responsavel: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Prioridade da Manutenção:</label>
                  <div className="radio-options">
                    <label className="radio-option">
                      <input 
                        type="radio"
                        name="prioridade"
                        value="baixa"
                        checked={agendamentoData.prioridade === 'baixa'}
                        onChange={(e) => setAgendamentoData({...agendamentoData, prioridade: e.target.value})}
                      />
                      <span>Baixa</span>
                    </label>
                    <label className="radio-option">
                      <input 
                        type="radio"
                        name="prioridade"
                        value="media"
                        checked={agendamentoData.prioridade === 'media'}
                        onChange={(e) => setAgendamentoData({...agendamentoData, prioridade: e.target.value})}
                      />
                      <span>Média</span>
                    </label>
                    <label className="radio-option">
                      <input 
                        type="radio"
                        name="prioridade"
                        value="alta"
                        checked={agendamentoData.prioridade === 'alta'}
                        onChange={(e) => setAgendamentoData({...agendamentoData, prioridade: e.target.value})}
                      />
                      <span>Alta</span>
                    </label>
                  </div>
                </div>
                
                <button type="button" className="btn-submit" onClick={handleSubmitAgendamento}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Vehicles