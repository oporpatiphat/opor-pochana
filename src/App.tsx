import React, { useState } from 'react';
import { ViewState } from './types';
import * as storage from './services/storageService';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Smartphone, Lock, ArrowRight, Utensils } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [phoneInput, setPhoneInput] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const member = await storage.findMemberByPhone(phoneInput);
      if (member) {
        setCurrentMemberId(member.id);
        setView('CUSTOMER_DASHBOARD');
      } else {
        setError('ไม่พบเบอร์โทรศัพท์นี้ในระบบสมาชิก');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Check password
    if (adminPass === 'opor45796') {
        setView('ADMIN_DASHBOARD');
        setError('');
    } else {
        setError('รหัสผ่านไม่ถูกต้อง');
    }
  };

  const renderHome = () => (
    <div className="min-h-screen bg-gradient-to-br from-zaab-orange to-red-600 flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2.5px)', backgroundSize: '24px 24px' }}></div>

        <div className="z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-zaab-dark p-6 text-center">
                <div className="w-16 h-16 bg-zaab-orange rounded-full mx-auto flex items-center justify-center mb-3 shadow-lg ring-4 ring-white/10">
                    <Utensils size={32} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">โอปอโภชนา</h1>
                <p className="text-gray-400 text-sm">ระบบสมาชิกออนไลน์</p>
            </div>

            <div className="p-8">
                <h2 className="text-gray-800 text-lg font-bold mb-6 text-center">ตรวจสอบสถานะสมาชิก</h2>
                
                <form onSubmit={handleCustomerLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1 ml-1">เบอร์โทรศัพท์</label>
                        <div className="relative">
                            <Smartphone className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input 
                                type="tel" 
                                placeholder="08xxxxxxxx"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-zaab-orange transition-colors bg-white text-zaab-orange placeholder-gray-400 font-mono text-lg font-bold"
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-zaab-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? 'กำลังตรวจสอบ...' : <>ตรวจสอบข้อมูล <ArrowRight size={20}/></>}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <button 
                        onClick={() => { setError(''); setView('ADMIN_LOGIN'); }}
                        className="text-gray-400 text-xs hover:text-gray-600 flex items-center justify-center gap-1 mx-auto transition-colors"
                    >
                        <Lock size={12} /> สำหรับเจ้าหน้าที่
                    </button>
                </div>
            </div>
        </div>
        <p className="mt-6 text-white/60 text-xs">© 2024 Opor Pochana. All rights reserved.</p>
    </div>
  );

  const renderAdminLogin = () => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
         <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">เข้าสู่ระบบจัดการร้าน</h2>
            <form onSubmit={handleAdminLogin} className="space-y-4">
                <input 
                    type="password" 
                    placeholder="รหัสผ่าน"
                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-zaab-orange outline-none bg-white text-gray-800"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" className="w-full bg-zaab-dark text-white py-3 rounded-lg font-bold hover:bg-black transition">เข้าสู่ระบบ</button>
            </form>
            <button onClick={() => setView('HOME')} className="mt-4 text-sm text-gray-500 hover:underline w-full text-center">กลับหน้าหลัก</button>
         </div>
    </div>
  );

  return (
    <div className="font-sans">
      {view === 'HOME' && renderHome()}
      {view === 'ADMIN_LOGIN' && renderAdminLogin()}
      {view === 'CUSTOMER_DASHBOARD' && currentMemberId && (
        <CustomerDashboard 
            memberId={currentMemberId} 
            onLogout={() => { setCurrentMemberId(null); setView('HOME'); setPhoneInput(''); }} 
        />
      )}
      {view === 'ADMIN_DASHBOARD' && (
        <AdminDashboard 
            onLogout={() => { setView('HOME'); setAdminPass(''); }} 
        />
      )}
    </div>
  );
};

export default App;