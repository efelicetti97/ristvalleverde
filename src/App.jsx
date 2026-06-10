import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

const supabaseUrl = 'https://jturyhlrmmqarbbjulev.supabase.co';
const supabaseKey = 'sb_publishable_S6ELxV6XfMkKkfNTwwFy_Q_fFdBF6oI';

const supabase = createClient(supabaseUrl, supabaseKey);

const times = [
  '18:00','18:15','18:30','18:45',
  '19:00','19:15','19:30','19:45',
  '20:00','20:15','20:30','20:45',
  '21:00','21:15','21:30','21:45'
];

// 3. NUOVO ORDINE TAVOLI - MODIFICATO
const tables = [
  1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,
  40,41,42,43,44,45,46,47,48,49,
  30,31,32,33,34,35,36,37,38,39,
  50,51,52,53
];

function DraggableReservation({ reservation }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: reservation.id,
  });

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
      ref={setNodeRef}
      className={reservation.accommodated? 'prenotazione-accomodata' : ''} // 4. AGGIUNTA CLASSE
      style={{
       ...style,
        background: bg,
        padding: 6,
        borderRadius: 6,
        marginBottom: 4,
        fontSize: 12,
      }}
      {...listeners}
      {...attributes}
    >
      <strong>{reservation.name}</strong>
      <div>{reservation.people} persone</div>
    </div>
  );
}

function Cell({ id, children }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <td
      ref={setNodeRef}
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

export default function App() {
  // HOOK ESISTENTI + NUOVI - TUTTI IN CIMA
  const [reservations, setReservations] = useState([]);
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

  // 1. HOOK PASSWORD - AGGIUNTA
  const [autenticato, setAutenticato] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // 1. useEffect PASSWORD - AGGIUNTA
  useEffect(() => {
    const salvata = sessionStorage.getItem('auth_ok');
    if (salvata === '1') setAutenticato(true);
  }, []);

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
    if (!form.name ||!form.people) return;

    const payload = {
      name: form.name,
      people: parseInt(form.people, 10),
      tables: form.tables || null,
      time: form.time,
      note: form.note || null,
      date: selectedDate,
    };

    if (editingId!== null) {
      await supabase
       .from('reservations')
       .update(payload)
       .eq('id', editingId);

      setReservations(
        reservations.map((r) =>
          r.id === editingId? {...r,...payload } : r
        )
      );
    } else {
      const payloadNuovo = {...payload, accommodated: false };

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

  // 2. CONFERMA ELIMINA - MODIFICATO
  async function deleteReservation(id) {
    const conferma = window.confirm('Sei sicuro di voler eliminare questa prenotazione?');
    if (!conferma) return;

    await supabase
     .from('reservations')
     .delete()
     .eq('id', id);

    loadReservations();

    setReservations(
      reservations.filter((r) => r.id!== id)
    );
  }

 async function toggleAccommodated(reservation) {
  const newValue = !reservation.accommodated;
  
  // Aggiorna solo il campo accommodated su Supabase
  const { error } = await supabase
    .from('reservations')
    .update({ accommodated: newValue })
    .eq('id', reservation.id);

  if (error) {
    console.error('Errore update:', error);
    return;
  }

  // Aggiorna solo il campo accommodated nello stato locale
  setReservations(
    reservations.map((r) =>
      r.id === reservation.id 
        ? { ...r, accommodated: newValue } 
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
  const [newTable, newTime] = over.id.split('|');
  
  // Aggiorna SOLO tavolo e ora su Supabase
  const { error } = await supabase
    .from('reservations')
    .update({ 
      tables: newTable,
      time: newTime 
    })
    .eq('id', reservationId);

  if (error) {
    console.error('Errore drag:', error);
    return;
  }

  setReservations(
    reservations.map((r) =>
      r.id === reservationId
        ? { ...r, tables: newTable, time: newTime }
        : r
    )
  );
}

  // 1. FUNZIONE PASSWORD - AGGIUNTA
  function checkPassword() {
    if (passwordInput === 'sottosassa') { // CAMBIA QUI LA PASSWORD
      sessionStorage.setItem('auth_ok', '1');
      setAutenticato(true);
    } else {
      alert('Password errata');
    }
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

  // 1. BLOCCO LOGIN - AGGIUNTA - DEVE STARE DOPO TUTTI GLI HOOK
  if (!autenticato) {
    return (
      <div className="login-overlay">
        <div className="login-box">
          <h2>Accesso riservato</h2>
          <input
            type="password"
            placeholder="Inserisci password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
          />
          <button onClick={checkPassword}>Entra</button>
        </div>
      </div>
    );
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
              setForm({...form, name: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Persone"
            value={form.people}
            onChange={(e) =>
              setForm({...form, people: e.target.value })
            }
          />

          <input
            placeholder="Tavoli es. 10,11"
            value={form.tables}
            onChange={(e) =>
              setForm({...form, tables: e.target.value })
            }
          />
          <input
            placeholder="Note"
            value={form.note}
            onChange={(e) =>
              setForm({...form, note: e.target.value })
            }
          />
          <select
            value={form.time}
            onChange={(e) =>
              setForm({...form, time: e.target.value })
            }
          >
            {times.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <button onClick={saveReservation}>
            {editingId? 'Salva' : 'Aggiungi'}
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
              <th>Ora</th>
              <th>Nome</th>
              <th>Persone</th>
              <th>Note</th>
              <th>Tavoli</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>

          <tbody>
  {filteredReservations.map((r) => (
    <tr 
      key={r.id} 
      className={r.accommodated ? 'riga-accomodata' : ''}
    >
                <td>{r.time}</td>
                <td>{r.name}</td>
                <td>{r.people}</td>
                <td>{r.note}</td>
                <td>{r.tables || '-'}</td>
                <td>
                  {r.accommodated
                   ? '✅accommodated'
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
                        note: r.note || '',
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

      <DndContext onDragEnd={handleDragEnd}>
        {/* 5. WRAPPER CON SCROLL + STICKY - MODIFICATO */}
        <div
          style={{
            overflow: 'auto',
            maxHeight: '80vh',
            background: '#fff',
            padding: 20,
            borderRadius: 10,
          }}
        >
          <table style={{ borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
              <tr>
                <th style={{
                  position: 'sticky',
                  left: 0,
                  background: '#fff',
                  zIndex: 11,
                  border: '1px solid #ddd'
                }}>
                  Tavolo
                </th>

                {times.map((time) => (
                  <th key={time} style={{ border: '1px solid #ddd', padding: '4px' }}>
                    {time}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {tables.map((table) => (
                <tr key={table}>
                  <td style={{
                    position: 'sticky',
                    left: 0,
                    background: '#fff',
                    border: '1px solid #ddd',
                    fontWeight: 600
                  }}>
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
      </DndContext>
    </div>
  );
}