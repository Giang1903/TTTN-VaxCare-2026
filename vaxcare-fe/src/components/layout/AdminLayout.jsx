import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ToastProvider } from '../ui/Toast';

export default function AdminLayout() {
  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="main">
          <Outlet />
        </div>
      </div>
    </ToastProvider>
  );
}
