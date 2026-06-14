export type UserRole = 'nurse' | 'doctor' | 'patient';

export type PatientStatus = 'verifying' | 'waiting' | 'seated' | 'infusing' | 'paused' | 'observation' | 'completed' | 'cancelled';

export type SeatStatus = 'available' | 'occupied' | 'disinfecting' | 'maintenance';

export type SeatZone = 'supervised' | 'normal' | 'unsupervised';

export type SkinTestResult = 'pending' | 'negative' | 'positive';

export type RiskLevel = 'normal' | 'child' | 'high' | 'allergy_review';

export type InfusionPhase = 'not_started' | 'first_bottle' | 'continuing' | 'paused' | 'finishing';

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
  drugBatchVerified: boolean;
  skinTestResult: SkinTestResult;
  riskLevel: RiskLevel;
  infusionPhase: InfusionPhase;
  bottleCount: number;
  currentBottle: number;
  status: PatientStatus;
  seatId: string | null;
  assignedAt: Date | null;
  infusionStartedAt: Date | null;
  infusionCompletedAt: Date | null;
  pausedAt: Date | null;
  observationStartedAt: Date | null;
  observationAlert: boolean;
  observationAlertNote: string;
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
  zone: SeatZone;
}

export interface Statistics {
  verifyingCount: number;
  waitingCount: number;
  seatedCount: number;
  infusingCount: number;
  pausedCount: number;
  observationCount: number;
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
  verifying: '核验中',
  waiting: '排队中',
  seated: '待开始',
  infusing: '输液中',
  paused: '已暂停',
  observation: '留观中',
  completed: '已完成',
  cancelled: '已取消',
};

export const SEAT_ZONE_LABELS: Record<SeatZone, string> = {
  supervised: '重点巡视区',
  normal: '常规区',
  unsupervised: '普通区',
};

export const SKIN_TEST_LABELS: Record<SkinTestResult, string> = {
  pending: '待做',
  negative: '阴性',
  positive: '阳性',
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  normal: '普通',
  child: '儿童优先',
  high: '高风险',
  allergy_review: '过敏复核',
};

export const INFUSION_PHASE_LABELS: Record<InfusionPhase, string> = {
  not_started: '未开始',
  first_bottle: '首瓶',
  continuing: '续瓶中',
  paused: '已暂停',
  finishing: '即将结束',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  nurse: '护士',
  doctor: '医生',
  patient: '患者',
};
