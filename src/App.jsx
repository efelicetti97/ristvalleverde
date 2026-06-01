import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';


function PasswordGate({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (sessionStorage.getItem('sottosassa_auth') === 'true') {
      setAuthenticated(true);
    }
  }, []);
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'sottosassa') {
      sessionStorage.setItem('sottosassa_auth', 'true');
      setAuthenticated(true);
      setError('');
    } else {
      setError('Password errata');
    }
  };
  
  if (!authenticated) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5'}}>
        <form onSubmit={handleLogin} style={{backgroundColor: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>
          <h2 style={{marginBottom: '20px'}}>Accesso Ristorante</h2>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Inserisci password"
            style={{width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px'}}
            autoFocus
          />
          {error && <p style={{color: 'red', marginBottom: '10px'}}>{error}</p>}
          <button type="submit" style={{width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}>
            Entra
          </button>
        </form>
      </div>
    );
  }
  
  return children;
}

const supabaseUrl = 'https://jturyhlrmmqarbbjulev.supabase.co';
const supabaseKey = 'sb_publishable_S6ELxV6XfMkKkfNTwwFy_Q_fFdBF6oI';

const supabase = createClient(supabaseUrl, supabaseKey);

const styles = `
  .table-container {
    overflow: auto;
    max-height: 80vh;
    position: relative;
  }
  .sticky-header {
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
  }
  .sticky-col {
    position: sticky;
    left: 0;
    background: white;
    z-index: 5;
  }
  .accommodated {
    text-decoration: line-through;
    background-color: #d4edda !important;
    color: #155724;
  }
  .time-totals {
    background-color: #f8f9fa;
    font-weight: bold;
  }
`;


const times = [
  '12:00','12:15','12:30','12:45','13:00','13:15','13:30','13:45','14:00',
  '18:00','18:15','18:30','18:45',
  '19:00','19:15','19:30','19:45',
  '20:00','20:15','20:30','20:45',
  '21:00','21:15','21:30','21:45'
];

const tables = Array.from({ length: 50 }, (_, i) => i + 1);

function DraggableReservation({ reservation }) {
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  let bg = '#fde68a';

  if (reservation.accommodated) {
    bg = '#86efac';
  }

  if (Number(reservation.people) >= 6) {
    bg = '#fca5a5';
  }

  return (
    <div
      style={{
        ...style,
        background: bg,
        padding: 6,
        borderRadius: 6,
        marginBottom: 4,
        fontSize: 12,
      }}
    >
      <strong>{reservation.name}</strong>
      <div>{reservation.people} persone</div>
    </div>
  );
}

function Cell({ id, children }) {
  return (
    <td
      style={{
        border: '1px solid #ddd',
        minWidth: 120,
        height: 90,
        verticalAlign: 'top',
        padding: 4,
        background: '#fff',
      }}
    >
      {children}
    </td>
  );
}

function App_Internal() {
  const [reservations, setReservations] = useState([]);

  // Calcola coperti ogni 15 minuti
  const getCoversByTime = (time) => {
    return reservations.filter(r => r.time === time && !r.deleted && !r.accomodated).reduce((sum, r) => sum + (r.covers || r.persone || 0), 0);
  };

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    people: '',
    tables: '',
    time: '18:00',
    note: '',
  });

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .order('date')
      .order('time');

    if (data) {
      setReservations(data);
    }
  }

   async function saveReservation() {
    if (!form.name || !form.people) return;

    // Costruiamo il payload con i tipi di dati corretti per Supabase
    const payload = {
      name: form.name,
      people: parseInt(form.people, 10), // Converte in numero (int4)
      tables: form.tables || null,       // Mantiene testo (es. "10,11") o mette null se vuoto
      time: form.time,
      note: form.note || null,           // Testo o null se vuoto
      date: selectedDate,
    };

    if (editingId !== null) {
      // In fase di modifica NON inviamo 'accommodated: false' per non resettare lo stato
      await supabase
        .from('reservations')
        .update(payload)
        .eq('id', editingId);

      setReservations(
        reservations.map((reservation) => =>
          r.id === editingId ? { ...r, ...payload } : r
        )
      );
    } else {
      // In fase di inserimento aggiungiamo lo stato iniziale
      const payloadNuovo = { ...payload, accommodated: false };

      const { data, error } = await supabase
        .from('reservations')
        .insert([payloadNuovo])
        .select();

      if (error) {
        console.error("Errore Supabase:", error.message);
        return;
      }

      if (data && data[0]) {
        setReservations([...reservations, data[0]]);
      }
    }

    setEditingId(null);
    setForm({
      name: '',
      people: '',
      tables: '',
      time: '18:00',
      note: '',
    });
  }

 async function deleteReservation(id) {

  await supabase
    .from('reservations')
    .delete()
    .eq('id', id);

  loadReservations();

  setReservations(
    reservations.filter((r) => r.id !== id)
  );
}

  async function toggleAccommodated(reservation) {

  await supabase
    .from('reservations')
    .update({
      accommodated: !reservation.accommodated,
    })
    .eq('id', reservation.id);

  loadReservations();

  setReservations(
    reservations.map((reservation) => =>
      r.id === reservation.id
        ? {
            ...r,
            accommodated: !r.accommodated,
          }
        : r
    )
  );
}

  function exportBackup() {
    const data = JSON.stringify(reservations, null, 2);

    const blob = new Blob([data], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-prenotazioni.json';
    a.click();
  }

  async function handleDragEnd(event) {
    const { active, over } = event;

    if (!over) return;

    const reservationId = active.id;

    const [table, time] = over.id.split('|');

    await supabase
      .from('reservations')
      .update({
        tables: table,
        time,
      })
      .eq('id', reservationId);

    setReservations(
      reservations.map((reservation) => =>
        r.id === reservationId
          ? {
              ...r,
              tables: table,
              time,
            }
          : r
      )
    );
  }

  const filteredReservations = reservations.filter(
    (r) => r.date === selectedDate
  );

  const totalPeople = filteredReservations.reduce(
    (sum, r) => sum + Number(r.people || 0),
    0
  );

function reservationsForCell(table, time) {
  return filteredReservations.filter((r) => {

    const reservationTables = r.tables
      ? r.tables.split(',').map((t) => t.trim())
      : [];

    if (!reservationTables.includes(String(table))) {
      return false;
    }

    const startIndex = times.indexOf(r.time);
    const currentIndex = times.indexOf(time);

    return (
      currentIndex >= startIndex &&
      currentIndex < startIndex + 6
    );
  });
}

  return (
    <div style={{ padding: 20 }}>
      <h1>Agenda Prenotazioni</h1>

      <div
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5,1fr)',
            gap: 10,
          }}
        >
          <input
            placeholder="Nome"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Persone"
            value={form.people}
            onChange={(e) =>
              setForm({ ...form, people: e.target.value })
            }
          />

          <input
            placeholder="Tavoli es. 10,11"
            value={form.tables}
            onChange={(e) =>
              setForm({ ...form, tables: e.target.value })
            }
          />
  <input
  placeholder="Note"
  value={form.note}
  onChange={(e) =>
    setForm({ ...form, note: e.target.value })
  }
