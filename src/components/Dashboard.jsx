import React, { useState } from 'react'

function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  
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
                    
                    // Exemplo de manutenções 
                    const isCompleted = isValidDay && [7, 8, 14].includes(dayNum)
                    const isPending = isValidDay && [23, 28].includes(dayNum)
                    
                    return (
                      <div 
                        key={i} 
                        className={`calendar__cell ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''} ${isToday ? 'today' : ''}`}
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
              <div className="scheduled__item">
                <span>Caminhão BRA-1234</span>
                <span className="muted">14/08</span>
              </div>
              <div className="scheduled__item">
                <span>Caminhão DRL-3214</span>
                <span className="muted">16/09</span>
              </div>
            </div>
            <div className="mini-card notifications">
              <div className="mini-card__title">Notificações Recentes</div>
              {Array.from({length:5}).map((_,i)=> (
                <div key={i} className="notification__item">Combustível em 5%</div>
              ))}
            </div>
          </div>
        </div>
        <div className="sidebar">
          <div className="search__box">
            <input type="text" placeholder="Pesquisar caminhão" className="input" />
          </div>
          <div className="card fleet">
            <div className="fleet__title">Sua Frota</div>
            <div className="fleet__total">300</div>
            <div className="fleet__stats">
              <div>Ativos: <strong>150</strong></div>
              <div>Inativos: <strong>150</strong></div>
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
              {Array.from({length:7}).map((_,i)=> (
                <tr key={i}>
                  <td>Veículo</td>
                  <td>Tipo</td>
                  <td>Data</td>
                  <td>Custo</td>
                </tr>
              ))}
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
            <div className="expenses__value">R$10.000</div>
          </div>
          <div className="expenses__list">
            {Array.from({length:7}).map((_,i)=> (
              <div key={i} className="expense__item">
                <div>
                  <div>Gasto em Combustível:</div>
                  <div className="muted">R$200</div>
                </div>
                <div className="expense__right">
                  <div>Veículo mais problema</div>
                  <div className="muted">Data</div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn--primary">📄 Relatório IA</button>
        </div>
      </section>
    </main>
  )
}

export default Dashboard