import { Outlet } from 'react-router-dom';
import BottomTabBar from '../components/BottomTabBar.jsx';
import SideNav from '../components/SideNav.jsx';
import RightPanel from '../components/RightPanel.jsx';
import PwaBar from '../components/PwaBar.jsx';
import Toast from '../components/Toast.jsx';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications.js';

/*
 * Layout responsive:
 *  - Móvil (<md):  columna única de 480px, BottomTabBar fijo abajo.
 *  - Tablet/Desktop (≥md): SideNav a la izquierda + columna central fluida.
 *  - Desktop amplio (≥lg): añade RightPanel con monedero y accesos rápidos.
 */
export default function Layout() {
  useRealtimeNotifications();
  return (
    <div className="relative min-h-[100dvh] bg-aura-bg text-white">
      <SideNav />
      <RightPanel />

      <div className="md:pl-[240px] lg:pl-[260px] lg:pr-[300px] xl:pr-[340px] overflow-x-hidden">
        <div className="mx-auto w-full max-w-[480px] md:max-w-[640px] pb-[80px] md:pb-8 overflow-x-hidden">
          <Outlet />
        </div>
      </div>

      <BottomTabBar />
      <PwaBar />
      <Toast />
    </div>
  );
}
