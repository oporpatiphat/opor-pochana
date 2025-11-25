import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- System Compatibility Fix ---
// ป้องกันหน้าจอขาว (White Screen) เมื่อนำไปรันใน Browser หรือ Vite
// โดยการจำลองตัวแปร process และเชื่อมต่อ VITE_API_KEY ให้อัตโนมัติ

if (typeof window !== 'undefined') {
  const win = window as any;
  // 1. สร้าง process object ถ้ายังไม่มี (ป้องกัน Crash)
  if (!win.process) {
    win.process = { env: {} };
  }
  
  // 2. ถ้ามี process แต่ไม่มี env (บาง environment)
  if (!win.process.env) {
    win.process.env = {};
  }

  // 3. เชื่อมต่อ VITE_API_KEY จาก .env ของ Vite เข้ากับ process.env.API_KEY
  try {
    const meta = import.meta as any;
    if (meta && meta.env && meta.env.VITE_API_KEY) {
      win.process.env.API_KEY = meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // Ignore errors in environments that don't support import.meta
  }
}
// ------------------------------

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);