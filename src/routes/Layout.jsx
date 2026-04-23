import { Outlet } from 'react-router-dom';
import BottomTabBar from '../components/BottomTabBar.jsx';

export default function Layout() {
  return (
    <div className="relative min-h-[100dvh] bg-aura-bg text-white">
      <div className="mx-auto w-full max-w-[480px] min-h-[100dvh] pb-[64px]">
        <Outlet />
      </div>
      <BottomTabBar />
    </div>
  );
}
