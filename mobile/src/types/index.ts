export type Role = 'user' | 'ngo' | 'hospital' | 'ambulance' | 'admin';
export type Tab = 'home' | 'cases' | 'wallet' | 'alerts' | 'admin' | 'profile';

export type User = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isAdmin?: boolean;
  isApproved?: boolean;
  walletBalance?: number;
  orgName?: string;
  phone?: string;
  vehicleNumber?: string;
  location?: { lat?: number; lng?: number; address?: string };
  impersonating?: unknown;
};

export type Rescue = {
  _id: string;
  description: string;
  status: string;
  animalType?: string;
  location?: { lat?: number; lng?: number; address?: string };
  createdAt?: string;
  images?: string[];
  video?: string | null;
  amountRaised?: number;
  estimatedCost?: number;
  fundraiser?: {
    status?: string;
    requestedGoal?: number;
    adminNotes?: string;
    billText?: string;
    billImage?: string;
  };
  bill?: { totalAmount?: number; paidStatus?: string };
  assignedNGO?: { name?: string; orgName?: string; phone?: string };
  assignedHospital?: { name?: string; orgName?: string; phone?: string };
  assignedAmbulance?: { name?: string; vehicleNumber?: string; phone?: string };
};
