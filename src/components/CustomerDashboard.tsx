import React, { useState, useEffect, useRef } from 'react';
import { Member, Benefit, Tier, Complaint } from '../types';
import * as storage from '../services/storageService';
import { getChefRecommendation, chatWithChef } from '../services/geminiService';
import { Sparkles, Utensils, CheckCircle, LogOut, Clock, History, Send, MessageCircle, Calendar, AlertCircle, MessageSquareWarning, Megaphone, ArrowLeft, ChevronRight } from 'lucide-react';

interface CustomerDashboardProps {
  memberId: string;
  onLogout: () => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ memberId, onLogout }) => {
  const [member, setMember] = useState<Member | null>(null);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  
  // AI State
  const [recommendation, setRecommendation] = useState<string>('');
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{sender: 'user'|'chef', text: string}[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'benefits' | 'history' | 'complaint'>('benefits');
  const [subTab, setSubTab] = useState<'available' | 'expired' | 'used'>('available');

  // Complaint State
  const [complaintTopic, setComplaintTopic] = useState('รสชาติอาหาร');
  const [complaintMessage, setComplaintMessage] = useState('');
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    loadData();
  }, [memberId]);

  useEffect(() => {
     if (showChat && chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
     }
  }, [chatHistory, showChat]);

  // Load complaints when tab changes to complaint
  useEffect(() => {
      if (activeTab === 'complaint' && member) {
          const all = storage.getComplaints();
          setMyComplaints(all.filter(c => c.memberId === member.id));
      }
  }, [activeTab, member]);

  const loadData = () => {
    const allMembers = storage.getMembers();
    const currentMember = allMembers.find(m => m.id === memberId);
    if (currentMember) {
      setMember(currentMember);
      // Fetch Initial Recommendation if empty
      if (!recommendation) {
        setLoadingRecommendation(true);
        getChefRecommendation(currentMember.tier, currentMember.points, currentMember.name)
            .then(text => setRecommendation(text))
            .finally(() => setLoadingRecommendation(false));
      }
    }
    setBenefits(storage.getBenefits());
  };

  const handleRedeem = (benefit: Benefit) => {
    if (!member) return;
    
    // Final check for points
    if (member.points < benefit.pointsCost) {
        alert('แต้มสะสมของคุณไม่เพียงพอ');
        return;
    }

    if (window.confirm(`ยืนยันการใช้สิทธิ์: ${benefit.title} ?\n(ใช้แต้ม ${benefit.pointsCost} แต้ม)`)) {
        try {
            const success = storage.redeemBenefit(member.id, benefit.id, benefit.pointsCost);
            if (success) {
                alert('ใช้สิทธิ์เรียบร้อยแล้ว! กรุณาแสดงหน้านี้แก่พนักงาน');
                loadData(); // Reload to update points/history
            } else {
                alert('เกิดข้อผิดพลาดในการแลกสิทธิ์');
            }
        } catch (error) {
            console.error("Redeem error:", error);
            alert('เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง');
        }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !member) return;

    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatMessage('');
    setIsChatting(true);

    const reply = await chatWithChef(userMsg, member.tier, member.name);
    
    setChatHistory(prev => [...prev, { sender: 'chef', text: reply }]);
    setIsChatting(false);
  };

  const handleSubmitComplaint = (e: React.FormEvent) => {
      e.preventDefault();
      if (!member || !complaintMessage.trim()) return;

      const newComplaint = storage.addComplaint({
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phoneNumber,
          topic: complaintTopic,
          message: complaintMessage
      });

      alert('ส่งเรื่องร้องเรียนเรียบร้อยแล้วครับ ทางร้านจะรีบตรวจสอบและปรับปรุงให้ดีที่สุดครับ');
      setComplaintMessage('');
      setMyComplaints(prev => [newComplaint, ...prev]);
  };

  if (!member) return <div className="p-8 text-center">Loading Profile...</div>;

  const isGold = member.tier === Tier.GOLD;
  const today = new Date().toISOString().split('T')[0];
  
  // Filter benefits logic: Gold sees all (Silver+Gold), Silver sees only Silver
  const eligibleBenefits = benefits.filter(b => 
    (member.tier === Tier.GOLD ? true : b.tier === Tier.SILVER)
  );

  const activeBenefits = eligibleBenefits.filter(b => !b.expiryDate || b.expiryDate >= today);
  const expiredBenefitsList = eligibleBenefits.filter(b => b.expiryDate && b.expiryDate < today);

  const renderBenefitList = (list: Benefit[]) => {
      if (list.length === 0) {
          return (
            <div className="text-center py-10 text-gray-400">
                <AlertCircle className="mx-auto mb-2 opacity-50" />
                {subTab === 'available' ? 'ยังไม่มีสิทธิพิเศษในขณะนี้' : 'ไม่มีรายการที่หมดอายุ'}
            </div>
          );
      }

      return list.map(benefit => {
        const canAfford = member.points >= benefit.pointsCost;
        const isExpired = benefit.expiryDate && benefit.expiryDate < today;
        const isDisabled = !canAfford || isExpired;

        return (
        <div key={benefit.id} className={`bg-white p-4 rounded-xl border-l-4 shadow-sm flex flex-col gap-2 relative ${benefit.tier === Tier.GOLD ? 'border-yellow-400' : 'border-gray-400'} ${isExpired ? 'opacity-60 grayscale-[0.8]' : ''}`}>
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-800">{benefit.title}</h4>
                <span className={`text-xs px-2 py-1 rounded ${benefit.pointsCost > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {benefit.pointsCost > 0 ? `${benefit.pointsCost} pts` : 'Free'}
                </span>
            </div>
            <p className="text-xs text-gray-500">{benefit.description}</p>
            
            <div className="flex items-center gap-2 mt-1">
                {benefit.expiryDate ? (
                    <div className={`flex items-center gap-1 text-[10px] ${isExpired ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                        <Calendar size={10} /> {isExpired ? 'หมดอายุแล้ว:' : 'หมดเขต:'} {benefit.expiryDate}
                    </div>
                ) : (
                    <div className="text-[10px] text-green-600 flex items-center gap-1"><CheckCircle size={10}/> ใช้ได้ตลอด</div>
                )}
            </div>
            
            <button 
                disabled={isDisabled}
                onClick={() => handleRedeem(benefit)}
                className={`mt-2 w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    isDisabled 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-zaab-orange text-white hover:bg-orange-600 shadow-md hover:shadow-lg active:scale-[0.98]'
                }`}
            >
                {isExpired 
                    ? 'หมดอายุ' 
                    : !canAfford 
                        ? 'แต้มไม่พอ' 
                        : 'กดเพื่อใช้สิทธิ์'
                }
            </button>
        </div>
    )});
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* Navbar */}
      <nav className="bg-white shadow-sm p-4 sticky top-0 z-20 flex justify-between items-center">
        <div className="font-bold text-xl text-zaab-orange flex items-center gap-2">
            โอปอโภชนา
        </div>
        <button onClick={onLogout} className="text-gray-500 text-sm hover:text-red-500 flex items-center gap-1">
            <LogOut size={16}/> ออก
        </button>
      </nav>

      <div className="max-w-md mx-auto p-4 space-y-6">

        {/* Digital Card (Only show if NOT in complaint mode) */}
        {activeTab !== 'complaint' && (
        <div className={`relative w-full aspect-[1.586] rounded-2xl shadow-2xl p-6 flex flex-col justify-between text-white overflow-hidden transition-all duration-500 ${isGold ? 'bg-gradient-to-br from-yellow-400 via-yellow-600 to-yellow-800' : 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600'}`}>
            {/* Decoration Circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
            <div className="absolute top-20 -left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>

            <div className="flex justify-between items-start z-10">
                <div>
                    <h2 className="text-2xl font-bold tracking-wider drop-shadow-md">{member.tier.toUpperCase()} MEMBER</h2>
                    <p className="text-white/80 text-sm">Opor Pochana</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg">
                    <Utensils className="text-white" size={24} />
                </div>
            </div>

            <div className="z-10">
                 <p className="text-xs uppercase opacity-80 mb-1">Points Balance</p>
                 <div className="text-5xl font-bold tracking-tighter drop-shadow-sm">{member.points.toLocaleString()}</div>
            </div>

            <div className="flex justify-between items-end z-10">
                <div>
                    <p className="text-xs uppercase opacity-70">Member Name</p>
                    <p className="font-medium truncate max-w-[150px]">{member.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs opacity-70">{member.phoneNumber}</p>
                </div>
            </div>
        </div>
        )}

        {/* Main Tabs (Only show if NOT in complaint mode) */}
        {activeTab !== 'complaint' && (
        <div className="flex bg-white rounded-xl shadow-sm p-1">
             <button 
                onClick={() => setActiveTab('benefits')} 
                className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 rounded-lg transition-colors ${activeTab === 'benefits' ? 'bg-zaab-orange text-white' : 'text-gray-400 hover:bg-gray-50'}`}
             >
                <Utensils size={18} /> สิทธิพิเศษ
             </button>
             <button 
                onClick={() => setActiveTab('history')} 
                className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 rounded-lg transition-colors ${activeTab === 'history' ? 'bg-zaab-orange text-white' : 'text-gray-400 hover:bg-gray-50'}`}
             >
                <History size={18} /> ประวัติแต้ม
             </button>
        </div>
        )}

        {/* AI Chef Greeting Area (Only on Benefits tab) */}
        {activeTab === 'benefits' && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="bg-zaab-orange/10 p-1.5 rounded-full text-zaab-orange">
                        <Sparkles size={16} />
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm">เชฟโอปอแนะนำ</h3>
                </div>
                <button 
                    onClick={() => setShowChat(true)}
                    className="text-xs bg-zaab-orange text-white px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-orange-600 shadow-sm"
                >
                    <MessageCircle size={12} /> คุยกับเชฟ
                </button>
            </div>
            {loadingRecommendation ? (
                <div className="h-10 w-full bg-gray-100 animate-pulse rounded"></div>
            ) : (
                <p className="text-gray-600 text-sm leading-relaxed italic">"{recommendation}"</p>
            )}
        </div>
        )}

        {/* CONTENT: BENEFITS */}
        {activeTab === 'benefits' && (
        <div>
            {/* Sub Tabs for Benefits */}
            <div className="flex border-b mb-4 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setSubTab('available')}
                    className={`pb-2 px-4 text-sm font-medium whitespace-nowrap transition-colors ${subTab === 'available' ? 'border-b-2 border-zaab-orange text-zaab-orange' : 'text-gray-400'}`}
                >
                    แลกของรางวัล
                </button>
                <button 
                    onClick={() => setSubTab('expired')}
                    className={`pb-2 px-4 text-sm font-medium whitespace-nowrap transition-colors ${subTab === 'expired' ? 'border-b-2 border-zaab-orange text-zaab-orange' : 'text-gray-400'}`}
                >
                    รายการที่หมดอายุ
                </button>
                <button 
                    onClick={() => setSubTab('used')}
                    className={`pb-2 px-4 text-sm font-medium whitespace-nowrap transition-colors ${subTab === 'used' ? 'border-b-2 border-zaab-orange text-zaab-orange' : 'text-gray-400'}`}
                >
                    ประวัติการใช้สิทธิ์
                </button>
            </div>

            <div className="space-y-3">
                {subTab === 'available' && renderBenefitList(activeBenefits)}
                
                {subTab === 'expired' && renderBenefitList(expiredBenefitsList)}
                
                {subTab === 'used' && (
                    // Used History
                    <div className="space-y-2">
                        {member.transactions.filter(t => t.amount < 0).length > 0 ? (
                            member.transactions.filter(t => t.amount < 0).map(t => (
                                <div key={t.id} className="bg-white p-3 rounded-lg flex justify-between items-center border border-gray-100">
                                    <div>
                                        <div className="font-bold text-gray-700 text-sm">{t.description}</div>
                                        <div className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10}/> {t.date}</div>
                                    </div>
                                    <div className="text-red-500 font-bold text-sm bg-red-50 px-2 py-1 rounded">{t.amount}</div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm">ยังไม่มีประวัติการใช้สิทธิ์</div>
                        )}
                    </div>
                )}
            </div>
        </div>
        )}

        {/* CONTENT: HISTORY */}
        {activeTab === 'history' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="p-3 bg-gray-50 border-b text-sm font-bold text-gray-600 flex justify-between items-center">
                    <span>รายการล่าสุด</span>
                    <Clock size={16} />
                </div>
                <div className="divide-y max-h-[60vh] overflow-y-auto">
                    {member.transactions.length > 0 ? (
                        member.transactions.map(tx => (
                            <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                                <div>
                                    <div className="font-medium text-gray-800">{tx.description}</div>
                                    <div className="text-xs text-gray-400">{tx.date}</div>
                                </div>
                                <div className={`font-bold font-mono ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-400">ไม่มีรายการ</div>
                    )}
                </div>
            </div>
        )}

        {/* CONTENT: COMPLAINT */}
        {activeTab === 'complaint' && (
            <div className="space-y-6">
                <button 
                    onClick={() => setActiveTab('benefits')} 
                    className="flex items-center text-gray-500 hover:text-zaab-orange transition mb-2"
                >
                    <ArrowLeft size={20} className="mr-1" /> กลับหน้าหลัก
                </button>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        <Megaphone size={20} className="text-zaab-orange" />
                        แจ้งปัญหา / แนะนำบริการ
                    </h3>
                    <form onSubmit={handleSubmitComplaint} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">หัวข้อเรื่อง</label>
                            <select 
                                className="w-full border p-2.5 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-zaab-orange outline-none"
                                value={complaintTopic}
                                onChange={e => setComplaintTopic(e.target.value)}
                            >
                                <option value="รสชาติอาหาร">รสชาติอาหาร</option>
                                <option value="การบริการพนักงาน">การบริการของพนักงาน</option>
                                <option value="ความสะอาด">ความสะอาดในร้าน</option>
                                <option value="ระบบสมาชิก">ปัญหาการใช้งานระบบสมาชิก</option>
                                <option value="อื่นๆ">เสนอแนะอื่นๆ</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">รายละเอียด</label>
                            <textarea 
                                required
                                rows={4}
                                className="w-full border p-3 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-zaab-orange outline-none"
                                placeholder="พิมพ์รายละเอียดที่ต้องการแจ้ง..."
                                value={complaintMessage}
                                onChange={e => setComplaintMessage(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="w-full bg-zaab-orange text-white py-3 rounded-lg font-bold shadow hover:bg-orange-600 transition">
                            ส่งเรื่องร้องเรียน
                        </button>
                    </form>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">ประวัติการแจ้งของฉัน</h4>
                    {myComplaints.length > 0 ? (
                        myComplaints.map(c => (
                            <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-800">{c.topic}</span>
                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${c.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {c.status === 'RESOLVED' ? 'แก้ไขแล้ว' : 'รอตรวจสอบ'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{c.message}</p>
                                <div className="text-xs text-gray-400 text-right">{c.date}</div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-400 text-sm">ยังไม่มีประวัติการแจ้ง</div>
                    )}
                </div>
            </div>
        )}
        
        {/* Footer Link to Complaint (Only if not in complaint mode) */}
        {activeTab !== 'complaint' && (
            <div className="mt-8 pt-4 border-t border-gray-100">
                <button 
                    onClick={() => setActiveTab('complaint')}
                    className="w-full bg-white border border-gray-300 text-gray-600 py-4 rounded-xl font-bold shadow-sm hover:bg-gray-50 flex items-center justify-between px-6 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full text-gray-500 group-hover:text-zaab-orange transition-colors">
                            <MessageSquareWarning size={20} />
                        </div>
                        <span className="text-left">
                            <div className="text-gray-800">พบปัญหาการใช้งาน?</div>
                            <div className="text-xs text-gray-400 font-normal">แจ้งปัญหา หรือ แนะนำบริการ</div>
                        </span>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                </button>
            </div>
        )}

      </div>

      {/* CHAT MODAL */}
      {showChat && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full h-[85vh] sm:h-[600px] sm:max-w-md sm:rounded-2xl flex flex-col shadow-2xl animate-fade-in-up">
                {/* Header */}
                <div className="p-4 bg-zaab-dark text-white flex justify-between items-center sm:rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zaab-orange rounded-full flex items-center justify-center border-2 border-white/20">
                            <Utensils size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">เชฟโอปอ (AI)</h3>
                            <p className="text-xs text-gray-300">ถามเมนูแนะนำได้เลยครับ!</p>
                        </div>
                    </div>
                    <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white bg-white/10 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {/* Welcome Message */}
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 text-gray-800 p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] text-sm">
                            <p>สวัสดีครับคุณ <span className="font-bold text-zaab-orange">{member.name}</span>! 👋</p>
                            <p className="mt-1">วันนี้หิวไหมครับ? ให้เชฟช่วยแนะนำเมนูเด็ดๆ หรืออยากรู้อะไรเกี่ยวกับร้านโอปอโภชนา ถามได้เลยครับ!</p>
                        </div>
                    </div>

                    {chatHistory.map((msg, idx) => (
                         <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-2xl shadow-sm max-w-[85%] text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-zaab-orange text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isChatting && (
                        <div className="flex justify-start">
                             <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
                                <span className="animate-bounce">●</span>
                                <span className="animate-bounce delay-100">●</span>
                                <span className="animate-bounce delay-200">●</span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Footer Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2 pb-6 sm:pb-3">
                    <input 
                        className="flex-1 border border-gray-300 bg-gray-50 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zaab-orange focus:bg-white transition-all"
                        placeholder="พิมพ์ข้อความ..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                    />
                    <button 
                        type="submit" 
                        disabled={!chatMessage.trim() || isChatting}
                        className="bg-zaab-orange text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md transition-transform active:scale-95"
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

// Helper for chat close button
const X = ({size}:{size:number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default CustomerDashboard;