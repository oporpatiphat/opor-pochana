import React, { useState, useEffect } from 'react';
import { Member, Benefit, Tier, Complaint } from '../types';
import * as storage from '../services/storageService';
import { Plus, Trash2, Edit2, Users, Gift, LogOut, Save, PlusCircle, Search, Filter, ArrowUpDown, Eye, X, Calendar, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'members' | 'benefits' | 'complaints'>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Member Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<'ALL' | Tier>('ALL');
  const [sortPoints, setSortPoints] = useState<'NONE' | 'ASC' | 'DESC'>('DESC');

  // Member Detailed View State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editMemberData, setEditMemberData] = useState<Partial<Member>>({});

  // Form State for New Member
  const [newMember, setNewMember] = useState({ name: '', phone: '', tier: Tier.SILVER, points: 0 });
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Form State for Adding Points
  const [addingPointsTo, setAddingPointsTo] = useState<Member | null>(null);
  const [pointsAmount, setPointsAmount] = useState<string>('');

  // Form State for Editing/Adding Benefit
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [isEditingBenefit, setIsEditingBenefit] = useState(false);
  const [noExpiry, setNoExpiry] = useState(true);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
      // Sync checkbox state when opening edit modal
      if (editingBenefit) {
          setNoExpiry(!editingBenefit.expiryDate);
      }
  }, [editingBenefit]);

  const refreshData = () => {
    setMembers(storage.getMembers());
    setBenefits(storage.getBenefits());
    setComplaints(storage.getComplaints());
  };

  // --- Member Logic ---

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    storage.addNewMember({
      name: newMember.name,
      phoneNumber: newMember.phone,
      tier: newMember.tier,
      points: Number(newMember.points)
    });
    setNewMember({ name: '', phone: '', tier: Tier.SILVER, points: 0 });
    setIsAddingMember(false);
    refreshData();
  };

  const handleAddPoints = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingPointsTo || !pointsAmount) return;
    
    storage.addPoints(addingPointsTo.id, Number(pointsAmount));
    setAddingPointsTo(null);
    setPointsAmount('');
    refreshData();
    alert(`เพิ่ม ${pointsAmount} แต้ม ให้คุณ ${addingPointsTo.name} เรียบร้อยแล้ว`);
  };

  const openMemberDetail = (member: Member) => {
    setSelectedMember(member);
    setEditMemberData({ ...member });
    setIsEditingMember(false);
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMember && editMemberData) {
        const updated = { ...selectedMember, ...editMemberData } as Member;
        storage.updateMember(updated);
        setSelectedMember(updated);
        setIsEditingMember(false);
        refreshData();
        alert('บันทึกข้อมูลเรียบร้อยแล้ว');
    }
  };

  // --- Benefit Logic ---

  const handleSaveBenefit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBenefit) return;

    let updatedBenefits = [...benefits];
    const finalExpiryDate = noExpiry ? null : editingBenefit.expiryDate;
    
    if (editingBenefit.id === 'new') {
        // Create new
        const newBenefit: Benefit = { 
            ...editingBenefit, 
            id: `b${Date.now()}`,
            dateAdded: new Date().toISOString().split('T')[0], // Set current date
            expiryDate: finalExpiryDate
        };
        updatedBenefits.push(newBenefit);
    } else {
        // Update existing
        const index = updatedBenefits.findIndex(b => b.id === editingBenefit.id);
        if (index !== -1) {
            updatedBenefits[index] = {
                ...editingBenefit,
                expiryDate: finalExpiryDate
            };
        }
    }

    storage.saveBenefits(updatedBenefits);
    setBenefits(updatedBenefits);
    setIsEditingBenefit(false);
    setEditingBenefit(null);
  };

  const handleDeleteBenefit = (id: string) => {
    if (window.confirm('คุณต้องการลบสิทธิประโยชน์นี้ใช่หรือไม่?')) {
        const updated = benefits.filter(b => b.id !== id);
        storage.saveBenefits(updated);
        setBenefits(updated);
    }
  };

  // --- Complaint Logic ---
  const handleResolveComplaint = (id: string) => {
      if(window.confirm('ยืนยันว่าได้รับทราบและดำเนินการแก้ไขปัญหาเรียบร้อยแล้ว?')) {
          storage.resolveComplaint(id);
          refreshData();
      }
  }

  // --- Filtering & Sorting ---

  const filteredMembers = members
    .filter(m => {
        const matchesSearch = m.name.includes(searchTerm) || m.phoneNumber.includes(searchTerm);
        const matchesTier = filterTier === 'ALL' || m.tier === filterTier;
        return matchesSearch && matchesTier;
    })
    .sort((a, b) => {
        if (sortPoints === 'ASC') return a.points - b.points;
        if (sortPoints === 'DESC') return b.points - a.points;
        return 0; // Default or ID based
    });
  
  const pendingComplaintsCount = complaints.filter(c => c.status === 'PENDING').length;

  const renderBenefitCard = (benefit: Benefit) => (
    <div key={benefit.id} className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col relative group ${benefit.tier === Tier.GOLD ? 'hover:border-yellow-300' : 'hover:border-gray-300'} transition-all`}>
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => { setEditingBenefit(benefit); setIsEditingBenefit(true); }} className="p-1 text-gray-400 hover:text-blue-500 bg-white rounded shadow-sm border"><Edit2 size={14} /></button>
            <button onClick={() => handleDeleteBenefit(benefit.id)} className="p-1 text-gray-400 hover:text-red-500 bg-white rounded shadow-sm border"><Trash2 size={14} /></button>
        </div>
        
        <div className="mb-2">
             <h3 className="font-bold text-lg text-gray-800 pr-16">{benefit.title}</h3>
        </div>
        
        <p className="text-gray-500 text-sm mt-1 flex-1">{benefit.description}</p>
        
        <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">ใช้แต้มแลก:</span>
                <span className="font-bold text-zaab-orange">{benefit.pointsCost > 0 ? `${benefit.pointsCost.toLocaleString()}` : 'ฟรี (0)'}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400">
                <span className="flex items-center gap-1"><Calendar size={12}/> เพิ่มเมื่อ: {benefit.dateAdded}</span>
                {benefit.expiryDate ? (
                    <span className="text-red-400">หมดอายุ: {benefit.expiryDate}</span>
                ) : (
                    <span className="text-green-600">ตลอดชีพ</span>
                )}
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Admin Header */}
      <header className="bg-zaab-dark text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <h1 className="text-xl font-bold text-zaab-orange">ผู้จัดการร้าน โอปอโภชนา</h1>
           <span className="text-xs bg-gray-700 px-2 py-1 rounded">Admin Only</span>
        </div>
        <button onClick={onLogout} className="text-sm flex items-center gap-1 hover:text-red-400">
          <LogOut size={16} /> ออกจากระบบ
        </button>
      </header>

      {/* Admin Navigation */}
      <nav className="bg-white border-b flex justify-center overflow-x-auto">
        <button 
          onClick={() => setActiveTab('members')}
          className={`flex-1 min-w-[120px] py-4 text-center font-semibold flex justify-center items-center gap-2 ${activeTab === 'members' ? 'text-zaab-orange border-b-2 border-zaab-orange' : 'text-gray-500'}`}
        >
          <Users size={20} /> สมาชิก
        </button>
        <button 
          onClick={() => setActiveTab('benefits')}
          className={`flex-1 min-w-[120px] py-4 text-center font-semibold flex justify-center items-center gap-2 ${activeTab === 'benefits' ? 'text-zaab-orange border-b-2 border-zaab-orange' : 'text-gray-500'}`}
        >
          <Gift size={20} /> สิทธิประโยชน์
        </button>
        <button 
          onClick={() => setActiveTab('complaints')}
          className={`flex-1 min-w-[120px] py-4 text-center font-semibold flex justify-center items-center gap-2 relative ${activeTab === 'complaints' ? 'text-zaab-orange border-b-2 border-zaab-orange' : 'text-gray-500'}`}
        >
          <MessageSquare size={20} /> 
          ข้อความร้องเรียน
          {pendingComplaintsCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingComplaintsCount}</span>
          )}
        </button>
      </nav>

      {/* Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        
        {/* ---- MEMBERS TAB ---- */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">รายชื่อลูกค้าสมาชิก</h2>
                <button 
                  onClick={() => setIsAddingMember(true)}
                  className="bg-zaab-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow transition"
                >
                  <Plus size={18} /> เพิ่มลูกค้าใหม่
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="ค้นหาชื่อ หรือ เบอร์โทร..." 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-zaab-orange"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                         <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
                         <select 
                            className="pl-10 pr-8 py-2 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-zaab-orange"
                            value={filterTier}
                            onChange={(e) => setFilterTier(e.target.value as Tier | 'ALL')}
                         >
                             <option value="ALL">ทุกระดับ (Tier)</option>
                             <option value={Tier.SILVER}>Silver</option>
                             <option value={Tier.GOLD}>Gold</option>
                         </select>
                    </div>
                    <button 
                        onClick={() => setSortPoints(prev => prev === 'DESC' ? 'ASC' : 'DESC')}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 ${sortPoints !== 'NONE' ? 'text-zaab-orange border-zaab-orange bg-orange-50' : 'text-gray-600'}`}
                    >
                        <ArrowUpDown size={18} /> 
                        แต้ม {sortPoints === 'ASC' ? 'น้อยไปมาก' : 'มากไปน้อย'}
                    </button>
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-600 hidden md:table-cell">วันที่สมัคร</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">ชื่อลูกค้า</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 hidden md:table-cell">เบอร์โทร</th>
                                <th className="p-4 text-sm font-semibold text-gray-600">สถานะ</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 text-right cursor-pointer" onClick={() => setSortPoints(prev => prev === 'DESC' ? 'ASC' : 'DESC')}>แต้มสะสม</th>
                                <th className="p-4 text-sm font-semibold text-gray-600 text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredMembers.map(member => (
                                <tr key={member.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 text-gray-400 text-sm hidden md:table-cell">{member.joinedDate}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800">{member.name}</div>
                                        <div className="text-xs text-gray-400 md:hidden">{member.phoneNumber}</div>
                                    </td>
                                    <td className="p-4 font-mono text-gray-500 hidden md:table-cell">{member.phoneNumber}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${member.tier === Tier.GOLD ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-gray-200 text-gray-700'}`}>
                                            {member.tier}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-zaab-orange text-right text-lg">{member.points.toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button 
                                                onClick={() => openMemberDetail(member)}
                                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded shadow transition text-sm flex items-center gap-1"
                                                title="ดูรายละเอียด / แก้ไข"
                                            >
                                                <Eye size={16} /> <span className="hidden md:inline">รายละเอียด</span>
                                            </button>
                                            <button 
                                                onClick={() => setAddingPointsTo(member)}
                                                className="bg-green-50 text-green-600 hover:bg-green-100 p-2 rounded shadow transition text-sm flex items-center gap-1"
                                                title="เติมแต้ม"
                                            >
                                                <PlusCircle size={16} /> <span className="hidden md:inline">เติมแต้ม</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredMembers.length === 0 && (
                    <div className="p-8 text-center text-gray-500">ไม่พบรายชื่อสมาชิกที่ค้นหา</div>
                )}
            </div>
          </div>
        )}

        {/* ---- MEMBER DETAIL MODAL ---- */}
        {selectedMember && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
                    
                    {/* Header */}
                    <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                {isEditingMember ? 'แก้ไขข้อมูลสมาชิก' : selectedMember.name}
                                {!isEditingMember && selectedMember.tier === Tier.GOLD && <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-200">GOLD</span>}
                            </h2>
                            <p className="text-gray-500 text-sm">Member ID: {selectedMember.id}</p>
                        </div>
                        <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-red-500">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0 flex flex-col md:flex-row">
                        
                        {/* LEFT COL: Profile Info & Edit */}
                        <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r bg-white space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-700">ข้อมูลส่วนตัว</h3>
                                {!isEditingMember && (
                                    <button onClick={() => setIsEditingMember(true)} className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1">
                                        <Edit2 size={14} /> แก้ไข
                                    </button>
                                )}
                            </div>

                            {isEditingMember ? (
                                <form onSubmit={handleUpdateMember} className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">ชื่อ-นามสกุล</label>
                                        <input className="w-full border p-2 rounded" value={editMemberData.name} onChange={e => setEditMemberData({...editMemberData, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">เบอร์โทรศัพท์</label>
                                        <input className="w-full border p-2 rounded" value={editMemberData.phoneNumber} onChange={e => setEditMemberData({...editMemberData, phoneNumber: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">ระดับบัตร</label>
                                        <select className="w-full border p-2 rounded" value={editMemberData.tier} onChange={e => setEditMemberData({...editMemberData, tier: e.target.value as Tier})}>
                                            <option value={Tier.SILVER}>Silver</option>
                                            <option value={Tier.GOLD}>Gold</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">แต้มสะสม (แก้ไขโดยตรง)</label>
                                        <input type="number" className="w-full border p-2 rounded font-mono" value={editMemberData.points} onChange={e => setEditMemberData({...editMemberData, points: Number(e.target.value)})} />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button type="button" onClick={() => setIsEditingMember(false)} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded text-sm">ยกเลิก</button>
                                        <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">บันทึก</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase">เบอร์โทรศัพท์</label>
                                        <div className="font-mono text-lg">{selectedMember.phoneNumber}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase">วันที่สมัคร</label>
                                        <div>{selectedMember.joinedDate}</div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg border text-center">
                                        <label className="block text-xs text-gray-400 uppercase mb-1">แต้มคงเหลือ</label>
                                        <div className="text-3xl font-bold text-zaab-orange">{selectedMember.points.toLocaleString()}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COL: History */}
                        <div className="p-6 md:w-2/3 bg-gray-50/50">
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                ประวัติการทำรายการ
                                <span className="text-xs font-normal bg-gray-200 px-2 py-0.5 rounded text-gray-600">{selectedMember.transactions.length} รายการ</span>
                            </h3>
                            <div className="bg-white rounded-lg shadow-sm border overflow-hidden max-h-[400px] overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b sticky top-0">
                                        <tr>
                                            <th className="p-3 font-semibold text-gray-600">วันที่</th>
                                            <th className="p-3 font-semibold text-gray-600">รายการ</th>
                                            <th className="p-3 font-semibold text-gray-600 text-right">แต้ม</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedMember.transactions.map((tx) => (
                                            <tr key={tx.id}>
                                                <td className="p-3 text-gray-500 whitespace-nowrap">{tx.date}</td>
                                                <td className="p-3 text-gray-800">{tx.description}</td>
                                                <td className={`p-3 text-right font-mono font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                                </td>
                                            </tr>
                                        ))}
                                        {selectedMember.transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="p-8 text-center text-gray-400">ยังไม่มีรายการบันทึก</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        )}

        {/* Modal: Add Member (Existing Code) */}
        {isAddingMember && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg border-t-4 border-zaab-orange">
                    <h3 className="font-bold text-xl mb-4">ลงทะเบียนลูกค้าใหม่</h3>
                    <form onSubmit={handleAddMember} className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">ชื่อ-นามสกุล</label>
                            <input required type="text" className="w-full border p-2 rounded" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">เบอร์โทรศัพท์</label>
                            <input required type="tel" className="w-full border p-2 rounded" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">ระดับบัตร</label>
                                <select className="w-full border p-2 rounded" value={newMember.tier} onChange={e => setNewMember({...newMember, tier: e.target.value as Tier})}>
                                    <option value={Tier.SILVER}>Silver</option>
                                    <option value={Tier.GOLD}>Gold</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">แต้มเริ่มต้น</label>
                                <input type="number" className="w-full border p-2 rounded" value={newMember.points} onChange={e => setNewMember({...newMember, points: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                            <button type="button" onClick={() => setIsAddingMember(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">ยกเลิก</button>
                            <button type="submit" className="px-6 py-2 bg-zaab-orange text-white rounded hover:bg-orange-600 font-bold">บันทึกข้อมูล</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Modal: Add Points (Existing Code) */}
        {addingPointsTo && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
                    <h3 className="font-bold text-lg mb-2 text-center">เติมแต้มสะสม</h3>
                    <p className="text-center text-gray-500 mb-4">ให้คุณ <span className="font-bold text-zaab-dark">{addingPointsTo.name}</span></p>
                    <form onSubmit={handleAddPoints} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">จำนวนแต้มที่ได้รับ</label>
                            <div className="relative">
                                <input autoFocus required type="number" className="w-full border-2 border-zaab-orange p-3 rounded text-center text-2xl font-bold text-zaab-orange" value={pointsAmount} onChange={e => setPointsAmount(e.target.value)} placeholder="0" />
                                <div className="absolute right-3 top-4 text-gray-400 text-sm">แต้ม</div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button type="button" onClick={() => {setAddingPointsTo(null); setPointsAmount('');}} className="flex-1 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded">ยกเลิก</button>
                            <button type="submit" className="flex-1 py-2 bg-zaab-orange text-white rounded font-bold hover:bg-orange-600">ยืนยัน</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* ---- BENEFITS TAB ---- */}
        {activeTab === 'benefits' && (
           <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">จัดการสิทธิประโยชน์</h2>
                <button 
                  onClick={() => {
                      setEditingBenefit({ id: 'new', title: '', description: '', tier: Tier.SILVER, pointsCost: 0, dateAdded: '', expiryDate: null });
                      setIsEditingBenefit(true);
                      setNoExpiry(true);
                  }}
                  className="bg-zaab-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow"
                >
                  <Plus size={18} /> เพิ่มสิทธิประโยชน์
                </button>
            </div>

            {isEditingBenefit && editingBenefit && (
                 <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                     <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl animate-fade-in-up">
                        <h3 className="font-bold text-xl mb-4 text-zaab-dark border-b pb-2">{editingBenefit.id === 'new' ? 'เพิ่มสิทธิใหม่' : 'แก้ไขสิทธิประโยชน์'}</h3>
                        <form onSubmit={handleSaveBenefit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">ชื่อสิทธิประโยชน์</label>
                                <input 
                                    required 
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-zaab-orange outline-none" 
                                    placeholder="เช่น คูปองส่วนลด 100 บาท"
                                    value={editingBenefit.title} 
                                    onChange={e => setEditingBenefit({...editingBenefit, title: e.target.value})} 
                                />
                                <p className="text-xs text-gray-400 mt-1">ชื่อที่จะแสดงให้ลูกค้าเห็นเด่นชัด</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">รายละเอียดเงื่อนไข</label>
                                <textarea 
                                    required 
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-zaab-orange outline-none" 
                                    rows={3} 
                                    placeholder="เช่น ใช้ได้เมื่อทานครบ 1,000 บาท ขึ้นไป"
                                    value={editingBenefit.description} 
                                    onChange={e => setEditingBenefit({...editingBenefit, description: e.target.value})} 
                                />
                                <p className="text-xs text-gray-400 mt-1">อธิบายรายละเอียดเพิ่มเติม</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">สำหรับระดับ (Tier)</label>
                                    <select className="w-full border p-2 rounded" value={editingBenefit.tier} onChange={e => setEditingBenefit({...editingBenefit, tier: e.target.value as Tier})}>
                                        <option value={Tier.SILVER}>Silver</option>
                                        <option value={Tier.GOLD}>Gold</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">ใช้แต้มแลก</label>
                                    <input 
                                        type="number" 
                                        className="w-full border p-2 rounded" 
                                        value={editingBenefit.pointsCost} 
                                        onChange={e => setEditingBenefit({...editingBenefit, pointsCost: Number(e.target.value)})} 
                                        placeholder="0"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">ใส่ 0 หากเป็นสิทธิพิเศษฟรี</p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg border">
                                <label className="block text-sm font-medium mb-2 text-gray-700">วันหมดอายุของสิทธิประโยชน์</label>
                                <div className="flex items-center gap-2 mb-2">
                                    <input 
                                        type="checkbox" 
                                        id="noExpiry" 
                                        checked={noExpiry} 
                                        onChange={(e) => setNoExpiry(e.target.checked)}
                                        className="w-4 h-4 text-zaab-orange focus:ring-zaab-orange"
                                    />
                                    <label htmlFor="noExpiry" className="text-sm text-gray-600">ไม่มีวันหมดอายุ (ใช้ได้ตลอด)</label>
                                </div>
                                {!noExpiry && (
                                    <input 
                                        type="date" 
                                        required={!noExpiry}
                                        className="w-full border p-2 rounded" 
                                        value={editingBenefit.expiryDate || ''} 
                                        onChange={e => setEditingBenefit({...editingBenefit, expiryDate: e.target.value})} 
                                    />
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
                                <button type="button" onClick={() => setIsEditingBenefit(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">ยกเลิก</button>
                                <button type="submit" className="px-6 py-2 bg-zaab-orange text-white rounded font-bold hover:bg-orange-600">บันทึก</button>
                            </div>
                        </form>
                     </div>
                 </div>
            )}

            {/* Silver Tier Section */}
            <div className="space-y-3">
                <h3 className="font-bold text-gray-600 flex items-center gap-2 border-b pb-2">
                    <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                    สิทธิประโยชน์ Silver Member
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {benefits.filter(b => b.tier === Tier.SILVER).map(renderBenefitCard)}
                    {benefits.filter(b => b.tier === Tier.SILVER).length === 0 && <p className="text-gray-400 text-sm">ยังไม่มีข้อมูล</p>}
                </div>
            </div>

            {/* Gold Tier Section */}
            <div className="space-y-3 pt-4">
                <h3 className="font-bold text-yellow-700 flex items-center gap-2 border-b pb-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                    สิทธิประโยชน์ Gold Member
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {benefits.filter(b => b.tier === Tier.GOLD).map(renderBenefitCard)}
                     {benefits.filter(b => b.tier === Tier.GOLD).length === 0 && <p className="text-gray-400 text-sm">ยังไม่มีข้อมูล</p>}
                </div>
            </div>

           </div>
        )}

        {/* ---- COMPLAINTS TAB ---- */}
        {activeTab === 'complaints' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">ข้อความร้องเรียน / เสนอแนะ</h2>
                </div>

                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600">วันที่</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">ลูกค้า</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">หัวข้อ</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 w-1/3">รายละเอียด</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600">สถานะ</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {complaints.map(complaint => (
                                    <tr key={complaint.id} className="hover:bg-gray-50">
                                        <td className="p-4 text-gray-500 text-sm whitespace-nowrap">{complaint.date}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800">{complaint.memberName}</div>
                                            <div className="text-xs text-gray-400">{complaint.memberPhone}</div>
                                        </td>
                                        <td className="p-4 text-gray-800 font-medium">{complaint.topic}</td>
                                        <td className="p-4 text-gray-600 text-sm">{complaint.message}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${complaint.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {complaint.status === 'RESOLVED' ? 'แก้ไขแล้ว' : 'รอตรวจสอบ'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {complaint.status !== 'RESOLVED' && (
                                                <button 
                                                    onClick={() => handleResolveComplaint(complaint.id)}
                                                    className="bg-green-50 text-green-600 hover:bg-green-100 p-2 rounded shadow transition text-sm flex items-center gap-1 mx-auto"
                                                    title="รับทราบ/แก้ไขแล้ว"
                                                >
                                                    <CheckCircle2 size={16} /> <span className="hidden md:inline">รับทราบ</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {complaints.length === 0 && (
                        <div className="p-10 text-center text-gray-400">ยังไม่มีข้อความร้องเรียน</div>
                    )}
                </div>
            </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;