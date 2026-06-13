import { create } from 'zustand';
import type { Patient, Seat, UserRole, Statistics, PatientStatus, SeatStatus, RiskLevel, SkinTestResult } from '../types';
import { initialPatients, initialSeats, currentPatientViewId } from '../data/mockData';

interface InfusionState {
  patients: Patient[];
  seats: Seat[];
  currentRole: UserRole;
  currentPatientViewId: string | null;
  selectedPatientId: string | null;
  showPatientModal: boolean;

  getStatistics: () => Statistics;
  getVerifyingPatients: () => Patient[];
  getWaitingPatients: () => Patient[];
  getInfusingPatients: () => Patient[];
  getPausedPatients: () => Patient[];
  getObservationPatients: () => Patient[];
  getAlertPatients: () => Patient[];
  getPatientById: (id: string) => Patient | undefined;
  getSeatById: (id: string) => Seat | undefined;
  getSeatsByRow: (row: number) => Seat[];
  getPatientBySeatId: (seatId: string) => Patient | undefined;

  setCurrentRole: (role: UserRole) => void;
  setSelectedPatient: (patientId: string | null) => void;
  setShowPatientModal: (show: boolean) => void;
  setCurrentPatientViewId: (id: string | null) => void;

  updatePatient: (id: string, updates: Partial<Patient>) => void;
  confirmAllergy: (patientId: string) => void;
  markAllergyRisk: (patientId: string, isRisk: boolean) => void;
  markSpecialMedication: (patientId: string, isSpecial: boolean) => void;
  setRiskLevel: (patientId: string, riskLevel: RiskLevel) => void;
  verifyDrugBatch: (patientId: string) => void;
  setSkinTestResult: (patientId: string, result: SkinTestResult) => void;
  passVerification: (patientId: string) => void;

  startInfusion: (patientId: string) => void;
  pauseInfusion: (patientId: string) => void;
  resumeInfusion: (patientId: string) => void;
  nextBottle: (patientId: string) => void;
  completeInfusion: (patientId: string) => void;
  cancelQueue: (patientId: string) => boolean;

  startObservation: (patientId: string) => void;
  triggerObservationAlert: (patientId: string, note: string) => void;
  resolveObservationAlert: (patientId: string) => void;
  completeObservation: (patientId: string) => void;

  assignSeat: (patientId: string, seatId: string) => boolean;
  changeSeat: (patientId: string, newSeatId: string) => boolean;
  startDisinfection: (seatId: string) => void;
  completeDisinfection: (seatId: string) => void;
  setSeatMaintenance: (seatId: string, isMaintenance: boolean) => void;

  canAssignSeat: (patientId: string, seatId: string) => boolean;
  canCancelQueue: (patientId: string) => boolean;
  canStartInfusion: (patientId: string) => boolean;
}

const riskPriority = (p: Patient): number => {
  if (p.riskLevel === 'allergy_review' && !p.allergyConfirmed) return 0;
  if (p.riskLevel === 'child') return 1;
  if (p.riskLevel === 'high') return 2;
  if (p.riskLevel === 'allergy_review') return 3;
  return 4;
};

