import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import useScrollReveal from '../hooks/useScrollReveal';
import useBubbleField from '../hooks/useBubbleField';

// Layout dùng cho các trang public (trang chủ, vắc xin, cơ sở, giới thiệu, hỗ trợ...)
export default function MainLayout() {
  useBubbleField();
  useScrollReveal();

  return (
    <>
      <div className="bubble-field" id="bubbleField" />
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
