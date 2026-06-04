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

  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [persone, setPersone] = useState('')
  const [tavolo, setTavolo] = useState('')
  const [oraArrivo, setOraArrivo] = useState('')

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
  }, [data, autenticato])

  const fetchPrenotazioni = async () => {
    setLoading(true)
    const { data: dati, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('data', data)
    .order('tavolo', { ascending: true })

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
    if (!nome ||!persone ||!tavolo) return

    const { error } = await supabase
    .from('reservations')
    .insert([{
        nome,
        persone: parseInt(persone),
        tavolo: parseInt(tavolo),
        data,
        ora_arrivo: oraArrivo || null
      }])

    if (error) {
      alert('Errore: ' + error.message)
    } else {
      setNome('')
      setPersone('')
      setTavolo('')
      setOraArrivo('')
      fetchPrenotazioni()
    }
  }

  const segnaArrivato = async (id, arrivato) => {
    const { error } = await supabase
    .from('reservations')
    .update({ arrivato:!arrivato })
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
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
      </div>

      <form onSubmit={aggiungiPrenotazione} className="form-prenotazione">
        <input
          type="text"
          placeholder="Nome cliente"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Persone"
          value={persone}
          onChange={(e) => setPersone(e.target.value)}
          min="1"
          required
        />
        <select value={tavolo} onChange={(e) => setTavolo(e.target.value)} required>
          <option value="">Tavolo</option>
          {tavoliDisponibili.map(t => (
            <option key={t} value={t}>Tavolo {t}</option>
          ))}
        </select>
        <input
          type="time"
          placeholder="Ora arrivo"
          value={oraArrivo}
          onChange={(e) => setOraArrivo(e.target.value)}
        />
        <button type="submit">Aggiungi</button>
      </form>

      <h2>Griglia Tavoli - {data}</h2>
      {loading? <p>Caricamento...</p> : (
        <div className="griglia-tavoli">
          {tavoliDisponibili.map(numeroTavolo => {
            const prenotazione = reservations.find(r => r.tavolo === numeroTavolo)
            return (
              <div
                key={numeroTavolo}
                className={`tavolo ${prenotazione? 'occupato' : 'libero'} ${prenotazione?.arrivato? 'arrivato' : ''}`}
              >
                <div className="numero-tavolo">{numeroTavolo}</div>
                {prenotazione? (
                  <>
                    <div className="nome">{prenotazione.nome}</div>
                    <div className="persone">{prenotazione.persone} pax</div>
                    {prenotazione.ora_arrivo && (
                      <div className="ora">{prenotazione.ora_arrivo}</div>
                    )}
                    <button
                      onClick={() => segnaArrivato(prenotazione.id, prenotazione.arrivato)}
                      className={prenotazione.arrivato? 'btn-arrivato' : 'btn-attesa'}
                    >
                      {prenotazione.arrivato? '✓ Arrivato' : 'Segna arrivo'}
                    </button>
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