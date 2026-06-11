export type UserRole = 'nurse' | 'doctor' | 'patient';

export type PatientStatus = 'waiting' | 'infusing' | 'completed' | 'cancelled';

export type SeatStatus = 'available' | 'occupied' | 'disinfecting' | 'maintenance';

export interface Patient {
  id: string;
  queueNumber: string;
  name: string;
  age: number;
  gender: '男' | '女';
  allergies: string[];
  medication: string;
  isAllergyRisk: boolean;
  isSpecialMedication: boolean;
  allergyConfirmed: boolean;
  status: PatientStatus;
  seatId: string | null;
  assignedAt: Date | null;
  infusionStartedAt: Date | null;
  infusionCompletedAt: Date | null;
  estimatedWaitTime: number;
  notes: string;
}

export interface Seat {
  id: string;
  row: number;
  col: number;
  status: SeatStatus;
  patientId: string | null;
  disinfectionStartedAt: Date | null;
  disinfectionDuration: number;
}

export interface Statistics {
  waitingCount: number;
  infusingCount: number;
  availableSeats: number;
  disinfectingSeats: number;
}

export const SEAT_STATUS_LABELS: Record<SeatStatus, string> = {
  available: '可用',
  occupied: '占用',
  disinfecting: '消毒中',
  maintenance: '维修中',
};

export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
  waiting: '排队中',
  infusing: '输液中',
  completed: '已完成',
  cancelled: '已取消',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  nurse: '护士',
  doctor: '医生',
  patient: '患者',
};
