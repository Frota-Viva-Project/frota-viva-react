import React, { useState, useEffect } from 'react'
import {
  login,
  getTodasManutencoes,
  getTodosCaminhoes,
  getManutencoesMarcadas,
  calcularGastoTotal,
  formatarData,
  formatarDataCurta,
  agruparGastosPorTipo,
  getVeiculoMaisProblemas,
  getManutencoesMesAtual,
  getTodosAlertas,
  gerarRelatorioIA,
  forcarModoOnline,
  getApiStatus
} from '../Utils/ManipuladorApi'

function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [manutencoes, setManutencoes] = useState([])
  const [caminhoes, setCaminhoes] = useState([])
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingStage, setLoadingStage] = useState('Inicializando...')
  const [error, setError] = useState(null)
  const [warnings, setWarnings] = useState([])
  const [autenticado, setAutenticado] = useState(false)
  const [relatorioIA, setRelatorioIA] = useState(null)
  const [loadingRelatorio, setLoadingRelatorio] = useState(false)

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  // Fazer login primeiro
  useEffect(() => {
    const fazerLogin = async () => {
      try {
        console.log('Iniciando autenticação...')
        setLoadingStage('Autenticando na API...')
        await login()
        setAutenticado(true)
        console.log('Autenticação concluída')
      } catch (err) {
        console.error('Erro na autenticação:', err)
        setWarnings(prev => [...prev, 'Falha na autenticação. Usando dados de exemplo.'])
        setAutenticado(true) // Permite continuar com dados mockados
      }
    }

    fazerLogin()
  }, [])

  // Carregar dados da API após autenticação
  useEffect(() => {
    if (!autenticado) return

    const carregarDados = async () => {
      const avisos = []

      try {
        setLoading(true)
        console.log('Carregando dados do dashboard...')

        // Buscar caminhões primeiro
        setLoadingStage('Carregando informações da frota...')
        console.log('Buscando caminhões...')

        let caminhoesData = []
        try {
          caminhoesData = await getTodosCaminhoes()
          console.log('Caminhões carregados:', caminhoesData?.length || 0)

          if (!caminhoesData || caminhoesData.length === 0) {
            avisos.push('Nenhum caminhão encontrado no sistema.')
          }

          setCaminhoes(caminhoesData || [])
        } catch (err) {
          console.error('Erro ao carregar caminhões:', err)
          avisos.push('Não foi possível carregar dados da frota.')
          setCaminhoes([])
        }

        // Buscar todas as manutenções
        setLoadingStage('Carregando histórico de manutenções...')
        console.log('Buscando manutenções...')

        let manutencoesData = []
        try {
          manutencoesData = await getTodasManutencoes()
          console.log('Manutenções carregadas:', manutencoesData?.length || 0)

          if (!manutencoesData || manutencoesData.length === 0) {
            avisos.push('Nenhuma manutenção registrada no sistema.')
          }

          setManutencoes(manutencoesData || [])
        } catch (err) {
          console.error('Erro ao carregar manutenções:', err)
          avisos.push('Não foi possível carregar histórico de manutenções.')
          setManutencoes([])
        }

        // Buscar alertas
        setLoadingStage('Carregando notificações e alertas...')
        console.log('Buscando alertas...')

        try {
          const todosAlertas = await getTodosAlertas()
          console.log('Alertas carregados:', todosAlertas?.length || 0)

          setAlertas(todosAlertas || [])

          if (!todosAlertas || todosAlertas.length === 0) {
            console.log('Nenhum alerta ativo no momento')
          }
        } catch (err) {
          console.error('Erro ao carregar alertas:', err)
          avisos.push('Alertas não disponíveis no momento.')
          setAlertas([])
        }

        setWarnings(avisos)
        setError(null)
        console.log('Carregamento concluído!')

      } catch (err) {
        console.error('Erro crítico ao carregar dados:', err)
        setError('Erro ao carregar o dashboard. Por favor, recarregue a página.')
        setWarnings([])
      } finally {
        setLoading(false)
        setLoadingStage('')
      }
    }

    carregarDados()
  }, [autenticado])

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
      try {
        const dataInicio = new Date(m.dataInicio)
        return dataInicio.getDate() === dia &&
          dataInicio.getMonth() === month &&
          dataInicio.getFullYear() === year
      } catch (err) {
        return false
      }
    })
  }

  const { year, month, firstDay, daysInMonth } = getMonthData(currentDate)
  const selectedMonth = `${monthNames[month]}, ${year}`

  // Filtrar dados com tratamento de erros
  const manutencoesMarc = manutencoes ? getManutencoesMarcadas(manutencoes) : []
  const manutencoesRecentes = manutencoes ?
    [...manutencoes]
      .sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio))
      .slice(0, 7) : []

  // Calcular gastos de TODAS as manutenções, não só do mês
  const gastoTotal = manutencoes ? calcularGastoTotal(manutencoes) : 0
  const gastosPorTipo = manutencoes ? agruparGastosPorTipo(manutencoes) : []
  const veiculoProblematico = manutencoes ? getVeiculoMaisProblemas(manutencoes) : null

  // Contadores de frota
  const frotaAtiva = caminhoes ? caminhoes.filter(c => c.status === 'ATIVO').length : 0
  const frotaInativa = caminhoes ? caminhoes.filter(c => c.status === 'INATIVO').length : 0
  const frotaTotal = caminhoes ? caminhoes.length : 0

  // Função para baixar arquivo TXT
  const baixarArquivoTXT = (conteudo, nomeArquivo) => {
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nomeArquivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // Função para gerar relatório IA
  const handleGerarRelatorio = async () => {
    if (loadingRelatorio) return

    setLoadingRelatorio(true)
    try {
      console.log('Gerando relatório com IA...')
      const relatorio = await gerarRelatorioIA(manutencoes, caminhoes)
      setRelatorioIA(relatorio)

      // Preparar conteúdo do arquivo
      const dataAtual = new Date().toLocaleDateString('pt-BR')
      const horaAtual = new Date().toLocaleTimeString('pt-BR')

      const conteudoArquivo = `╔${'═'.repeat(78)}╗
║${' '.repeat(30)}FROTA VIVA${' '.repeat(36)}║
║${' '.repeat(25)}RELATÓRIO EXECUTIVO${' '.repeat(31)}║
╚${'═'.repeat(78)}╝

Data: ${dataAtual} às ${horaAtual}
${relatorio.fallback ? 'Relatório Automático (IA indisponível)' : 'Relatório gerado com IA'}

${'─'.repeat(80)}
ANÁLISE EXECUTIVA
${'─'.repeat(80)}

${relatorio.relatorio}

${'─'.repeat(80)}
DADOS CONSOLIDADOS
${'─'.repeat(80)}

FROTA:
   • Total de caminhões: ${relatorio.dadosUtilizados.totalCaminhoes}
   • Caminhões ativos: ${frotaAtiva}
   • Caminhões inativos: ${frotaInativa}

MANUTENÇÕES:
   • Total registradas: ${relatorio.dadosUtilizados.totalManutencoes}
   • Pendentes: ${relatorio.dadosUtilizados.manutencoesPendentes}
   • Concluídas: ${relatorio.dadosUtilizados.totalManutencoes - relatorio.dadosUtilizados.manutencoesPendentes}

CUSTOS:
   • Investimento total: R$ ${relatorio.dadosUtilizados.custoTotal.toLocaleString('pt-BR')}
   • Custo médio por manutenção: R$ ${relatorio.dadosUtilizados.totalManutencoes > 0 ? (relatorio.dadosUtilizados.custoTotal / relatorio.dadosUtilizados.totalManutencoes).toFixed(2) : '0,00'}

${'─'.repeat(80)}
📋 ÚLTIMAS MANUTENÇÕES
${'─'.repeat(80)}

${manutencoesRecentes.slice(0, 5).map((m, i) =>
        `${i + 1}. ${m.caminhao?.placa || 'N/A'} - ${m.descServico || 'Sem descrição'}
   Data: ${formatarData(m.dataInicio)} | Custo: R$ ${(m.custo || 0).toFixed(2)} | Status: ${m.dataConclusao ? 'Concluída' : 'Pendente'}`
      ).join('\n\n')}

${'═'.repeat(80)}
Sistema Frota Viva | Timestamp: ${relatorio.timestamp}
${'═'.repeat(80)}`

      // Gerar nome do arquivo com data e hora
      const agora = new Date()
      const dataFormatada = agora.toISOString().slice(0, 10) // YYYY-MM-DD
      const horaFormatada = agora.toTimeString().slice(0, 5).replace(':', '') // HHMM
      const nomeArquivo = `Relatorio-Executivo-Frota-Viva-${dataFormatada}-${horaFormatada}.txt`

      // Baixar arquivo
      baixarArquivoTXT(conteudoArquivo, nomeArquivo)

      console.log('Relatório de IA baixado com sucesso via API!')

      // Mostrar notificação de sucesso com informação sobre a API
      const mensagemSucesso = relatorio.fallback
        ? 'Relatório básico gerado'
        : 'Relatório gerado com sucesso via API de IA!'

      alert(`Relatório baixado!\n\nArquivo: ${nomeArquivo}\n\n${mensagemSucesso}`)

    } catch (error) {
      console.error('Erro ao gerar relatório via API:', error)
      alert('Erro ao gerar relatório via API de IA. Verifique sua conexão e tente novamente.')
    } finally {
      setLoadingRelatorio(false)
    }
  }

  if (loading) {
    return (
      <main className="container dashboard">
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>
            {loadingStage}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Por favor, aguarde...
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    )
  }

  return (
    <main className="container dashboard">
      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          color: '#721c24',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>ERRO:</span>
          <span>{error}</span>
        </div>
      )}

      {warnings.length > 0 && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          color: '#856404'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
            AVISOS:
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {warnings.map((warning, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="row">
        <div className="card welcome">
          <div className="welcome__left">
            <div className="welcome__title">Manutenções</div>
            <div className="calendar__wrapper">
              <div className="calendar__header">
                <button className="btn btn--ghost btn--xs" onClick={() => changeMonth(-1)}>
                  ‹
                </button>
                <span>{selectedMonth}</span>
                <button className="btn btn--ghost btn--xs" onClick={() => changeMonth(1)}>
                  ›
                </button>
              </div>
              <div className="calendar">
                <div className="calendar__days">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((d, i) => (
                    <div key={i} className="calendar__day-label">{d}</div>
                  ))}
                </div>
                <div className="calendar__grid">
                  {Array.from({ length: 35 }).map((_, i) => {
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
              {manutencoesMarc.length > 0 ? (
                manutencoesMarc.slice(0, 2).map((m, i) => (
                  <div key={i} className="scheduled__item">
                    <span>{m.caminhao?.placa || 'Caminhão'}</span>
                    <span className="muted">{formatarDataCurta(m.dataInicio)}</span>
                  </div>
                ))
              ) : (
                <div className="scheduled__item" style={{ color: '#999' }}>
                  <span>Nenhuma manutenção agendada</span>
                </div>
              )}
            </div>
            <div className="mini-card notifications">
              <div className="mini-card__title">Notificações Recentes</div>
              {alertas.length > 0 ? (
                alertas.slice(0, 5).map((alerta, i) => (
                  <div key={i} className="notification__item">
                    {alerta.titulo || alerta.descricao || 'Alerta sem descrição'}
                  </div>
                ))
              ) : (
                <div className="notification__item" style={{ color: '#999' }}>
                  Sem notificações no momento
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="sidebar">
          <div className="search__box">
            <input
              type="text"
              placeholder="Pesquisar caminhão"
              className="input"
              disabled={caminhoes.length === 0}
            />
          </div>
          <div className="card fleet">
            <div className="fleet__title">Sua Frota</div>
            <div className="fleet__total">{frotaTotal}</div>
            <div className="fleet__stats">
              <div>Ativos: <strong>{frotaAtiva}</strong></div>
              <div>Inativos: <strong>{frotaInativa}</strong></div>
            </div>
            {frotaTotal === 0 && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.85rem',
                color: '#999',
                textAlign: 'center'
              }}>
                Nenhum veículo cadastrado
              </div>
            )}
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
              {manutencoesRecentes.length > 0 ? (
                manutencoesRecentes.map((m, i) => (
                  <tr key={i}>
                    <td>{m.caminhao?.placa || 'N/A'}</td>
                    <td>{m.descServico || 'N/A'}</td>
                    <td>{formatarData(m.dataInicio)}</td>
                    <td>R$ {m.custo?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                    Nenhuma manutenção registrada no sistema
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <button
            className="btn btn--link"
            disabled={manutencoesRecentes.length === 0}
          >
            Ver Mais ›
          </button>
        </div>

        <div className="card panel">
          <div className="panel__header expenses">
            <span>Gastos</span>
            <button className="btn btn--ghost btn--xs">Este mês ▼</button>
          </div>
          <div className="expenses__total">
            <div className="muted">Gasto total:</div>
            <div className="expenses__value">R$ {gastoTotal.toFixed(2)}</div>
          </div>
          <div className="expenses__list">
            {gastosPorTipo.length > 0 ? (
              gastosPorTipo.slice(0, 7).map((gasto, i) => (
                <div key={i} className="expense__item">
                  <div>
                    <div>Gasto em {gasto.tipo}:</div>
                    <div className="muted">R$ {gasto.total.toFixed(2)}</div>
                  </div>
                  <div className="expense__right">
                    <div>{veiculoProblematico?.placa || 'N/A'}</div>
                    <div className="muted">{gasto.quantidade} manutenções</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="expense__item" style={{ color: '#999', textAlign: 'center' }}>
                Nenhum gasto registrado este mês
              </div>
            )}
          </div>
          <button
            className="btn btn--primary"
            onClick={handleGerarRelatorio}
            disabled={loadingRelatorio || manutencoes.length === 0}
          >
            {loadingRelatorio ? 'Gerando...' : 'Relatório IA'}
          </button>
        </div>
      </section>
    </main>
  )
}

export default Dashboard