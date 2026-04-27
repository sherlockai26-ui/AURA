import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store.js';
import { apiGetTasks, apiClaimTask } from '../lib/api.js';

export default function Tareas() {
  const navigate  = useNavigate();
  const setSparks = useAuthStore((s) => s.setSparks);

  const [tasks,     setTasks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [claiming,  setClaiming]  = useState(null);
  const [feedback,  setFeedback]  = useState('');

  async function loadTasks() {
    setLoading(true);
    setError('');
    try {
      const data = await apiGetTasks();
      setTasks(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar las tareas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTasks(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleClaim(taskKey) {
    setClaiming(taskKey);
    setFeedback('');
    try {
      const result = await apiClaimTask(taskKey);
      if (result.status === 'pending') {
        setFeedback(`Solicitud enviada. La verificaremos pronto.`);
      } else {
        setFeedback(`+${result.reward} Chispas añadidas a tu monedero ⚡`);
        if (result.balance !== undefined) setSparks(result.balance);
      }
      await loadTasks();
    } catch (err) {
      setFeedback(err.message || 'No se pudo reclamar la tarea.');
    } finally {
      setClaiming(null);
      setTimeout(() => setFeedback(''), 4000);
    }
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-aura-text-2 hover:text-white transition text-lg"
          aria-label="Volver"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold">Gana Chispas</h1>
      </div>

      {/* Banner prelanzamiento */}
      <div className="rounded-card border border-aura-purple/40 bg-aura-surface/60 px-4 py-3 mb-5 text-center">
        <p className="text-sm text-aura-text-2 leading-relaxed">
          AURA está en <span className="text-aura-purple font-semibold">prelanzamiento gratuito</span>.
          Gana Chispas ayudando a crear comunidad.
          Las recargas reales estarán disponibles más adelante.
        </p>
      </div>

      {loading && (
        <p className="text-center text-sm text-aura-text-2 py-8">Cargando tareas…</p>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-aura-error text-sm mb-3">{error}</p>
          <button onClick={loadTasks} className="text-sm text-aura-cyan hover:underline">
            Reintentar
          </button>
        </div>
      )}

      {feedback && (
        <div className={`mb-4 rounded-card px-4 py-3 text-center text-sm font-semibold border ${
          feedback.startsWith('+') || feedback.startsWith('Solicitud')
            ? 'bg-aura-cyan/10 border-aura-cyan/40 text-aura-cyan'
            : 'bg-aura-error/10 border-aura-error/40 text-aura-error'
        }`}>
          {feedback}
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.key}
              task={task}
              onClaim={handleClaim}
              claiming={claiming === task.key}
            />
          ))}
        </div>
      )}

      {/* Pendientes fijos */}
      <div className="mt-6 rounded-card border border-white/10 bg-aura-surface/40 p-4 flex flex-col gap-2">
        <p className="text-xs font-semibold text-aura-text-2 uppercase tracking-wider mb-1">Próximamente</p>
        {[
          { label: 'Recargas reales (SPEI / tarjeta)', tag: 'Próximamente' },
          { label: 'SMS de verificación real',          tag: 'Pendiente' },
          { label: 'Videollamadas (Cita Doble)',         tag: 'Próximamente' },
        ].map(({ label, tag }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-sm text-aura-text-2">{label}</span>
            <span className="text-xs rounded-pill border border-white/15 px-2 py-0.5 text-aura-text-2">{tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, onClaim, claiming }) {
  const statusLabel = {
    done:    'Completada',
    pending: 'En revisión',
  };

  const isDone    = !!task.status;
  const isPending = task.status === 'pending';
  const isAuto    = task.auto_check;

  return (
    <div className={`rounded-card border p-4 flex items-start gap-3 ${
      isDone ? 'border-white/10 bg-aura-surface/40 opacity-70' : 'border-aura-purple/30 bg-aura-surface'
    }`}>
      <div className="mt-0.5">
        {isDone
          ? <span className="text-green-400 text-lg">{isPending ? '⏳' : '✓'}</span>
          : <span className="text-aura-purple text-lg">⚡</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm">{task.title}</p>
          <span className="text-xs font-bold text-aura-cyan">+{task.reward} ⚡</span>
        </div>
        {task.description && (
          <p className="text-xs text-aura-text-2 mt-0.5">{task.description}</p>
        )}
        {!isAuto && !isDone && (
          <p className="text-xs text-aura-text-2 mt-1 italic">
            Verificación manual — envía tu solicitud cuando lo hayas hecho.
          </p>
        )}
        {isDone && (
          <p className="text-xs mt-1 text-aura-text-2">{statusLabel[task.status] || 'Completada'}</p>
        )}
      </div>
      {!isDone && (
        <button
          type="button"
          disabled={claiming}
          onClick={() => onClaim(task.key)}
          className="shrink-0 rounded-pill border border-aura-cyan/60 px-3 py-1.5 text-xs text-aura-cyan disabled:opacity-50 transition hover:border-aura-cyan"
        >
          {claiming ? '…' : isAuto ? 'Reclamar' : 'Solicitar'}
        </button>
      )}
    </div>
  );
}
