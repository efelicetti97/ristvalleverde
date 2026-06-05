import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const supabase = createClient(
  'https://xpxhtnqwpgkyuwptgnmq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweGh0bnF3cGdreXV3cHRnbm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NDI2MjEsImV4cCI6MjA2MzQxODYyMX0._wIVLwErR9MYWGZkEn9yCQUxHnc3wQhy7kFbE_9fz9M'
)

// CAMBIA PASSWORD QUI
const APP_PASSWORD = 'ristorante2026'

function App() {
  const [autenticato, setAutenticato] = useState(false)
  const [password, setPassword] = useState('')
  const [errorePassword, setErrorePassword] = useState(false)

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  // campi form
  const [name, setName] = useState('')
  const [people, setPeople] = useState('')
  const [tables, setTables] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')

  const tavoliDisponibili = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]

  useEffect(() => {
    const salvata = localStorage.getItem('login_prenotazioni')
    if (salvata === 'ok') setAutenticato(true)
  }, [])

  const login = (e) => {
    e.preventDefault()
    if (password === APP_PASSWORD) {
      setAutenticato(true)
      localStorage.setItem('login_prenotazioni', 'ok')
      setErrorePassword(false)
    } else {
      setErrorePassword(true)
    }
  }

  const logout = () => {
    localStorage.removeItem('login_prenotazioni')
    setAutenticato(false)
    setPassword('')
  }

  useEffect(() => {
    if (!autenticato) return
    fetchPrenotazioni()
  }, [date, autenticato])

  const fetchPrenotazioni = async () => {
    setLoading(true)
    const { data: dati, error } = await supabase
  .from('reservations')
  .select('*')
  .eq('date', date)
  .order('time', { ascending: true })

    if (error) {
      console.error(error)
      alert('Errore: ' + error.message)
    } else {
      setReservations(dati || [])
    }
    setLoading(false)
  }

  const aggiungiPrenotazione = async (e) => {
    e.preventDefault()
    if (!name ||!people ||!tables) return

    const { error } = await supabase
  .from('reservations')
  .insert([{
        name,
        people: parseInt(people),
        tables,
        date,
        time: time || null,
        note: note || null,
        accommodated: false
      }])

    if (error) {
      alert('Errore: ' + error.message)
    } else {
      setName('')
      setPeople('')
      setTables('')
      setTime('')
      setNote('')
      fetchPrenotazioni()
    }
  }

  const toggleAccommodated = async (id, accommodated) => {
    const { error } = await supabase
  .from('reservations')
  .update({ accommodated:!accommodated })
  .eq('id', id)

    if (error) alert('Errore: ' + error.message)
    else fetchPrenotazioni()
  }

  const eliminaPrenotazione = async (id) => {
    if (!confirm('Eliminare questa prenotazione?')) return
    const { error } = await supabase
  .from('reservations')
  .delete()
  .eq('id', id)

    if (error) alert('Errore: ' + error.message)
    else fetchPrenotazioni()
  }

  if (!autenticato) {
    return (
      <div className="login-wrap">
        <div className="login-box">
          <h1>Prenotazioni</h1>
          <form onSubmit={login}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={errorePassword? 'errore' : ''}
            />
            {errorePassword && <p className="errore-text">Password errata</p>}
            <button type="submit">Entra</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <h1>Prenotazioni Ristorante</h1>
        <button className="btn-logout" onClick={logout}>Esci</button>
      </header>

      <div className="toolbar">
        <div className="data-picker">
          <label>Data:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <form onSubmit={aggiungiPrenotazione} className="form-add">
        <input
          type="text"
          placeholder="Nome cliente"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Persone"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          min="1"
          required
        />
        <select value={tables} onChange={(e) => setTables(e.target.value)} required>
          <option value="">Tavolo</option>
          {tavoliDisponibili.map(t => (
            <option key={t} value={t}>Tavolo {t}</option>
          ))}
        </select>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <input
          type="text"
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="submit">Aggiungi</button>
      </form>

      <h2>Griglia Tavoli - {date}</h2>
      {loading? <p>Caricamento...</p> : (
        <div className="grid-tavoli">
          {tavoliDisponibili.map(numeroTavolo => {
            const p = reservations.find(r => parseInt(r.tables) === numeroTavolo)
            return (
              <div
                key={numeroTavolo}
                className={`card-tavolo ${p? 'occupato' : 'libero'} ${p?.accommodated? 'arrivato' : ''}`}
              >
                <div className="numero">{numeroTavolo}</div>
                {p? (
                  <>
                    <div className="nome">{p.name}</div>
                    <div className="info">{p.people} pax</div>
                    {p.time && <div className="info">{p.time}</div>}
                    {p.note && <div className="info note">{p.note}</div>}
                    <div className="azioni">
                      <button
                        onClick={() => toggleAccommodated(p.id, p.accommodated)}
                        className={p.accommodated? 'btn-ok' : 'btn-wait'}
                      >
                        {p.accommodated? '✓ Arrivato' : 'Segna arrivo'}
                      </button>
                      <button
                        onClick={() => eliminaPrenotazione(p.id)}
                        className="btn-del"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="libero">Libero</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default App