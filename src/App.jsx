import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './routes/Login.jsx';
import Layout from './routes/Layout.jsx';
import Feed from './routes/Feed.jsx';
import Placeholder from './routes/Placeholder.jsx';
import { useAuthStore } from './lib/store.js';

function RequireAuth({ children }) {
  const isAuthed = useAuthStore((s) => s.isAuthed);
  return isAuthed ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/feed" element={<Feed />} />
        <Route
          path="/destello"
          element={<Placeholder title="Destello" subtitle="Videochat en pareja a 4 bandas (próximamente)" icon="⚡" />}
        />
        <Route
          path="/notifications"
          element={<Placeholder title="Notificaciones" subtitle="Movimientos de tu Nido aparecerán aquí" icon="🔔" />}
        />
        <Route
          path="/messages"
          element={<Placeholder title="Espejo" subtitle="Conversaciones cifradas E2E" icon="💬" />}
        />
        <Route
          path="/profile"
          element={<Placeholder title="Mi Nido" subtitle="Perfil de pareja con espacios individuales" icon="◐" />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
