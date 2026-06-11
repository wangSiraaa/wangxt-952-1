import { create } from 'zustand';
import type { Patient, Seat, UserRole, Statistics, PatientStatus, SeatStatus } from '../types';
import { initialPatients, initialSeats, currentPatientViewId } from '../data/mockData';

interface InfusionState {
  patients: Patient[];
  seats: Seat[];
  currentRole: UserRole;
  currentPatientViewId: string | null;
  selectedPatientId: string | null;
  showPatientModal: boolean;

  getStatistics: () => Statistics;
  getWaitingPatients: () => Patient[];
  getInfusingPatients: () => Patient[];
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
  startInfusion: (patientId: string) => void;
  completeInfusion: (patientId: string) => void;
  cancelQueue: (patientId: string) => boolean;

  assignSeat: (patientId: string, seatId: string) => boolean;
  startDisinfection: (seatId: string) => void;
  completeDisinfection: (seatId: string) => void;
  setSeatMaintenance: (seatId: string, isMaintenance: boolean) => void;

  canAssignSeat: (patientId: string, seatId: string) => boolean;
  canCancelQueue: (patientId: string) => boolean;
  canStartInfusion: (patientId: string) => boolean;
}

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
      waitingCount: patients.filter(p => p.status === 'waiting').length,
      infusingCount: patients.filter(p => p.status === 'infusing').length,
      availableSeats: seats.filter(s => s.status === 'available').length,
      disinfectingSeats: seats.filter(s => s.status === 'disinfecting').length,
    };
  },

  getWaitingPatients: () => {
    const { patients } = get();
    return patients
      .filter(p => p.status === 'waiting')
      .sort((a, b) => {
        const aPriority = (a.isAllergyRisk && !a.allergyConfirmed) ? 0 : a.isSpecialMedication ? 1 : 2;
        const bPriority = (b.isAllergyRisk && !b.allergyConfirmed) ? 0 : b.isSpecialMedication ? 1 : 2;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.queueNumber.localeCompare(b.queueNumber);
      });
  },

  getInfusingPatients: () => {
    const { patients } = get();
    return patients.filter(p => p.status === 'infusing');
  },

  getAlertPatients: () => {
    const { patients } = get();
    return patients.filter(p =>
      p.status === 'waiting' &&
      ((p.isAllergyRisk && !p.allergyConfirmed) || p.isSpecialMedication)
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
    get().updatePatient(patientId, { allergyConfirmed: true });
  },

  markAllergyRisk: (patientId: string, isRisk: boolean) => {
    get().updatePatient(patientId, {
      isAllergyRisk: isRisk,
      allergyConfirmed: isRisk ? false : true,
    });
  },

  markSpecialMedication: (patientId: string, isSpecial: boolean) => {
    get().updatePatient(patientId, { isSpecialMedication: isSpecial });
  },

  startInfusion: (patientId: string) => {
    const patient = get().getPatientById(patientId);
    if (!patient || !get().canStartInfusion(patientId)) return;

    get().updatePatient(patientId, {
      status: 'infusing',
      infusionStartedAt: new Date(),
    });
  },

  completeInfusion: (patientId: string) => {
    const patient = get().getPatientById(patientId);
    if (!patient || patient.status !== 'infusing') return;

    get().updatePatient(patientId, {
      status: 'completed',
      infusionCompletedAt: new Date(),
    });

    if (patient.seatId) {
      get().startDisinfection(patient.seatId);
    }
  },

  cancelQueue: (patientId: string): boolean => {
    if (!get().canCancelQueue(patientId)) return false;

    get().updatePatient(patientId, { status: 'cancelled' });
    return true;
  },

  assignSeat: (patientId: string, seatId: string): boolean => {
    if (!get().canAssignSeat(patientId, seatId)) return false;

    const patient = get().getPatientById(patientId);
    const oldSeatId = patient?.seatId;

    set(state => ({
      patients: state.patients.map(p =>
        p.id === patientId
          ? { ...p, seatId, assignedAt: new Date() }
          : p
      ),
      seats: state.seats.map(s => {
        if (s.id === seatId) {
          return { ...s, status: 'occupied' as SeatStatus, patientId };
        }
        if (oldSeatId && s.id === oldSeatId) {
          return { ...s, status: 'available' as SeatStatus, patientId: null };
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

    if (patient.isAllergyRisk && !patient.allergyConfirmed) {
      return false;
    }

    if (seat.status === 'disinfecting' || seat.status === 'maintenance' || seat.status === 'occupied') {
      return false;
    }

    return true;
  },

  canCancelQueue: (patientId: string): boolean => {
    const patient = get().getPatientById(patientId);
    if (!patient) return false;
    return patient.status === 'waiting';
  },

  canStartInfusion: (patientId: string): boolean => {
    const patient = get().getPatientById(patientId);
    if (!patient) return false;
    return patient.status === 'waiting' && patient.seatId !== null;
  },
}));
