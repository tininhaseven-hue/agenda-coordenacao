import { useState, useEffect } from 'react';

interface CalendarProps {
  activeDate: Date;
  onSelectDate: (d: Date) => void;
  activeDays: string[];
  activeCustomDays?: string[];
}

export function Calendar({ activeDate, onSelectDate, activeDays, activeCustomDays = [] }: CalendarProps) {
  const [currentViewDate, setCurrentViewDate] = useState(new Date(activeDate));
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  // Calcular grelha de dias
  const daysInMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 0).getDate();
  const rawStartDay = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1).getDay();
  // Se Segunda for o primeiro dia (0), e Domingo for o último (6)
  const startDay = rawStartDay === 0 ? 6 : rawStartDay - 1;

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const prevMonth = () => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1));

  return (
    <div className="calendar">
      <div className="calendar-header">
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <select 
            className="calendar-title"
            value={currentViewDate.getMonth()}
            onChange={(e) => setCurrentViewDate(new Date(currentViewDate.getFullYear(), parseInt(e.target.value), 1))}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none' }}
          >
            {monthNames.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select 
            className="calendar-title"
            value={currentViewDate.getFullYear()}
            onChange={(e) => setCurrentViewDate(new Date(parseInt(e.target.value), currentViewDate.getMonth(), 1))}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none' }}
          >
            {/* Anos desde 2024 a 2034 */}
            {Array.from({length: 11}).map((_, i) => {
              const year = 2024 + i;
              return <option key={year} value={year}>{year}</option>
            })}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="calendar-nav-btn" onClick={prevMonth}>←</button>
          <button className="calendar-nav-btn" onClick={nextMonth}>→</button>
        </div>
      </div>
      
      <div className="calendar-grid">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, idx) => (
          <div key={`${day}-${idx}`} className="calendar-day-header">{day}</div>
        ))}
        
        {Array.from({ length: startDay }).map((_, index) => (
          <div key={`empty-${index}`} className="calendar-cell empty"></div>
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const dayNum = index + 1;
          const isTodayReal = today && dayNum === today.getDate() && currentViewDate.getMonth() === today.getMonth() && currentViewDate.getFullYear() === today.getFullYear();
          const isSelected = dayNum === activeDate.getDate() && currentViewDate.getMonth() === activeDate.getMonth() && currentViewDate.getFullYear() === activeDate.getFullYear();
          
          // Formatação manual da string YYYY-MM-DD segura à prova de Timezones locais 
          const realY = currentViewDate.getFullYear();
          const realM = String(currentViewDate.getMonth() + 1).padStart(2, '0');
          const realD = String(dayNum).padStart(2, '0');
          const finalDateStr = `${realY}-${realM}-${realD}`;
          
          const currentHasActivity = activeDays.includes(finalDateStr);
          const hasCustom = activeCustomDays ? activeCustomDays.includes(finalDateStr) : false;

          return (
            <div 
              key={dayNum} 
              className={`calendar-cell ${isTodayReal ? 'today' : ''} ${currentHasActivity ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                onSelectDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), dayNum));
              }}
            >
              <span>{dayNum}</span>
              <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '0.25rem' }}>
                {currentHasActivity && !isSelected && <div className="activity-dot"></div>}
                {hasCustom && <div className="activity-dot" style={{ backgroundColor: '#f97316' }}></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
