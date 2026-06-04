import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const SUPABASE_URL = 'https://xpxhtnqwpgkyuwptgnmq.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweGh0bnF3cGdreXV3cHRnbm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NDI2MjEsImV4cCI6MjA2MzQxODYyMX0._wIVLwErR9MYWGZkEn9yCQUxHnc3wQhy7kFbE_9fz9M'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

console.log('Test Supabase URL:', SUPABASE_URL) // deve stampare l'url

function App() {
  const [reservations, setReservations] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    people: '',
    time: '',
    tables: '',
    note: '',
    phone: ''
  })

  const times = ['12:00', '12:15', '12:30', '12:45', '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45', '20:00', '20:15', '20:30', '20:45', '21:00', '21:15', '21:30']

  // ORDINE TAVOLI: 1-19, 40-49, 30-39, 50-53, 20-29
  const tables = [
    1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,
    40,41,42,43,44,45,46,47,48,49,
    30,31,32,33,34,35,36,37,38,39,
    50,51,52,53,
    20,21,22,23,24,25,26,27,28,29
  ]

  useEffect(() => {
    fetchReservations()
  }, [selectedDate])

  async function fetchReservations() {
    const { data, error } = await supabase
  .from('reservations')
  .select('*')
  .eq('date', selectedDate)
  .eq('deleted', false)
  .order('time')

    if (error) console.error(error)
    else setReservations(data || [])
  }

  function getArrivalsAtTime(time) {
    return reservations
  .filter(r => r.time === time)
  .reduce((sum, r) => sum + r.people, 0)
  }

  async function addReservation() {
    if (!formData.name ||!formData.people ||!formData.time) {
      alert('Compila nome, persone e orario')
      return
    }

    const { error } = await supabase
  .from('reservations')
  .insert([{
        date: selectedDate,
        name: formData.name,
        people: parseInt(formData.people),
        time: formData.time,
        tables: formData.tables,
        note: formData.note,
        phone: formData.phone,
        accommodated: false,
        deleted: false,
        confirmed: false
      }])

    if (error) alert(error.message)
    else {
      setFormData({ name: '', people: '', time: '', tables: '', note: '', phone: '' })
      fetchReservations()
    }
  }

  async function toggleAccommodated(id, current) {
    const { error } = await supabase
  .from('reservations')
  .update({ accommodated:!current })
  .eq('id', id)

    if (!error) fetchReservations()
  }

  async function deleteReservation(id, name, time) {
    if (window.confirm(`Vuoi davvero eliminare la prenotazione di ${name} alle ${time}?`)) {
      const { error } = await supabase
    .from('reservations')
    .update({ deleted: true })
    .eq('id', id)

      if (!error) fetchReservations()
    }
  }

  function startEdit(r) {
    setEditingId(r.id)
    setFormData({
      name: r.name,
      people: r.people,
      time: r.time,
      tables: r.tables,
      note: r.note,
      phone: r.phone || ''
    })
  }

  async function saveEdit() {
    const { error } = await supabase
  .from('reservations')
  .update({
        name: formData.name,
        people: parseInt(formData.people),
        time: formData.time,
        tables: formData.tables,
        note: formData.note,
        phone: formData.phone
      })
  .eq('id', editingId)

    if (!error) {
      setEditingId(null)
      setFormData({ name: '', people: '', time: '', tables: '', note: '', phone: '' })
      fetchReservations()
    }
  }

  function reservationsForCell(table, time) {
    return reservations.filter(r => {
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
        <input
          placeholder="Telefono"
          value={formData.phone}
          onChange={e => setFormData({...formData, phone: e.target.value })}
        />
        <select
          value={formData.time}
          onChange={e => setFormData({...formData, time: e.target.value })}
        >
          <option value="">Orario</option>
          {times.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          placeholder="Tavoli es: 1,42,51"
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
              <th>Tel</th>
              <th>Tavoli</th>
              <th>Note</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(r => (
              <tr key={r.id} className={r.accommodated? 'accommodated' : ''}>
                <td>{r.time}</td>
                <td>{r.name}</td>
                <td>{r.people}</td>
                <td>{r.phone || '-'}</td>
                <td>{r.tables || '-'}</td>
                <td>{r.note}</td>
                <td>
                  <button onClick={() => toggleAccommodated(r.id, r.accommodated)}>
                    {r.accommodated? 'Libera' : 'Accomoda'}
                  </button>
                  <button onClick={() => startEdit(r)}>Modifica</button>
                  <button onClick={() => deleteReservation(r.id, r.name, r.time)}>Elimina</button>
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