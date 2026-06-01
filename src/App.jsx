import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [reservations, setReservations] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    people: '',
    time: '',
    tables: '',
    note: ''
  })

  const times = ['12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30']
  const tables = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]

  useEffect(() => {
    const stored = localStorage.getItem('reservations')
    if (stored) {
      setReservations(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('reservations', JSON.stringify(reservations))
  }, [reservations])

  const filteredReservations = reservations.filter(r => r.date === selectedDate &&!r.deleted)

  // Conta solo le persone che arrivano ESATTAMENTE a quell'ora
  function getArrivalsAtTime(time) {
    return filteredReservations
    .filter(r => r.time === time)
    .reduce((sum, r) => sum + r.people, 0)
  }

  function addReservation() {
    if (!formData.name ||!formData.people ||!formData.time) {
      alert('Compila nome, persone e orario')
      return
    }

    const newReservation = {
      id: Date.now(),
      date: selectedDate,
      name: formData.name,
      people: parseInt(formData.people),
      time: formData.time,
      tables: formData.tables,
      note: formData.note,
      accommodated: false,
      deleted: false
    }

    setReservations([...reservations, newReservation])
    setFormData({ name: '', people: '', time: '', tables: '', note: '' })
  }

  function toggleAccommodated(id) {
    setReservations(reservations.map(r =>
      r.id === id? {...r, accommodated:!r.accommodated } : r
    ))
  }

  function deleteReservation(id) {
  const reservation = reservations.find(r => r.id === id)
  if (window.confirm(`Vuoi davvero eliminare la prenotazione di ${reservation.name} alle ${reservation.time}?`)) {
    setReservations(reservations.map(r =>
      r.id === id? {...r, deleted: true } : r
    ))
  }
}

  function startEdit(r) {
    setEditingId(r.id)
    setFormData({
      name: r.name,
      people: r.people,
      time: r.time,
      tables: r.tables,
      note: r.note
    })
  }

  function saveEdit() {
    setReservations(reservations.map(r =>
      r.id === editingId? {...r,...formData, people: parseInt(formData.people) } : r
    ))
    setEditingId(null)
    setFormData({ name: '', people: '', time: '', tables: '', note: '' })
  }

  // Occupazione 1.5h fissa nella griglia
  function reservationsForCell(table, time) {
    return filteredReservations.filter(r => {
      const reservationTables = r.tables? r.tables.split(',').map(t => t.trim()) : []
      if (!reservationTables.includes(String(table))) return false

      const startIndex = times.indexOf(r.time)
      const currentIndex = times.indexOf(time)
      const DURATION_SLOTS = 6

      return currentIndex >= startIndex && currentIndex < startIndex + DURATION_SLOTS
    })
  }

  return (
    <div className="app">
      <h1>Prenotazioni Ristorante</h1>

      <div className="date-picker">
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="form">
        <h3>{editingId? 'Modifica' : 'Nuova'} Prenotazione</h3>
        <input
          placeholder="Nome"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Persone"
          value={formData.people}
          onChange={e => setFormData({...formData, people: e.target.value })}
        />
        <select
          value={formData.time}
          onChange={e => setFormData({...formData, time: e.target.value })}
        >
          <option value="">Orario</option>
          {times.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          placeholder="Tavoli es: 1,2,3"
          value={formData.tables}
          onChange={e => setFormData({...formData, tables: e.target.value })}
        />
        <input
          placeholder="Note"
          value={formData.note}
          onChange={e => setFormData({...formData, note: e.target.value })}
        />
        {editingId? (
          <>
            <button onClick={saveEdit}>Salva</button>
            <button onClick={() => setEditingId(null)}>Annulla</button>
          </>
        ) : (
          <button onClick={addReservation}>Aggiungi</button>
        )}
      </div>

      <div className="reservations-list">
        <h3>Lista Prenotazioni {selectedDate}</h3>
        <table>
          <thead>
            <tr>
              <th>Orario</th>
              <th>Nome</th>
              <th>Persone</th>
              <th>Tavoli</th>
              <th>Note</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.map(r => (
              <tr key={r.id} className={r.accommodated? 'accommodated' : ''}>
                <td>{r.time}</td>
                <td>{r.name}</td>
                <td>{r.people}</td>
                <td>{r.tables || '-'}</td>
                <td>{r.note}</td>
                <td>
                  <button onClick={() => toggleAccommodated(r.id)}>
                    {r.accommodated? 'Libera' : 'Accomoda'}
                  </button>
                  <button onClick={() => startEdit(r)}>Modifica</button>
                  <button onClick={() => deleteReservation(r.id)}>Elimina</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid">
        <h3>Griglia Tavoli</h3>
        <table>
          <thead>
            <tr>
              <th>Tavolo</th>
              {times.map(time => <th key={time}>{time}</th>)}
            </tr>
            <tr className="arrivals-row">
              <td><strong>Arrivi</strong></td>
              {times.map(time => (
                <td key={time}>
                  <strong>{getArrivalsAtTime(time)}</strong>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {tables.map(table => (
              <tr key={table}>
                <td><strong>{table}</strong></td>
                {times.map(time => {
                  const cellReservations = reservationsForCell(table, time)
                  return (
                    <td key={time} className={cellReservations.length? 'occupied' : ''}>
                      {cellReservations.map(r => (
                        <div key={r.id} className="reservation-card">
                          {r.name} - {r.people}p
                        </div>
                      ))}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App