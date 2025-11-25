import { Tier, Member, Benefit } from './types';

export const INITIAL_BENEFITS: Benefit[] = [
  {
    id: 'b1',
    title: 'ส่วนลด 5%',
    description: 'ลดค่าอาหาร 5% ทันทีเมื่อทานครบ 500 บาท',
    tier: Tier.SILVER,
    pointsCost: 0,
    dateAdded: '2023-01-01',
    expiryDate: null
  },
  {
    id: 'b2',
    title: 'ฟรี ส้มตำไทย',
    description: 'รับฟรีส้มตำไทย 1 จาน เมื่อมาทานในเดือนเกิด',
    tier: Tier.SILVER,
    pointsCost: 0,
    dateAdded: '2023-01-01',
    expiryDate: null
  },
  {
    id: 'b3',
    title: 'ส่วนลด 10%',
    description: 'ลดค่าอาหาร 10% ไม่มีขั้นต่ำ',
    tier: Tier.GOLD,
    pointsCost: 0,
    dateAdded: '2023-01-01',
    expiryDate: '2024-12-31'
  },
  {
    id: 'b4',
    title: 'ฟรี ไก่ย่างเขาสวนกวาง',
    description: 'รับฟรีไก่ย่าง 1 ตัว (ใช้ได้ 1 ครั้ง/เดือน)',
    tier: Tier.GOLD,
    pointsCost: 0,
    dateAdded: '2023-02-15',
    expiryDate: null
  },
  {
    id: 'b5',
    title: 'แลกเครื่องดื่มสมุนไพร',
    description: 'ใช้ 50 แต้ม แลกรับน้ำลำไย หรือ น้ำเก๊กฮวย',
    tier: Tier.SILVER,
    pointsCost: 50,
    dateAdded: '2023-03-01',
    expiryDate: null
  },
  {
    id: 'b6',
    title: 'Voucher 500 บาท',
    description: 'ใช้ 500 แต้ม แลกบัตรแทนเงินสด',
    tier: Tier.GOLD,
    pointsCost: 500,
    dateAdded: '2023-03-01',
    expiryDate: null
  }
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'คุณสมชาย ใจดี',
    phoneNumber: '0812345678',
    tier: Tier.SILVER,
    points: 120,
    usedBenefits: [],
    transactions: [
        { id: 't1', date: '2023-01-15', amount: 100, description: 'สมัครสมาชิกใหม่' },
        { id: 't2', date: '2023-02-20', amount: 20, description: 'ทานอาหาร' }
    ],
    joinedDate: '2023-01-15'
  },
  {
    id: 'm2',
    name: 'คุณหญิง แอบแซ่บ',
    phoneNumber: '0998887777',
    tier: Tier.GOLD,
    points: 850,
    usedBenefits: ['b4'],
    transactions: [
        { id: 't3', date: '2023-03-10', amount: 500, description: 'ย้ายค่ายมาแซ่บ' },
        { id: 't4', date: '2023-04-05', amount: 350, description: 'เลี้ยงฉลองวันเกิด' }
    ],
    joinedDate: '2023-03-10'
  }
];