/>
          <select
            value={form.time}
            onChange={(e) =>
              setForm({ ...form, time: e.target.value })
            }
          >
            {times.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <button onClick={saveReservation}>
            {editingId ? 'Salva' : 'Aggiungi'}
          </button>
        </div>
      </div>

      <div
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div>
            Prenotazioni: {filteredReservations.length}
          </div>

          <div>
            Coperti: {totalPeople}
          </div>

          <button onClick={exportBackup}>
            Backup
          </button>
        </div>

        <table width="100%" border="1">
          <thead>
            <tr>
              <th className="sticky-col sticky-header">Ora</th>
              <th className="sticky-header">Nome</th>
              <th className="sticky-header">Persone</th>
              <th className="sticky-header">Note</th>
              <th className="sticky-header">Tavoli</th>
              <th className="sticky-header">Stato</th>
              <th className="sticky-header">Azioni</th>
            </tr>
          </thead>

          <tbody>
        <tr className="time-totals">
          <td className="sticky-col"><strong>Coperti</strong></td>
          {times.map(time => (
            <td key={`tot-${time}`}>{getCoversByTime(time)}</td>
          ))}
        </tr>
            {filteredReservations.map((r) => (
              <tr key={r.id} className={r.accomodated || r.accommodated ? "accommodated" : ""}>
                <td>{r.time}</td>
                <td>{r.name}</td>
                <td>{r.people}</td>
                <td>{r.note}</td>
                <td>{r.tables || '-'}</td>
                <td>
                  {r.accommodated
                    ? 'accommodated'
                    : 'In attesa'}
                </td>

                <td>
                  <button
                    onClick={() => toggleAccommodated(r)}
                  >
                    Accomoda
                  </button>

                  <button
                    onClick={() => {
                      setEditingId(r.id);
                      setForm({
                        name: r.name,
                        people: r.people,
                        tables: r.tables,
                        time: r.time,
                      });
                    }}
                  >
                    Modifica
                  </button>

                  <button
                    onClick={() => deleteReservation(r.id)}
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      
        <div
          style={{
            overflowX: 'auto',
            background: '#fff',
            padding: 20,
            borderRadius: 10,
          }}
        >
          <table>
            <thead>
              <tr>
                <th className="sticky-header">Tavolo</th>

                {times.map((time) => (
                  <th key={time}>{time}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {tables.map((table) => (
                <tr key={table}>
                  <td>
                    <strong>{table}</strong>
                  </td>

                  {times.map((time) => {
                    const cellReservations = reservationsForCell(
                      table,
                      time
                    );

                    return (
                      <Cell
                        key={`${table}-${time}`}
                        id={`${table}|${time}`}
                      >
                        {cellReservations.map((reservation) => (
                          <DraggableReservation
                            key={reservation.id}
                            reservation={reservation}
                          />
                        ))}
                      </Cell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      
    </div>
  );
}


export default function App() {
  return <PasswordGate><App_Internal /></PasswordGate>;
}