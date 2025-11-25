export enum Tier {
  SILVER = 'Silver',
  GOLD = 'Gold'
}

export interface Benefit {
  id: string;
  title: string;
  description: string;
  tier: Tier;
  pointsCost: number; // 0 if free perk
  dateAdded: string;
  expiryDate?: string | null; // ISO Date string or null if no expiry
}

export interface Transaction {
  id: string;
  date: string;
  amount: number; // positive for earn, negative for redeem
  description: string;
}

export interface Complaint {
  id: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  topic: string;
  message: string;
  status: 'PENDING' | 'RESOLVED';
  date: string;
}

export interface Member {
  id: string;
  name: string;
  phoneNumber: string;
  tier: Tier;
  points: number;
  usedBenefits: string[]; // List of Benefit IDs used
  transactions: Transaction[];
  joinedDate: string;
}

export type ViewState = 'HOME' | 'CUSTOMER_DASHBOARD' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';