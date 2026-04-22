import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './routes/Login.jsx';
import Register from './routes/Register.jsx';
import Layout from './routes/Layout.jsx';
import Feed from './routes/Feed.jsx';
import Profile from './routes/Profile.jsx';
import Placeholder from './routes/Placeholder.jsx';
import { useAuthStore } from './lib/store.js';

function RequireAuth({ children }) {
  const session = useAuthStore((s) => s.session);
  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
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
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
