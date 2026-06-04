import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

// Chiavi dirette
const supabase = createClient(
  'https://xpxhtnqwpgkyuwptgnmq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweGh0bnF3cGdreXV3cHRnbm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NDI2MjEsImV4cCI6MjA2MzQxODYyMX0._wIVLwErR9MYWGZkEn9yCQUxHnc3wQhy7kFbE_9fz9M'
)

// CAMBIA PASSWORD QUI
const APP_PASSWORD = 'sottosassa'

function App() {
  const [autenticato, setAutenticato] = useState(false)
  const [password, setPassword] = useState('')
  const [errorePassword, setErrorePassword] = useState(false)

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
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

  const segnaAccommodated = async (id, accommodated) => {
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
      <div className="container">
        <div className="login-box">
          <h1>Prenotazioni Ristorante</h1>
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
    <div className="container">
      <header>
        <h1>Prenotazioni Ristorante</h1>
        <button className="logout" onClick={logout}>Esci</button>
      </header>

      <div className="data-selector">
        <label>Data: </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <form onSubmit={aggiungiPrenotazione} className="form-prenotazione">
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
        <div className="griglia-tavoli">
          {tavoliDisponibili.map(numeroTavolo => {
            const prenotazione = reservations.find(r => parseInt(r.tables) === numeroTavolo)
            return (
              <div
                key={numeroTavolo}
                className={`tavolo ${prenotazione? 'occupato' : 'libero'} ${prenotazione?.accommodated? 'arrivato' : ''}`}
              >
                <div className="numero-tavolo">{numeroTavolo}</div>
                {prenotazione? (
                  <>
                    <div className="nome">{prenotazione.name}</div>
                    <div className="persone">{prenotazione.people} pax</div>
                    {prenotazione.time && (
                      <div className="ora">{prenotazione.time}</div>
                    )}
                    {prenotazione.note && (
                      <div className="note">{prenotazione.note}</div>
                    )}
                    <div className="azioni">
                      <button
                        onClick={() => segnaAccommodated(prenotazione.id, prenotazione.accommodated)}
                        className={prenotazione.accommodated? 'btn-arrivato' : 'btn-attesa'}
                      >
                        {prenotazione.accommodated? '✓ Arrivato' : 'Segna arrivo'}
                      </button>
                      <button
                        onClick={() => eliminaPrenotazione(prenotazione.id)}
                        className="btn-elimina"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="libero-text">Libero</div>
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