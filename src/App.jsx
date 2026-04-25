import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './routes/Login.jsx';
import Register from './routes/Register.jsx';
import VerifyKYC from './routes/VerifyKYC.jsx';
import WhoIsHere from './routes/WhoIsHere.jsx';
import Layout from './routes/Layout.jsx';
import Feed from './routes/Feed.jsx';
import Profile from './routes/Profile.jsx';
import Placeholder from './routes/Placeholder.jsx';
import ZonaMatch from './routes/ZonaMatch.jsx';
import ChatTemporal from './routes/ChatTemporal.jsx';
import VideoLlamadaMatch from './routes/VideoLlamadaMatch.jsx';
import FusionDuo from './routes/FusionDuo.jsx';
import MatchExpirado from './routes/MatchExpirado.jsx';
import CitaDoblePortal from './routes/CitaDoblePortal.jsx';
import CitaDobleChat from './routes/CitaDobleChat.jsx';
import CitaDobleVideo from './routes/CitaDobleVideo.jsx';
import CitaDobleResultado from './routes/CitaDobleResultado.jsx';
import { useAuthStore } from './lib/store.js';

function RequireAuth({ children }) {
  const session = useAuthStore((s) => s.session);
  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"         element={<Login />} />
      <Route path="/register"      element={<Register />} />
      <Route path="/registro"      element={<Register />} />
      <Route path="/verificacion"  element={<VerifyKYC />} />
      <Route path="/recuperar"     element={<Placeholder title="Recuperación de contraseña" subtitle="Recuperación de contraseña · Próximamente" icon="🔑" />} />
      <Route path="/terminos"      element={<Placeholder title="Términos de Servicio" subtitle="Condiciones de uso de la plataforma AURA · Próximamente" icon="📋" />} />
      <Route path="/privacidad"    element={<Placeholder title="Política de Privacidad" subtitle="Cómo protegemos tus datos personales · Próximamente" icon="🔒" />} />
      <Route path="/who-is-here"   element={<WhoIsHere />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/"              element={<Navigate to="/feed" replace />} />
        <Route path="/feed"          element={<Feed />} />
        <Route path="/destello"      element={<Placeholder title="Destello" subtitle="Videochat en pareja a 4 bandas (próximamente)" icon="⚡" />} />
        <Route path="/notifications" element={<Placeholder title="Notificaciones" subtitle="Movimientos de tu Nido aparecerán aquí" icon="🔔" />} />
        <Route path="/messages"      element={<Placeholder title="Espejo" subtitle="Conversaciones cifradas E2E" icon="💬" />} />
        <Route path="/profile"       element={<Profile />} />
        {/* Zona de Match */}
        <Route path="/zona-match"                      element={<ZonaMatch />} />
        <Route path="/zona-match/chat/:matchId"        element={<ChatTemporal />} />
        <Route path="/zona-match/llamada/:matchId"     element={<VideoLlamadaMatch />} />
        <Route path="/zona-match/fusion/:matchId"      element={<FusionDuo />} />
        <Route path="/zona-match/expirado"             element={<MatchExpirado />} />
        {/* Cita Doble */}
        <Route path="/cita-doble"                          element={<CitaDoblePortal />} />
        <Route path="/cita-doble/sala/:sessionId"          element={<CitaDobleChat />} />
        <Route path="/cita-doble/llamada/:sessionId"       element={<CitaDobleVideo />} />
        <Route path="/cita-doble/resultado/:sessionId"     element={<CitaDobleResultado />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
