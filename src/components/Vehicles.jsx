import React, { useState, useEffect } from 'react'
import '../styles/Vehicle.css'
import { getTodosCaminhoes, getCaminhaoPorId, getManutencoesCaminhao, criarManutencao, getHistoricoVeiculo } from '../Utils/ManipuladorApi'

function Vehicles() {
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false)
  const [showHistoricoModal, setShowHistoricoModal] = useState(false)
  const [historicoManutencoes, setHistoricoManutencoes] = useState([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingVehicleDetails, setLoadingVehicleDetails] = useState(false)
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

  // Carregar veículos da API
  useEffect(() => {
    const carregarVeiculos = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log('🔄 Carregando veículos da API...')
        const caminhoes = await getTodosCaminhoes()

        console.log('✅ Caminhões recebidos da API:', caminhoes)

        if (caminhoes && caminhoes.length > 0) {
          // Enriquecer dados dos caminhões com informações de manutenção
          const caminhoesEnriquecidos = await Promise.all(
            caminhoes.map(async (caminhao) => {
              try {
                const manutencoes = await getManutencoesCaminhao(caminhao.id)
                const manutencoesConcluidas = manutencoes.filter(m => m.dataConclusao)
                const manutencoesPendentes = manutencoes.filter(m => !m.dataConclusao)

                const custoTotal = manutencoes.reduce((total, m) => total + (m.custo || 0), 0)

                const ultimaManutencao = manutencoesConcluidas.length > 0
                  ? new Date(Math.max(...manutencoesConcluidas.map(m => new Date(m.dataConclusao))))
                  : null

                const proximaManutencao = manutencoesPendentes.length > 0
                  ? new Date(Math.min(...manutencoesPendentes.map(m => new Date(m.dataInicio))))
                  : null

                return {
                  ...caminhao,
                  motorista: caminhao.motorista?.nome || 'Não atribuído',
                  status: caminhao.status || 'Ativo',
                  km: caminhao.quilometragem?.toLocaleString('pt-BR') || 'N/A',
                  combustivel: caminhao.nivelCombustivel || 0,
                  capacidade: caminhao.capacidadeCarga || 0,
                  ultimaManutencao: ultimaManutencao ? ultimaManutencao.toLocaleDateString('pt-BR') : 'N/A',
                  proximaManutencao: proximaManutencao ? proximaManutencao.toLocaleDateString('pt-BR') : 'N/A',
                  custoManutencao: custoTotal.toLocaleString('pt-BR'),
                  historico: manutencoesConcluidas && manutencoesConcluidas.length > 0
                    ? manutencoesConcluidas.slice(-3).map(m => ({
                      data: m.dataConclusao ? new Date(m.dataConclusao).toLocaleDateString('pt-BR') : 'N/A',
                      descricao: m.descServico || 'Sem descrição',
                      valor: (m.custo || 0).toLocaleString('pt-BR')
                    }))
                    : []
                }
              } catch (err) {
                console.warn(`⚠️ Erro ao carregar dados do caminhão ${caminhao.id}:`, err)
                return {
                  ...caminhao,
                  motorista: caminhao.motorista?.nome || 'Não atribuído',
                  status: caminhao.status || 'Ativo',
                  km: 'N/A',
                  combustivel: 0,
                  capacidade: 0,
                  ultimaManutencao: 'N/A',
                  proximaManutencao: 'N/A',
                  custoManutencao: '0',
                  historico: []
                }
              }
            })
          )

          setVehicles(caminhoesEnriquecidos)
        } else {
          console.log('⚠️ Nenhum caminhão encontrado na API')
          setVehicles([])
        }
      } catch (err) {
        console.error('❌ Erro ao carregar veículos da API:', err)
        setError('Erro ao carregar veículos da API. Verifique sua conexão.')
        setVehicles([])
      } finally {
        setLoading(false)
      }
    }

    carregarVeiculos()
  }, [])

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

  const handleViewVehicle = async (vehicle) => {
    try {
      console.log('🔄 Abrindo modal para veículo:', vehicle)
      setLoadingVehicleDetails(true)
      setSelectedVehicle(vehicle) // Definir dados básicos primeiro

      // Buscar dados detalhados do veículo da API
      try {
        console.log(`🔍 Buscando detalhes do veículo ID: ${vehicle.id}`)
        const vehicleDetails = await getCaminhaoPorId(vehicle.id)
        console.log('✅ Detalhes do veículo carregados da API:', vehicleDetails)

        if (vehicleDetails) {
          // Buscar manutenções do veículo
          const manutencoes = await getManutencoesCaminhao(vehicle.id)
          console.log('✅ Manutenções carregadas:', manutencoes)

          const manutencoesConcluidas = manutencoes.filter(m => m.dataConclusao)
          const custoTotal = manutencoes.reduce((total, m) => total + (m.custo || 0), 0)

          const ultimaManutencao = manutencoesConcluidas.length > 0
            ? new Date(Math.max(...manutencoesConcluidas.map(m => new Date(m.dataConclusao))))
            : null

          const historico = manutencoesConcluidas.slice(-3).map(m => ({
            data: m.dataConclusao ? new Date(m.dataConclusao).toLocaleDateString('pt-BR') : 'N/A',
            descricao: m.descServico || 'Sem descrição',
            valor: (m.custo || 0).toLocaleString('pt-BR')
          }))

          setSelectedVehicle({
            ...vehicle,
            ...vehicleDetails,
            motorista: vehicleDetails.motorista?.nome || vehicle.motorista,
            status: vehicleDetails.status || vehicle.status,
            km: vehicleDetails.quilometragem?.toLocaleString('pt-BR') || vehicle.km,
            combustivel: vehicleDetails.nivelCombustivel || vehicle.combustivel,
            capacidade: vehicleDetails.capacidadeCarga || vehicle.capacidade,
            ultimaManutencao: ultimaManutencao ? ultimaManutencao.toLocaleDateString('pt-BR') : 'N/A',
            custoManutencao: custoTotal.toLocaleString('pt-BR'),
            historico: historico
          })
        } else {
          console.log('⚠️ API retornou vazio, usando dados básicos do veículo')
          setSelectedVehicle(vehicle)
        }
      } catch (apiErr) {
        console.error('❌ Erro na API, usando dados básicos:', apiErr)
        setSelectedVehicle(vehicle)
      }
    } catch (err) {
      console.error('❌ Erro geral ao carregar detalhes do veículo:', err)
      setSelectedVehicle(vehicle)
    } finally {
      setLoadingVehicleDetails(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedVehicle(null)
  }

  const handleAgendarManutencao = () => {
    setShowAgendamentoModal(true)
  }

  const handleVerHistorico = async (vehicleId) => {
    try {
      setLoadingHistorico(true)
      setShowHistoricoModal(true)

      console.log(`🚛 Tentando buscar histórico para veículo ID: ${vehicleId}`)

      // Se o ID não for 4, vamos forçar o ID 4 para teste
      const idParaBuscar = vehicleId === 4 ? vehicleId : 4;

      if (idParaBuscar !== vehicleId) {
        console.log(`⚠️ ID ${vehicleId} não disponível, usando ID ${idParaBuscar} para teste`)
      }

      // Usar a função do ManipuladorApi que tem tratamento de erro e fallback
      const data = await getHistoricoVeiculo(idParaBuscar)
      console.log('📋 Dados recebidos da API:', data)

      // Processar os diferentes tipos de histórico
      const historicoCompleto = []

      // Processar histórico de modificações/manutenções
      if (data.historicoModificacoes && Array.isArray(data.historicoModificacoes)) {
        data.historicoModificacoes.forEach(modificacao => {
          historicoCompleto.push({
            dataInicio: modificacao.dataModificacao,
            tipo: 'Manutenção',
            descServico: modificacao.descricao || 'Manutenção realizada',
            local: modificacao.provedorServico || 'N/A',
            responsavel: 'Sistema',
            status: 'Concluída',
            custo: modificacao.custoTotal || 0,
            quilometragem: modificacao.quilometragem || 0,
            detalhes: modificacao.pecasTrocadas || []
          })
        })
      }

      // Processar histórico de acidentes
      if (data.historicoAcidentes && Array.isArray(data.historicoAcidentes)) {
        data.historicoAcidentes.forEach(acidente => {
          historicoCompleto.push({
            dataInicio: acidente.dataAcidente,
            tipo: 'Acidente',
            descServico: `${acidente.tipoAcidente} - ${acidente.descricao}`,
            local: 'N/A',
            responsavel: 'Seguro',
            status: acidente.seguroCobriu ? 'Coberto pelo Seguro' : 'Não Coberto',
            custo: acidente.custoReparo || 0,
            gravidade: acidente.gravidade,
            laudoTecnico: acidente.laudoTecnico
          })
        })
      }

      // Processar upgrades realizados
      if (data.upgradesRealizados && Array.isArray(data.upgradesRealizados)) {
        data.upgradesRealizados.forEach(upgrade => {
          historicoCompleto.push({
            dataInicio: upgrade.dataUpgrade,
            tipo: 'Upgrade',
            descServico: `${upgrade.tipoUpgrade} - ${upgrade.melhoriasEsperadas}`,
            local: 'Oficina Especializada',
            responsavel: 'Técnico',
            status: 'Concluído',
            custo: upgrade.custo || 0,
            componentes: upgrade.componentes || [],
            resultados: upgrade.resultadosObservados
          })
        })
      }

      // Ordenar por data (mais recente primeiro)
      historicoCompleto.sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio))

      console.log('📊 Histórico processado:', historicoCompleto)
      console.log(`✅ Total de registros: ${historicoCompleto.length}`)

      if (historicoCompleto.length === 0) {
        console.log('⚠️ Nenhum registro encontrado nos arrays da API')
      }

      setHistoricoManutencoes(historicoCompleto)

    } catch (error) {
      console.error('Erro ao carregar histórico:', error)

      // Mostrar informação mais detalhada sobre o erro
      let errorMessage = 'Erro ao carregar histórico de manutenções';
      if (error.message.includes('500')) {
        errorMessage = `Erro 500: Veículo ID ${vehicleId} não encontrado na API. Tente o botão.`;
      } else if (error.message.includes('404')) {
        errorMessage = `Erro 404: Endpoint não encontrado para veículo ID ${vehicleId}.`;
      } else {
        errorMessage = `Erro: ${error.message}`;
      }

      alert(errorMessage)
      setHistoricoManutencoes([])
    } finally {
      setLoadingHistorico(false)
    }
  }

  const handleCloseHistorico = () => {
    setShowHistoricoModal(false)
    setHistoricoManutencoes([])
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

  const handleSubmitAgendamento = async (e) => {
    e.preventDefault()

    if (!selectedDate || !agendamentoData.tipo || !agendamentoData.local || !agendamentoData.descricao || !agendamentoData.responsavel) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    try {
      const dataAgendamento = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate)

      const manutencaoData = {
        descServico: `${agendamentoData.tipo} - ${agendamentoData.descricao}`,
        dataInicio: dataAgendamento.toISOString(),
        local: agendamentoData.local,
        responsavel: agendamentoData.responsavel,
        prioridade: agendamentoData.prioridade,
        status: 'AGENDADA'
      }

      await criarManutencao(selectedVehicle.id, manutencaoData)
      alert(`Manutenção agendada com sucesso para ${selectedVehicle.placa}!`)

      // Recarregar dados dos veículos
      const caminhoes = await getTodosCaminhoes()
      setVehicles(caminhoes)

      handleCloseAgendamento()
      setSelectedVehicle(null)
    } catch (err) {
      console.error('Erro ao agendar manutenção:', err)
      alert('Erro ao agendar manutenção. Tente novamente.')
    }
  }

  return (
    <>
      <main className="container panels">
        <div className="card panel">
          <div className="panel__header">Veículos</div>
          {loading ? (
            <div className="loading-container">
              <p>Carregando veículos...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Tentar novamente</button>
            </div>
          ) : (
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
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                      Nenhum veículo encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
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
              {loadingVehicleDetails ? (
                <div className="loading-container">
                  <p>Carregando detalhes do veículo...</p>
                </div>
              ) : (
                <div className="vehicle-details">
                  <div className="detail-section">
                    <h3>Informações Básicas</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Placa:</span>
                        <span className="detail-value">{selectedVehicle.placa || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Modelo:</span>
                        <span className="detail-value">{selectedVehicle.modelo || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Motorista:</span>
                        <span className="detail-value">{selectedVehicle.motorista || 'Não atribuído'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Status:</span>
                        <span className={`tag ${(selectedVehicle.status || 'ativo').toLowerCase()}`}>
                          {selectedVehicle.status || 'Ativo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Especificações Técnicas</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Ano:</span>
                        <span className="detail-value">{selectedVehicle.ano || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Quilometragem:</span>
                        <span className="detail-value">{selectedVehicle.km || 'N/A'} km</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Combustível:</span>
                        <span className="detail-value">{selectedVehicle.combustivel || 0}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Capacidade:</span>
                        <span className="detail-value">{selectedVehicle.capacidade || 0} ton</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Manutenção</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Última Manutenção:</span>
                        <span className="detail-value">{selectedVehicle.ultimaManutencao || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Próxima Manutenção:</span>
                        <span className="detail-value">{selectedVehicle.proximaManutencao || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Custo Total:</span>
                        <span className="detail-value">R$ {selectedVehicle.custoManutencao || '0,00'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Histórico Recente</h3>
                    <div className="history-list">
                      {selectedVehicle.historico && selectedVehicle.historico.length > 0 ? (
                        selectedVehicle.historico.map((item, i) => (
                          <div key={i} className="history-item">
                            <span className="history-date">{item.data || 'N/A'}</span>
                            <span className="history-desc">{item.descricao || 'Sem descrição'}</span>
                            <span className="history-value">R$ {item.valor || '0,00'}</span>
                          </div>
                        ))
                      ) : (
                        <div className="history-item">
                          <span className="history-desc">Nenhum histórico de manutenção disponível</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn--ghost" onClick={handleCloseModal}>Fechar</button>
              <button
                className="btn btn--secondary"
                onClick={() => handleVerHistorico(selectedVehicle.id)}
              >
                Ver Histórico Completo
              </button>
              <button className="btn btn--primary" onClick={handleAgendarManutencao}>Agendar Manutenção</button>
            </div>
          </div>
        </div>
      )}

      {showAgendamentoModal && selectedVehicle && (
        <div className="modal-overlay-agenda" onClick={handleCloseAgendamento}>
          <div className="modal-agenda" onClick={(e) => e.stopPropagation()}>
            <div className="modal-agenda-header">
              <h2>Agendar Manutenção do Veículo [{selectedVehicle?.placa || 'N/A'} - {selectedVehicle?.modelo || 'N/A'}]</h2>
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
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map(day => (
                      <div key={day} className="calendar-weekday">{day}</div>
                    ))}
                  </div>
                  <div className="calendar-days">
                    {Array.from({ length: 35 }).map((_, i) => {
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
                    onChange={(e) => setAgendamentoData({ ...agendamentoData, tipo: e.target.value })}
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
                    onChange={(e) => setAgendamentoData({ ...agendamentoData, local: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descreva o Problema:</label>
                  <input
                    type="text"
                    placeholder="Descreva aqui"
                    value={agendamentoData.descricao}
                    onChange={(e) => setAgendamentoData({ ...agendamentoData, descricao: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Responsável pelo Agendamento:</label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={agendamentoData.responsavel}
                    onChange={(e) => setAgendamentoData({ ...agendamentoData, responsavel: e.target.value })}
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
                        onChange={(e) => setAgendamentoData({ ...agendamentoData, prioridade: e.target.value })}
                      />
                      <span>Baixa</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="prioridade"
                        value="media"
                        checked={agendamentoData.prioridade === 'media'}
                        onChange={(e) => setAgendamentoData({ ...agendamentoData, prioridade: e.target.value })}
                      />
                      <span>Média</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="prioridade"
                        value="alta"
                        checked={agendamentoData.prioridade === 'alta'}
                        onChange={(e) => setAgendamentoData({ ...agendamentoData, prioridade: e.target.value })}
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

      {/* Modal de Histórico Completo de Manutenções */}
      {showHistoricoModal && (
        <div className="modal-overlay" onClick={handleCloseHistorico}>
          <div className="modal-content modal-content--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Histórico Completo de Manutenções</h2>
              <button className="btn btn--ghost btn--xs modal-close" onClick={handleCloseHistorico}>✕</button>
            </div>

            <div className="modal-body">
              {loadingHistorico ? (
                <div className="loading-container">
                  <p>Carregando histórico de manutenções...</p>
                </div>
              ) : historicoManutencoes.length > 0 ? (
                <div className="historico-completo">
                  <div className="historico-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total de Manutenções:</span>
                      <span className="stat-value">{historicoManutencoes.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Custo Total:</span>
                      <span className="stat-value">
                        R$ {historicoManutencoes.reduce((total, m) => total + (m.custo || 0), 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="historico-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Tipo</th>
                          <th>Descrição</th>
                          <th>Local/Provedor</th>
                          <th>Responsável</th>
                          <th>Status</th>
                          <th>Custo</th>
                          <th>Detalhes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicoManutencoes.map((item, index) => (
                          <tr key={index}>
                            <td>
                              {item.dataInicio ?
                                new Date(item.dataInicio).toLocaleDateString('pt-BR') :
                                'N/A'
                              }
                            </td>
                            <td>
                              <span className={`tag ${(item.tipo || 'geral').toLowerCase()}`}>
                                {item.tipo || 'Geral'}
                              </span>
                            </td>
                            <td>
                              <div className="desc-cell">
                                <div className="desc-main">{item.descServico || 'Sem descrição'}</div>
                                {item.quilometragem && (
                                  <div className="desc-km">KM: {item.quilometragem.toLocaleString('pt-BR')}</div>
                                )}
                              </div>
                            </td>
                            <td>{item.local || 'N/A'}</td>
                            <td>{item.responsavel || 'N/A'}</td>
                            <td>
                              <span className={`tag ${(item.status || 'concluida').toLowerCase().replace(/\s+/g, '-')}`}>
                                {item.status || 'Concluída'}
                              </span>
                            </td>
                            <td>
                              <strong>R$ {(item.custo || 0).toLocaleString('pt-BR')}</strong>
                            </td>
                            <td>
                              <div className="detalhes-cell">
                                {item.detalhes && item.detalhes.length > 0 && (
                                  <div className="pecas-info">
                                    <small>Peças: {item.detalhes.length}</small>
                                  </div>
                                )}
                                {item.gravidade && (
                                  <div className="gravidade-info">
                                    <small>Gravidade: {item.gravidade}</small>
                                  </div>
                                )}
                                {item.componentes && item.componentes.length > 0 && (
                                  <div className="componentes-info">
                                    <small>Componentes: {item.componentes.length}</small>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>Nenhum histórico de manutenção encontrado para este veículo.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn--ghost" onClick={handleCloseHistorico}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Vehicles