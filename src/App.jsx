import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const supabase = createClient(
  'https://xpxhtnqwpgkyuwptgnmq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhweGh0bnF3cGdreXV3cHRnbm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NDI2MjEsImV4cCI6MjA2MzQxODYyMX0._wIVLwErR9MYWGZkEn9yCQUxHnc3wQhy7kFbE_9fz9M'
)

const APP_PASSWORD = 'sottosassa'
const TAVOLI_ORDINE = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,40,41,42,43,44,45,46,47,48,49,30,31,32,33,34,35,36,37,38,39,50,51,52,53,20,21,22,23,24,25,26,27,28,29]

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
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

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

    if (error) {
      console.error(error)
      alert('Errore: ' + error.message)
    } else {
      // Ordina per ordine tavoli custom
      const ordinati = (dati || []).sort((a, b) => {
        const idxA = TAVOLI_ORDINE.indexOf(parseInt(a.tables))
        const idxB = TAVOLI_ORDINE.indexOf(parseInt(b.tables))
        if (idxA!== idxB) return idxA - idxB
        return (a.time || '').localeCompare(b.time || '')
      })
      setReservations(ordinati)
    }
    setLoading(false)
  }

  const aggiungiPrenotazione = async (e) => {
    e.preventDefault()
    if (!name ||!people ||!tables) return

    // Validazione orario servizio 12:00-14:00
    if (time) {
      const [h, m] = time.split(':').map(Number)
      const minuti = h * 60 + m
      if (minuti < 720 || minuti > 840) {
        alert('Orario servizio: solo dalle 12:00 alle 14:00')
        return
      }
    }

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
    if (!window.confirm('Sei sicuro di voler eliminare questa prenotazione?')) return
    const { error } = await supabase
.from('reservations')
.delete()
.eq('id', id)

    if (error) alert('Errore: ' + error.message)
    else fetchPrenotazioni()
  }

  const iniziaModifica = (r) => {
    setEditingId(r.id)
    setEditData({
      name: r.name,
      people: r.people,
      tables: r.tables,
      time: r.time || '',
      note: r.note || ''
    })
  }

  const salvaModifica = async (id) => {
    const { error } = await supabase
.from('reservations')
.update({
        name: editData.name,
        people: parseInt(editData.people),
        tables: editData.tables,
        time: editData.time || null,
        note: editData.note || null
      })
.eq('id', id)

    if (error) {
      alert('Errore: ' + error.message)
    } else {
      setEditingId(null)
      setEditData({})
      fetchPrenotazioni()
    }
  }

  const annullaModifica = () => {
    setEditingId(null)
    setEditData({})
  }

  // Calcolo coperti ogni 15 min dalle 12:00 alle 14:00
  const calcolaCoperti = () => {
    const slot = {}
    for (let h = 12; h < 14; h++) {
      for (let m = 0; m < 60; m += 15) {
        const ora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        slot[ora] = 0
      }
    }
    slot['14:00'] = 0

    reservations.forEach(r => {
      if (!r.time) return
      const [h, m] = r.time.split(':').map(Number)
      const minutiTotali = h * 60 + m
      if (minutiTotali >= 720 && minutiTotali <= 840) {
        const quarto = Math.floor(m / 15) * 15
        const chiave = `${String(h).padStart(2, '0')}:${String(quarto).padStart(2, '0')}`
        if (slot[chiave]!== undefined) slot[chiave] += parseInt(r.people)
      }
    })
    return slot
  }

  const copertiSlot = calcolaCoperti()

  if (!autenticato) {
    return (
      <div className="login-container">
        <h2>Accesso Ristorante</h2>
        <form onSubmit={login}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errorePassword? 'input-errore' : ''}
          />
          {errorePassword && <p className="testo-errore">Password errata</p>}
          <button type="submit">Entra</button>
        </form>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="header">
        <h1>Prenotazioni {date}</h1>
        <button className="btn-logout" onClick={logout}>Esci</button>
      </div>

      <div className="controlli">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <form onSubmit={aggiungiPrenotazione} className="form">
        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Pax"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          min="1"
          required
        />
        <select value={tables} onChange={(e) => setTables(e.target.value)} required>
          <option value="">Tavolo</option>
          {TAVOLI_ORDINE.map(t => (
            <option key={t} value={t}>Tavolo {t}</option>
          ))}
        </select>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          min="12:00"
          max="14:00"
        />
        <input
          type="text"
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="submit">Aggiungi</button>
      </form>

      <div className="coperti-box">
        <strong>Coperti ogni 15min:</strong>
        <div className="coperti-grid">
          {Object.entries(copertiSlot).map(([ora, pax]) => (
            <div key={ora} className="slot">
              <span>{ora}</span>
              <strong>{pax}</strong>
            </div>
          ))}
        </div>
      </div>

      {loading? <p>Caricamento...</p> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="sticky-col">Ora</th>
                <th className="sticky-col">Nome</th>
                <th>Pax</th>
                <th>Tavolo</th>
                <th>Note</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0? (
                <tr><td colSpan="7">Nessuna prenotazione</td></tr>
              ) : reservations.map(r => (
                <tr key={r.id} className={r.accommodated? 'riga-arrivato' : ''}>
                  {editingId === r.id? (
                    <>
                      <td>
                        <input
                          type="time"
                          value={editData.time}
                          onChange={(e) => setEditData({...editData, time: e.target.value})}
                          min="12:00"
                          max="14:00"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editData.people}
                          onChange={(e) => setEditData({...editData, people: e.target.value})}
                          min="1"
                        />
                      </td>
                      <td>
                        <select
                          value={editData.tables}
                          onChange={(e) => setEditData({...editData, tables: e.target.value})}
                        >
                          {TAVOLI_ORDINE.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editData.note}
                          onChange={(e) => setEditData({...editData, note: e.target.value})}
                        />
                      </td>
                      <td>-</td>
                      <td>
                        <button onClick={() => salvaModifica(r.id)} className="btn-save">Salva</button>
                        <button onClick={annullaModifica} className="btn-cancel">Annulla</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{r.time || '-'}</td>
                      <td className={r.accommodated? 'testo-sbarrato' : ''}>{r.name}</td>
                      <td>{r.people}</td>
                      <td>{r.tables}</td>
                      <td>{r.note || '-'}</td>
                      <td>
                        <button
                          onClick={() => toggleAccommodated(r.id, r.accommodated)}
                          className={r.accommodated? 'btn-accomodato' : 'btn-attesa'}
                        >
                          {r.accommodated? 'Arrivato' : 'In attesa'}
                        </button>
                      </td>
                      <td>
                        <button onClick={() => iniziaModifica(r)} className="btn-edit">Modifica</button>
                        <button onClick={() => eliminaPrenotazione(r.id)} className="btn-del">Elimina</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default App