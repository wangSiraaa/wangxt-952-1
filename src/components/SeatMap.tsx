import { memo, useEffect, useState } from 'react';
import { Armchair, Sparkles, Wrench, User } from 'lucide-react';
import { useInfusionStore } from '../store/useInfusionStore';
import { useShallow } from 'zustand/react/shallow';
import { SEAT_STATUS_LABELS } from '../types';
import { cn } from '../lib/utils';
import { getDisinfectionProgress, getDisinfectionRemaining } from '../utils/formatters';
import type { Seat, SeatStatus, Patient } from '../types';

interface SeatMapProps {
  onSelectPatient: (patient: Patient) => void;
  onClearSelection?: () => void;
}

interface SeatCellProps {
  seat: Seat;
  isSelected: boolean;
  onClick: () => void;
  currentRole: string;
  canAssign: boolean;
  hasSelectedPatient: boolean;
  patientName?: string;
  patient?: Patient;
}

const SeatCell = memo(function SeatCell({
  seat,
  isSelected,
  onClick,
  currentRole,
  canAssign,
  hasSelectedPatient,
  patientName,
  patient,
}: SeatCellProps) {
  const [progress, setProgress] = useState(0);
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (seat.status === 'disinfecting' && seat.disinfectionStartedAt) {
      const updateProgress = () => {
        setProgress(getDisinfectionProgress(seat.disinfectionStartedAt!, seat.disinfectionDuration));
        setRemaining(getDisinfectionRemaining(seat.disinfectionStartedAt!, seat.disinfectionDuration));
      };
      updateProgress();
      const interval = setInterval(updateProgress, 10000);
      return () => clearInterval(interval);
    }
  }, [seat.status, seat.disinfectionStartedAt, seat.disinfectionDuration]);

  const statusConfig: Record<SeatStatus, { bg: string; border: string; icon: typeof Armchair; textColor: string; dotColor: string }> = {
    available: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      icon: Armchair,
      textColor: 'text-green-600',
      dotColor: 'bg-green-500',
    },
    occupied: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      icon: User,
      textColor: 'text-blue-600',
      dotColor: 'bg-blue-500',
    },
    disinfecting: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      icon: Sparkles,
      textColor: 'text-red-600',
      dotColor: 'bg-red-500',
    },
    maintenance: {
      bg: 'bg-gray-100',
      border: 'border-gray-400',
      icon: Wrench,
      textColor: 'text-gray-500',
      dotColor: 'bg-gray-400',
    },
  };

  const config = statusConfig[seat.status];
  const Icon = config.icon;
  const isClickable = currentRole === 'nurse' && (seat.status === 'available' || seat.status === 'disinfecting') ||
    (seat.status === 'occupied' && patient && currentRole !== 'patient');

  const handleClick = () => {
    if (seat.status === 'occupied' && patient) {
      onClick();
    } else if (currentRole === 'nurse') {
      onClick();
    }
  };

  const showAvailableHighlight = hasSelectedPatient && seat.status === 'available';
  const showAssignHint = canAssign;

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      className={cn(
        'relative p-3 rounded-xl border-2 transition-all duration-300',
        config.bg,
        config.border,
        isClickable && 'cursor-pointer hover:shadow-md hover:scale-105',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2',
        showAvailableHighlight && !canAssign && 'ring-2 ring-green-400 ring-offset-1 border-green-500 bg-green-100',
        showAssignHint && 'ring-2 ring-green-500 ring-offset-2 scale-105 shadow-lg bg-green-100',
        !isClickable && 'cursor-default',
        seat.status === 'disinfecting' && 'animate-pulse-slow'
      )}
    >
      <div className="flex flex-col items-center">
        <Icon className={cn('mb-1', config.textColor)} size={24} />
        <span className={cn('text-xs font-semibold', config.textColor)}>{seat.id}</span>
        {seat.status === 'occupied' && patientName && (
          <span className="text-xs text-gray-600 mt-1 truncate w-full text-center">
            {patientName}
          </span>
        )}
        {seat.status === 'disinfecting' && (
          <div className="w-full mt-2">
            <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-red-600">{remaining}</span>
          </div>
        )}
        {showAssignHint && (
          <div className="absolute -top-2 -right-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse shadow-md">
              <span className="text-white text-xs font-bold">+</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default function SeatMap({ onSelectPatient, onClearSelection }: SeatMapProps) {
  const {
    seats,
    currentRole,
    selectedPatientId,
    getPatientBySeatId,
    assignSeat,
    completeDisinfection,
    canAssignSeat,
    getPatientById,
    setSelectedPatient,
  } = useInfusionStore(
    useShallow(state => ({
      seats: state.seats,
      currentRole: state.currentRole,
      selectedPatientId: state.selectedPatientId,
      getPatientBySeatId: state.getPatientBySeatId,
      assignSeat: state.assignSeat,
      completeDisinfection: state.completeDisinfection,
      canAssignSeat: state.canAssignSeat,
      getPatientById: state.getPatientById,
      setSelectedPatient: state.setSelectedPatient,
    }))
  );

  const rows = Array.from(new Set(seats.map(s => s.row))).sort((a, b) => a - b);
  const selectedPatient = selectedPatientId ? getPatientById(selectedPatientId) : null;
  const hasSelectedPatientWaiting = selectedPatient?.status === 'waiting';

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'occupied') {
      const patient = getPatientBySeatId(seat.id);
      if (patient && currentRole !== 'patient') {
        onSelectPatient(patient);
      }
      return;
    }

    if (currentRole !== 'nurse') return;

    if (seat.status === 'disinfecting') {
      completeDisinfection(seat.id);
      return;
    }

    if (seat.status === 'available' && selectedPatientId) {
      const success = assignSeat(selectedPatientId, seat.id);
      if (success) {
        setSelectedPatient(null);
        onClearSelection?.();
      }
    }
  };

  const getDotColor = (status: SeatStatus): string => {
    const colors: Record<SeatStatus, string> = {
      available: 'bg-green-500',
      occupied: 'bg-blue-500',
      disinfecting: 'bg-red-500',
      maintenance: 'bg-gray-400',
    };
    return colors[status];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">座位图</h3>
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          {(['available', 'occupied', 'disinfecting', 'maintenance'] as SeatStatus[]).map(status => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={cn('w-3 h-3 rounded-full', getDotColor(status))} />
              <span className="text-xs text-gray-500">{SEAT_STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6">
        {currentRole === 'nurse' && selectedPatientId && selectedPatient && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-blue-800">
                  已选中：{selectedPatient.name} ({selectedPatient.queueNumber})
                </span>
                <p className="text-xs text-blue-600 mt-1">
                  {selectedPatient.isAllergyRisk && !selectedPatient.allergyConfirmed
                    ? '⚠️ 过敏待确认，请先在详情中确认过敏'
                    : '请点击一个绿色可用座位来安排患者'
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  onClearSelection?.();
                }}
                className="px-3 py-1 text-xs bg-white text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
              >
                取消选中
              </button>
            </div>
          </div>
        )}
        <div className="space-y-3">
          {rows.map(row => {
            const rowSeats = seats.filter(s => s.row === row).sort((a, b) => a.col - b.col);
            return (
              <div key={row} className="flex items-center gap-3">
                <span className="w-8 text-sm text-gray-400 text-right">{row}排</span>
                <div className="flex-1 grid grid-cols-5 gap-3">
                  {rowSeats.map(seat => {
                    const patient = getPatientBySeatId(seat.id);
                    const canAssign = selectedPatientId ? canAssignSeat(selectedPatientId, seat.id) : false;
                    return (
                      <SeatCell
                        key={seat.id}
                        seat={seat}
                        isSelected={false}
                        onClick={() => handleSeatClick(seat)}
                        currentRole={currentRole}
                        canAssign={canAssign}
                        hasSelectedPatient={hasSelectedPatientWaiting}
                        patientName={patient?.name}
                        patient={patient}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
