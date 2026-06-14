import { memo, useEffect, useState } from 'react';
import { Armchair, Sparkles, Wrench, User, Eye, Pause, AlertTriangle, Baby, Shield } from 'lucide-react';
import { useInfusionStore } from '../store/useInfusionStore';
import { useShallow } from 'zustand/react/shallow';
import { SEAT_STATUS_LABELS, SEAT_ZONE_LABELS, INFUSION_PHASE_LABELS } from '../types';
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

  const isObservationAlert = patient?.status === 'observation' && patient?.observationAlert;
  const isPaused = patient?.status === 'paused';
  const isObservation = patient?.status === 'observation';
  const isSeated = patient?.status === 'seated';

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
  const showZoneDeny = hasSelectedPatient && seat.status === 'available' && !canAssign;

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
        seat.status === 'disinfecting' && 'animate-pulse-slow',
        isObservationAlert && 'ring-2 ring-red-500 ring-offset-1 animate-breath',
        isPaused && 'ring-2 ring-yellow-500 ring-offset-1',
        isObservation && !isObservationAlert && 'border-purple-500 bg-purple-50',
        isSeated && 'border-teal-500 bg-teal-50'
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
        {seat.status === 'occupied' && patient && (
          <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
            {patient.status === 'seated' && (
              <span className="flex items-center gap-0.5 text-[10px] text-teal-700 bg-teal-100 px-1 rounded">
                待开始
              </span>
            )}
            {patient.status === 'paused' && (
              <span className="flex items-center gap-0.5 text-[10px] text-yellow-700 bg-yellow-100 px-1 rounded">
                <Pause size={8} />暂停
              </span>
            )}
            {patient.status === 'observation' && (
              <span className={cn(
                'flex items-center gap-0.5 text-[10px] px-1 rounded',
                patient.observationAlert
                  ? 'text-red-700 bg-red-100'
                  : 'text-purple-700 bg-purple-100'
              )}>
                <Eye size={8} />
                {patient.observationAlert ? '告警' : '留观'}
              </span>
            )}
            {patient.status === 'infusing' && patient.bottleCount > 1 && (
              <span className="text-[10px] text-blue-700 bg-blue-100 px-1 rounded">
                {patient.currentBottle}/{patient.bottleCount}瓶
              </span>
            )}
          </div>
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
        {showZoneDeny && seat.status === 'available' && (
          <div className="absolute -top-2 -right-2">
            <div className="w-5 h-5 bg-red-400 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">✕</span>
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
    changeSeat,
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
      changeSeat: state.changeSeat,
      completeDisinfection: state.completeDisinfection,
      canAssignSeat: state.canAssignSeat,
      getPatientById: state.getPatientById,
      setSelectedPatient: state.setSelectedPatient,
    }))
  );

  const rows = Array.from(new Set(seats.map(s => s.row))).sort((a, b) => a - b);
  const selectedPatient = selectedPatientId ? getPatientById(selectedPatientId) : null;
  const hasSelectedPatientWaiting = selectedPatient?.status === 'waiting';
  const hasSelectedPatientSeated = selectedPatient && ['seated', 'infusing', 'paused', 'observation'].includes(selectedPatient.status);

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
      if (hasSelectedPatientWaiting) {
        const success = assignSeat(selectedPatientId, seat.id);
        if (success) {
          setSelectedPatient(null);
          onClearSelection?.();
        }
      } else if (hasSelectedPatientSeated) {
        const success = changeSeat(selectedPatientId, seat.id);
        if (success) {
          setSelectedPatient(null);
          onClearSelection?.();
        }
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

  const getZoneColor = (zone: string): string => {
    const colors: Record<string, string> = {
      supervised: 'bg-amber-100 text-amber-700 border-amber-300',
      normal: 'bg-slate-100 text-slate-600 border-slate-300',
      unsupervised: 'bg-gray-100 text-gray-500 border-gray-300',
    };
    return colors[zone] || colors.normal;
  };

  const getZoneIcon = (zone: string) => {
    if (zone === 'supervised') return <Shield size={12} />;
    if (zone === 'unsupervised') return <Eye size={12} />;
    return null;
  };

  const getDenyReason = (patientId: string, seatId: string): string | null => {
    const patient = getPatientById(patientId);
    const seat = seats.find(s => s.id === seatId);
    if (!patient || !seat || seat.status !== 'available') return null;

    if (!patient.drugBatchVerified) return '药品批次未核验';
    if (patient.isAllergyRisk && !patient.allergyConfirmed) return '过敏复核未完成';
    if (patient.skinTestResult === 'positive') return '皮试结果阳性';
    if (patient.isAllergyRisk && patient.skinTestResult === 'pending') return '皮试未完成';
    if ((patient.riskLevel === 'high' || patient.riskLevel === 'child' || patient.riskLevel === 'allergy_review') && seat.zone === 'unsupervised') {
      return `${patient.riskLevel === 'child' ? '儿童' : patient.riskLevel === 'high' ? '高风险' : '过敏复核'}患者不可安排到普通区`;
    }
    return null;
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
          <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 pl-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-gray-500">留观中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-teal-500" />
            <span className="text-xs text-gray-500">待开始</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs text-gray-500">已暂停</span>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          {(['supervised', 'normal', 'unsupervised'] as const).map(zone => (
            <div key={zone} className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded border', getZoneColor(zone))}>
              {getZoneIcon(zone)}
              {SEAT_ZONE_LABELS[zone]}
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
                  {selectedPatient.status === 'waiting' && !selectedPatient.drugBatchVerified && '⚠️ 药品批次未核验，请先完成核验'}
                  {selectedPatient.status === 'waiting' && selectedPatient.drugBatchVerified && selectedPatient.isAllergyRisk && !selectedPatient.allergyConfirmed && '⚠️ 过敏待确认，请先确认过敏'}
                  {selectedPatient.status === 'waiting' && selectedPatient.drugBatchVerified && (!selectedPatient.isAllergyRisk || selectedPatient.allergyConfirmed) && '请点击一个绿色可用座位来安排患者'}
                  {selectedPatient.status === 'seated' && '患者已入座，点击详情按钮开始输液'}
                  {hasSelectedPatientSeated && selectedPatient.status !== 'seated' && '点击绿色可用座位换座，原座位将保留消毒倒计时'}
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
            const rowZone = rowSeats[0]?.zone || 'normal';
            return (
              <div key={row} className="flex items-center gap-3">
                <div className="w-20 flex flex-col items-end gap-0.5">
                  <span className="text-sm text-gray-400">{row}排</span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', getZoneColor(rowZone))}>
                    {SEAT_ZONE_LABELS[rowZone as keyof typeof SEAT_ZONE_LABELS]}
                  </span>
                </div>
                <div className="flex-1 grid grid-cols-5 gap-3">
                  {rowSeats.map(seat => {
                    const patient = getPatientBySeatId(seat.id);
                    const canAssign = selectedPatientId ? canAssignSeat(selectedPatientId, seat.id) : false;
                    return (
                      <div key={seat.id} className="relative group">
                        <SeatCell
                          seat={seat}
                          isSelected={false}
                          onClick={() => handleSeatClick(seat)}
                          currentRole={currentRole}
                          canAssign={canAssign}
                          hasSelectedPatient={hasSelectedPatientWaiting || !!hasSelectedPatientSeated}
                          patientName={patient?.name}
                          patient={patient}
                        />
                        {selectedPatientId && seat.status === 'available' && !canAssign && getDenyReason(selectedPatientId, seat.id) && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-red-600 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            {getDenyReason(selectedPatientId, seat.id)}
                          </div>
                        )}
                      </div>
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
