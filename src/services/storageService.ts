import { Member, Benefit, Tier, Transaction, Complaint } from '../types';
import { INITIAL_MEMBERS, INITIAL_BENEFITS } from '../constants';

const MEMBERS_KEY = 'zaab_members';
const BENEFITS_KEY = 'zaab_benefits';
const COMPLAINTS_KEY = 'zaab_complaints';

// Helper to simulate delay for realism
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getMembers = (): Member[] => {
  const stored = localStorage.getItem(MEMBERS_KEY);
  if (!stored) {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(INITIAL_MEMBERS));
    return INITIAL_MEMBERS;
  }
  
  try {
      const members: Member[] = JSON.parse(stored);
      // Data Migration: Ensure all arrays exist to prevent crashes
      const migrated = members.map(m => ({
        ...m,
        transactions: Array.isArray(m.transactions) ? m.transactions : [],
        usedBenefits: Array.isArray(m.usedBenefits) ? m.usedBenefits : []
      }));
      return migrated;
  } catch (e) {
      console.error("Error parsing members data", e);
      return INITIAL_MEMBERS;
  }
};

export const saveMembers = (members: Member[]) => {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
};

export const getBenefits = (): Benefit[] => {
  const stored = localStorage.getItem(BENEFITS_KEY);
  if (!stored) {
    localStorage.setItem(BENEFITS_KEY, JSON.stringify(INITIAL_BENEFITS));
    return INITIAL_BENEFITS;
  }
  return JSON.parse(stored);
};

export const saveBenefits = (benefits: Benefit[]) => {
  localStorage.setItem(BENEFITS_KEY, JSON.stringify(benefits));
};

export const findMemberByPhone = async (phone: string): Promise<Member | null> => {
  await delay(500); // Fake API latency
  const members = getMembers();
  return members.find(m => m.phoneNumber === phone) || null;
};

export const redeemBenefit = (memberId: string, benefitId: string, pointsCost: number): boolean => {
  const members = getMembers();
  const index = members.findIndex(m => m.id === memberId);
  
  if (index === -1) return false;
  
  const member = members[index];

  // Double check points
  if (member.points < pointsCost) return false;

  const newTransaction: Transaction = {
    id: `tx${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    amount: -pointsCost,
    description: pointsCost > 0 ? 'แลกสิทธิประโยชน์' : 'ใช้สิทธิพิเศษ (ฟรี)'
  };

  const updatedMember = {
    ...member,
    points: member.points - pointsCost,
    usedBenefits: [...(member.usedBenefits || []), benefitId], // Safe spread
    transactions: [newTransaction, ...(member.transactions || [])] // Safe spread
  };

  members[index] = updatedMember;
  saveMembers(members);
  return true;
};

export const addNewMember = (data: Omit<Member, 'id' | 'joinedDate' | 'usedBenefits' | 'transactions'>): Member => {
  const members = getMembers();
  const newMember: Member = {
    ...data,
    id: `m${Date.now()}`,
    joinedDate: new Date().toISOString().split('T')[0],
    usedBenefits: [],
    transactions: [
        {
            id: `tx${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            amount: data.points,
            description: 'แต้มเริ่มต้น'
        }
    ]
  };
  members.push(newMember);
  saveMembers(members);
  return newMember;
};

export const addPoints = (memberId: string, amount: number, description: string = 'ทานอาหารที่ร้าน'): Member | null => {
    const members = getMembers();
    const index = members.findIndex(m => m.id === memberId);
    if (index === -1) return null;

    const member = members[index];
    const newTransaction: Transaction = {
        id: `tx${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: amount,
        description: description
    };

    const updatedMember = {
        ...member,
        points: member.points + amount,
        transactions: [newTransaction, ...(member.transactions || [])]
    };

    members[index] = updatedMember;
    saveMembers(members);
    return updatedMember;
};

export const updateMember = (updatedMember: Member): void => {
    const members = getMembers();
    const index = members.findIndex(m => m.id === updatedMember.id);
    if (index !== -1) {
        members[index] = updatedMember;
        saveMembers(members);
    }
};

// Complaint Functions
export const getComplaints = (): Complaint[] => {
    const stored = localStorage.getItem(COMPLAINTS_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const addComplaint = (complaintData: Omit<Complaint, 'id' | 'date' | 'status'>): Complaint => {
    const complaints = getComplaints();
    const newComplaint: Complaint = {
        ...complaintData,
        id: `c${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        status: 'PENDING'
    };
    complaints.unshift(newComplaint); // Add to top
    localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
    return newComplaint;
};

export const resolveComplaint = (id: string): void => {
    const complaints = getComplaints();
    const index = complaints.findIndex(c => c.id === id);
    if (index !== -1) {
        complaints[index].status = 'RESOLVED';
        localStorage.setItem(COMPLAINTS_KEY, JSON.stringify(complaints));
    }
};