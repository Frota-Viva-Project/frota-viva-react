import React, { useState, useEffect } from 'react'
import { 
  getTodasManutencoes, 
  getTodosCaminhoes,
  getManutencoesMarcadas,
  calcularGastoTotal,
  formatarData,
  formatarDataCurta,
  agruparGastosPorTipo,
  getVeiculoMaisProblemas,
  getManutencoesMesAtual,
  getAlertasCaminhao
} from '../Utils/ManipuladorApi'

function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [manutencoes, setManutencoes] = useState([])
  const [caminhoes, setCaminhoes] = useState([])
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  
  // Carregar dados da API
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true)
        
        // Buscar todas as manutenções
        const manutencoesData = await getTodasManutencoes()
        setManutencoes(manutencoesData || [])
        
        // Buscar todos os caminhões
        const caminhoesData = await getTodosCaminhoes()
        setCaminhoes(caminhoesData || [])
        
        // Buscar alertas de todos os caminhões
        if (caminhoesData && caminhoesData.length > 0) {
          const todosAlertas = []
          for (const caminhao of caminhoesData.slice(0, 3)) {
            try {
              const alertasCaminhao = await getAlertasCaminhao(caminhao.id)
              todosAlertas.push(...(alertasCaminhao || []))
            } catch (err) {
              console.log(`Alertas não disponíveis para caminhão ${caminhao.id}`)
            }
          }
          setAlertas(todosAlertas)
        }
        
        setError(null)
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
        // Não mostra erro se está usando dados mockados
        setError(null)
      } finally {
        setLoading(false)
      }
    }
    
    carregarDados()
  }, [])
  
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
  
  // Verificar se há manutenção em um dia específico
  const getManutencaoDia = (dia) => {
    const { year, month } = getMonthData(currentDate)
    return manutencoes.filter(m => {
      const dataInicio = new Date(m.dataInicio)
      return dataInicio.getDate() === dia && 
             dataInicio.getMonth() === month && 
             dataInicio.getFullYear() === year
    })
  }
  
  const { year, month, firstDay, daysInMonth } = getMonthData(currentDate)
  const selectedMonth = `${monthNames[month]}, ${year}`
  
  // Filtrar dados
  const manutencoesMarc = getManutencoesMarcadas(manutencoes)
  const manutencoesRecentes = [...manutencoes]
    .sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio))
    .slice(0, 7)
  
  const manutencoesDoMes = getManutencoesMesAtual(manutencoes)
  const gastoTotal = calcularGastoTotal(manutencoesDoMes)
  const gastosPorTipo = agruparGastosPorTipo(manutencoesDoMes)
  const veiculoProblematico = getVeiculoMaisProblemas(manutencoes)
  
  // Contadores de frota
  const frotaAtiva = caminhoes.filter(c => c.status === 'ATIVO').length
  const frotaInativa = caminhoes.filter(c => c.status === 'INATIVO').length
  const frotaTotal = caminhoes.length
  
  if (loading) {
    return (
      <main className="container dashboard">
        <div style={{textAlign: 'center', padding: '2rem'}}>
          Carregando dados...
        </div>
      </main>
    )
  }
  
  if (error) {
    return (
      <main className="container dashboard">
        <div style={{textAlign: 'center', padding: '2rem', color: 'red'}}>
          {error}
        </div>
      </main>
    )
  }
  
  return (
    <main className="container dashboard">
      <section className="row">
        <div className="card welcome">
          <div className="welcome__left">
            <div className="welcome__title">Manutenções</div>
            <div className="calendar__wrapper">
              <div className="calendar__header">
                <button className="btn btn--ghost btn--xs" onClick={() => changeMonth(-1)}>‹</button>
                <span>{selectedMonth}</span>
                <button className="btn btn--ghost btn--xs" onClick={() => changeMonth(1)}>›</button>
              </div>
              <div className="calendar">
                <div className="calendar__days">
                  {['Seg','Ter','Qua','Qui','Sex','Sab','Dom'].map((d,i)=> (
                    <div key={i} className="calendar__day-label">{d}</div>
                  ))}
                </div>
                <div className="calendar__grid">
                  {Array.from({length: 35}).map((_, i) => {
                    const dayNum = i - firstDay + 1
                    const isValidDay = dayNum > 0 && dayNum <= daysInMonth
                    const isToday = isValidDay && 
                      dayNum === new Date().getDate() && 
                      month === new Date().getMonth() && 
                      year === new Date().getFullYear()
                    
                    const manutencoesNoDia = isValidDay ? getManutencaoDia(dayNum) : []
                    const hasConcluida = manutencoesNoDia.some(m => m.dataConclusao !== null)
                    const hasPendente = manutencoesNoDia.some(m => m.dataConclusao === null)
                    
                    return (
                      <div 
                        key={i} 
                        className={`calendar__cell ${hasConcluida ? 'completed' : ''} ${hasPendente ? 'pending' : ''} ${isToday ? 'today' : ''}`}
                      >
                        {isValidDay ? dayNum : ''}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="calendar__legend">
                <div><span className="legend__dot completed"></span>Feitas</div>
                <div><span className="legend__dot pending"></span>Pendentes</div>
                <div><span className="legend__dot delayed"></span>Atrasadas</div>
              </div>
            </div>
          </div>
          <div className="welcome__right">
            <div className="mini-card">
              <div className="mini-card__title">Manutenções marcadas:</div>
              {manutencoesMarc.slice(0, 2).map((m, i) => (
                <div key={i} className="scheduled__item">
                  <span>{m.caminhao?.placa || 'Caminhão'}</span>
                  <span className="muted">{formatarDataCurta(m.dataInicio)}</span>
                </div>
              ))}
              {manutencoesMarc.length === 0 && (
                <div className="scheduled__item">
                  <span>Nenhuma manutenção marcada</span>
                </div>
              )}
            </div>
            <div className="mini-card notifications">
              <div className="mini-card__title">Notificações Recentes</div>
              {alertas.slice(0, 5).map((alerta, i) => (
                <div key={i} className="notification__item">{alerta.titulo || alerta.descricao}</div>
              ))}
              {alertas.length === 0 && (
                <div className="notification__item">Sem notificações</div>
              )}
            </div>
          </div>
        </div>
        <div className="sidebar">
          <div className="search__box">
            <input type="text" placeholder="Pesquisar caminhão" className="input" />
          </div>
          <div className="card fleet">
            <div className="fleet__title">Sua Frota</div>
            <div className="fleet__total">{frotaTotal}</div>
            <div className="fleet__stats">
              <div>Ativos: <strong>{frotaAtiva}</strong></div>
              <div>Inativos: <strong>{frotaInativa}</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="row panels">
        <div className="card panel">
          <div className="panel__header">Últimas Manutenções</div>
          <table>
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Tipo</th>
                <th>Data</th>
                <th>Custo</th>
              </tr>
            </thead>
            <tbody>
              {manutencoesRecentes.map((m, i) => (
                <tr key={i}>
                  <td>{m.caminhao?.placa || 'N/A'}</td>
                  <td>{m.descServico || 'N/A'}</td>
                  <td>{formatarData(m.dataInicio)}</td>
                  <td>R${m.custo?.toFixed(2) || '0.00'}</td>
                </tr>
              ))}
              {manutencoesRecentes.length === 0 && (
                <tr>
                  <td colSpan="4" style={{textAlign: 'center'}}>Nenhuma manutenção registrada</td>
                </tr>
              )}
            </tbody>
          </table>
          <button className="btn btn--link">Ver Mais ›</button>
        </div>

        <div className="card panel">
          <div className="panel__header expenses">
            <span>Gastos</span>
            <button className="btn btn--ghost btn--xs">Este mês ▼</button>
          </div>
          <div className="expenses__total">
            <div className="muted">Gasto total:</div>
            <div className="expenses__value">R${gastoTotal.toFixed(2)}</div>
          </div>
          <div className="expenses__list">
            {gastosPorTipo.slice(0, 7).map((gasto, i) => (
              <div key={i} className="expense__item">
                <div>
                  <div>Gasto em {gasto.tipo}:</div>
                  <div className="muted">R${gasto.total.toFixed(2)}</div>
                </div>
                <div className="expense__right">
                  <div>{veiculoProblematico?.placa || 'N/A'}</div>
                  <div className="muted">{gasto.quantidade} manutenções</div>
                </div>
              </div>
            ))}
            {gastosPorTipo.length === 0 && (
              <div className="expense__item">
                <div>Nenhum gasto registrado este mês</div>
              </div>
            )}
          </div>
          <button className="btn btn--primary">📄 Relatório IA</button>
        </div>
      </section>
    </main>
  )
}

export default Dashboard