
export enum UserRole {
  SANJAYA = 'SANJAYA',
  RAVI = 'RAVI',
  NONE = 'NONE'
}

export interface User {
  email: string;
  name: string;
  role: UserRole;
}

export interface DesignCost {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  extraCharges?: number;
  addedBy: string;
  paid?: boolean; // Add this field
  paidDate?: string; // Optional: when it was paid
}

export interface Payment {
  id: string;
  date: string;
  method: string;
  amount: number;
  note: string;
  addedBy: string;
}

export interface QuickButton {
  id: string;
  label: string;
  amount: number;
  type: string;
}

export interface AppSettings {
  sanjayaEmail: string;
  raviEmail: string;
  quickButtons: QuickButton[];
  gasWebAppUrl?: string; // The URL for Google Apps Script sync
}