export const useInfusionStore = create<InfusionState>((set, get) => ({
  patients: initialPatients,
  seats: initialSeats,
  currentRole: 'nurse',
  currentPatientViewId: currentPatientViewId,
  selectedPatientId: null,
  showPatientModal: false,

  getStatistics: () => {
    const { patients, seats } = get();
    return {
      verifyingCount: patients.filter(p => p.status === 'verifying').length,
      waitingCount: patients.filter(p => p.status === 'waiting').length,
      infusingCount: patients.filter(p => p.status === 'infusing').length,
      pausedCount: patients.filter(p => p.status === 'paused').length,
      observationCount: patients.filter(p => p.status === 'observation').length,
      availableSeats: seats.filter(s => s.status === 'available').length,
      disinfectingSeats: seats.filter(s => s.status === 'disinfecting').length,
    };
  },

  getVerifyingPatients: () => {
    const { patients } = get();
    return patients.filter(p => p.status === 'verifying');
  },

  getWaitingPatients: () => {
    const { patients } = get();
    return patients
      .filter(p => p.status === 'waiting')
      .sort((a, b) => {
        const aP = riskPriority(a);
        const bP = riskPriority(b);
        if (aP !== bP) return aP - bP;
        return a.queueNumber.localeCompare(b.queueNumber);
      });
  },

  getInfusingPatients: () => {
    const { patients } = get();
    return patients.filter(p => p.status === 'infusing');
  },

  getPausedPatients: () => {
    const { patients } = get();
    return patients.filter(p => p.status === 'paused');
  },

  getObservationPatients: () => {
    const { patients } = get();
    return patients.filter(p => p.status === 'observation');
  },

  getAlertPatients: () => {
    const { patients } = get();
    return patients.filter(p =>
      (p.status === 'verifying') ||
      (p.status === 'waiting' && p.isAllergyRisk && !p.allergyConfirmed) ||
      (p.status === 'waiting' && p.isSpecialMedication) ||
      (p.skinTestResult === 'positive') ||
      (p.status === 'observation' && p.observationAlert)
    );
  },

  getPatientById: (id: string) => {
    const { patients } = get();
    return patients.find(p => p.id === id);
  },

  getSeatById: (id: string) => {
    const { seats } = get();
    return seats.find(s => s.id === id);
  },

  getSeatsByRow: (row: number) => {
    const { seats } = get();
    return seats.filter(s => s.row === row).sort((a, b) => a.col - b.col);
  },

  getPatientBySeatId: (seatId: string) => {
    const { patients } = get();
    return patients.find(p => p.seatId === seatId);
  },

  setCurrentRole: (role: UserRole) => set({ currentRole: role }),

  setSelectedPatient: (patientId: string | null) => set({ selectedPatientId: patientId }),

  setShowPatientModal: (show: boolean) => set({ showPatientModal: show }),

  setCurrentPatientViewId: (id: string | null) => set({ currentPatientViewId: id }),

  updatePatient: (id: string, updates: Partial<Patient>) => {
    set(state => ({
      patients: state.patients.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  confirmAllergy: (patientId: string) => {
    get().updatePatient(patientId, {
      allergyConfirmed: true,
      riskLevel: 'normal' as RiskLevel,
    });
  },

  markAllergyRisk: (patientId: string, isRisk: boolean) => {
    get().updatePatient(patientId, {
      isAllergyRisk: isRisk,
      allergyConfirmed: isRisk ? false : true,
      riskLevel: isRisk ? 'allergy_review' as RiskLevel : 'normal' as RiskLevel,
    });
  },

  markSpecialMedication: (patientId: string, isSpecial: boolean) => {
    const patient = get().getPatientById(patientId);
    get().updatePatient(patientId, {
      isSpecialMedication: isSpecial,
      riskLevel: isSpecial ? 'high' as RiskLevel : (patient?.riskLevel === 'high' ? 'normal' as RiskLevel : patient?.riskLevel || 'normal' as RiskLevel),
    });
  },

  setRiskLevel: (patientId: string, riskLevel: RiskLevel) => {
    get().updatePatient(patientId, { riskLevel });
  },

  verifyDrugBatch: (patientId: string) => {
    get().updatePatient(patientId, { drugBatchVerified: true });
  },

  setSkinTestResult: (patientId: string, result: SkinTestResult) => {
    const updates: Partial<Patient> = { skinTestResult: result };
    if (result === 'positive') {
      updates.riskLevel = 'allergy_review';
      updates.isAllergyRisk = true;
      updates.allergyConfirmed = false;
    }
    get().updatePatient(patientId, updates);
  },

  passVerification: (patientId: string) => {
    const patient = get().getPatientById(patientId);
    if (!patient || patient.status !== 'verifying') return;
    if (!patient.drugBatchVerified) return;
    if (patient.skinTestResult === 'pending' && patient.isAllergyRisk) return;
    if (patient.isAllergyRisk && !patient.allergyConfirmed) return;
    get().updatePatient(patientId, { status: 'waiting' as PatientStatus });
  },

  startInfusion: (patientId: string) => {
    const patient = get().getPatientById(patientId);
    if (!patient || !get().canStartInfusion(patientId)) return;

    get().updatePatient(patientId, {
      status: 'infusing' as PatientStatus,
      infusionStartedAt: new Date(),
      infusionPhase: 'first_bottle',
      currentBottle: 1,
    });
  },

  pauseInfusion: (patientId: string) => {
    const patient = get().getPatientById(patientId);
    if (!patient || patient.status !== 'infusing') return;

    get().updatePatient(patientId, {
      status: 'paused' as PatientStatus,
      infusionPhase: 'paused',
      pausedAt: new Date(),
    });
  },

  resumeInfusion: (patientId: string) => {
    const patient = get().getPatientById(patientId);
    if (!patient || patient.status !== 'paused') return;

    get().updatePatient(patientId, {
      status: 'infusing' as PatientStatus,
      infusionPhase: 'continuing',
      pausedAt: null,
    });
  },

  nextBottle: (patientId: string) => {
    const patient = get().getPatientById(patientId);
    if (!patient || patient.status !== 'infusing') return;

    get().updatePatient(patientId, {
      currentBottle: patient.currentBottle + 1,
      infusionPhase: 'continuing',
    });
  },

  completeInfusion: (patientId: string) => {
    const patient = get().getPatientById(patientId);
    if (!patient || (patient.status !== 'infusing' && patient.status !== 'paused')) return;

    get().updatePatient(patientId, {
      status: 'observation' as PatientStatus,
      infusionCompletedAt: new Date(),
      infusionPhase: 'finishing',
      observationStartedAt: new Date(),
      pausedAt: null,
    });
  },

  cancelQueue: (patientId: string): boolean => {
    if (!get().canCancelQueue(patientId)) return false;

    const patient = get().getPatientById(patientId);
    if (patient?.seatId) {
      set(state => ({
        seats: state.seats.map(s =>
          s.id === patient.seatId
            ? { ...s, status: 'disinfecting' as SeatStatus, patientId: null, disinfectionStartedAt: new Date() }
            : s
        ),
      }));
    }

    get().updatePatient(patientId, { status: 'cancelled' as PatientStatus, seatId: null });
    return true;
  },

  startObservation: (patientId: string) => {
    const patient = get().getPatientById(patientId);
    if (!patient || patient.status !== 'observation') return;

    get().updatePatient(patientId, {
      observationStartedAt: patient.observationStartedAt || new Date(),
    });
  },

  triggerObservationAlert: (patientId: string, note: string) => {
    get().updatePatient(patientId, {
      observationAlert: true,
      observationAlertNote: note,
    });
  },

  resolveObservationAlert: (patientId: string) => {
    get().updatePatient(patientId, {
      observationAlert: false,
      observationAlertNote: '',
    });
  },

  completeObservation: (patientId: string) => {
    const patient = get().getPatientById(patientId);
    if (!patient || patient.status !== 'observation') return;

    get().updatePatient(patientId, {
      status: 'completed' as PatientStatus,
    });

    if (patient.seatId) {
      get().startDisinfection(patient.seatId);
    }
  },

  assignSeat: (patientId: string, seatId: string): boolean => {
    if (!get().canAssignSeat(patientId, seatId)) return false;

    set(state => ({
      patients: state.patients.map(p =>
        p.id === patientId
          ? {
              ...p,
              seatId,
              assignedAt: new Date(),
              status: 'infusing' as PatientStatus,
              infusionStartedAt: new Date(),
              infusionPhase: 'first_bottle' as const,
              currentBottle: 1,
            }
          : p
      ),
      seats: state.seats.map(s =>
        s.id === seatId
          ? { ...s, status: 'occupied' as SeatStatus, patientId }
          : s
      ),
    }));

    return true;
  },

  changeSeat: (patientId: string, newSeatId: string): boolean => {
    const patient = get().getPatientById(patientId);
    const newSeat = get().getSeatById(newSeatId);
    if (!patient || !newSeat) return false;
    if (!['infusing', 'paused', 'observation'].includes(patient.status)) return false;
    if (newSeat.status !== 'available') return false;

    if (patient.riskLevel === 'high' || patient.riskLevel === 'child' || patient.riskLevel === 'allergy_review') {
      if (newSeat.zone === 'unsupervised') return false;
    }

    const oldSeatId = patient.seatId;

    set(state => ({
      patients: state.patients.map(p =>
        p.id === patientId ? { ...p, seatId: newSeatId } : p
      ),
      seats: state.seats.map(s => {
        if (s.id === newSeatId) {
          return { ...s, status: 'occupied' as SeatStatus, patientId };
        }
        if (oldSeatId && s.id === oldSeatId) {
          return {
            ...s,
            status: 'disinfecting' as SeatStatus,
            patientId: null,
            disinfectionStartedAt: new Date(),
          };
        }
        return s;
      }),
    }));

    return true;
  },

  startDisinfection: (seatId: string) => {
    set(state => ({
      seats: state.seats.map(s =>
        s.id === seatId
          ? {
              ...s,
              status: 'disinfecting' as SeatStatus,
              patientId: null,
              disinfectionStartedAt: new Date(),
            }
          : s
      ),
      patients: state.patients.map(p =>
        p.seatId === seatId ? { ...p, seatId: null } : p
      ),
    }));
  },

  completeDisinfection: (seatId: string) => {
    set(state => ({
      seats: state.seats.map(s =>
        s.id === seatId
          ? {
              ...s,
              status: 'available' as SeatStatus,
              disinfectionStartedAt: null,
            }
          : s
      ),
    }));
  },

  setSeatMaintenance: (seatId: string, isMaintenance: boolean) => {
    set(state => ({
      seats: state.seats.map(s =>
        s.id === seatId
          ? {
              ...s,
              status: isMaintenance ? 'maintenance' as SeatStatus : 'available' as SeatStatus,
              patientId: null,
            }
          : s
      ),
      patients: state.patients.map(p =>
        p.seatId === seatId && isMaintenance ? { ...p, seatId: null } : p
      ),
    }));
  },

  canAssignSeat: (patientId: string, seatId: string): boolean => {
    const patient = get().getPatientById(patientId);
    const seat = get().getSeatById(seatId);

    if (!patient || !seat) return false;
    if (patient.status !== 'waiting') return false;

    if (!patient.drugBatchVerified) return false;

    if (patient.isAllergyRisk && !patient.allergyConfirmed) return false;

    if (patient.isAllergyRisk && patient.skinTestResult === 'pending') return false;
    if (patient.skinTestResult === 'positive') return false;

    if (seat.status === 'disinfecting' || seat.status === 'maintenance' || seat.status === 'occupied') {
      return false;
    }

    if (patient.riskLevel === 'high' || patient.riskLevel === 'child' || patient.riskLevel === 'allergy_review') {
      if (seat.zone === 'unsupervised') return false;
    }

    return true;
  },

  canCancelQueue: (patientId: string): boolean => {
    const patient = get().getPatientById(patientId);
    if (!patient) return false;
    return ['verifying', 'waiting'].includes(patient.status);
  },

  canStartInfusion: (patientId: string): boolean => {
    const patient = get().getPatientById(patientId);
    if (!patient) return false;
    return patient.status === 'waiting' && patient.seatId !== null;
  },
}));
