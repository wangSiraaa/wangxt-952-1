import { AlertTriangle, Pill, Clock, ChevronRight, Eye } from 'lucide-react';
import { useInfusionStore } from '../store/useInfusionStore';
import { useShallow } from 'zustand/react/shallow';
import { PATIENT_STATUS_LABELS } from '../types';
import { cn } from '../lib/utils';
import { formatDuration } from '../utils/formatters';
import type { Patient } from '../types';

interface QueueListProps {
  onSelectPatient: (patient: Patient) => void;
  onViewPatientDetails: (patient: Patient) => void;
}

interface PatientItemProps {
  patient: Patient;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  currentRole: string;
}

function PatientItem({ patient, index, isSelected, onSelect, onViewDetails, currentRole }: PatientItemProps) {
  const hasAllergyAlert = patient.isAllergyRisk && !patient.allergyConfirmed;
  const hasSpecialMed = patient.isSpecialMedication;

  const handleCardClick = () => {
    if (currentRole === 'nurse' && patient.status === 'waiting') {
      onSelect();
    } else {
      onViewDetails();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 mb-3',
        isSelected
          ? 'border-blue-600 bg-blue-50 shadow-md scale-[1.02]'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm',
        hasAllergyAlert && 'border-l-4 border-l-red-500'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm',
            index === 0 ? 'bg-blue-600 animate-pulse' : 'bg-gray-400'
          )}>
            {patient.queueNumber.slice(-3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{patient.name}</span>
              <span className="text-sm text-gray-500">{patient.age}岁{patient.gender}</span>
              {hasAllergyAlert && (
                <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={12} />
                  过敏待确认
                </span>
              )}
              {hasSpecialMed && (
                <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  <Pill size={12} />
                  特殊用药
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded',
                patient.status === 'waiting' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
              )}>
                {PATIENT_STATUS_LABELS[patient.status]}
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={12} />
                预计等待 {formatDuration(patient.estimatedWaitTime)}
              </span>
              {patient.seatId && (
                <span className="text-xs text-gray-400">座位: {patient.seatId}</span>
              )}
            </div>
          </div>
        </div>
        {currentRole !== 'patient' && (
          <div className="flex items-center gap-2">
            {currentRole === 'nurse' && patient.status === 'waiting' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="查看详情"
              >
                <Eye size={16} />
              </button>
            )}
            <ChevronRight size={20} className={cn(
              'transition-colors',
              currentRole === 'nurse' && patient.status === 'waiting'
                ? 'text-blue-400'
                : 'text-gray-300'
            )} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function QueueList({ onSelectPatient, onViewPatientDetails }: QueueListProps) {
  const {
    currentRole,
    selectedPatientId,
    getWaitingPatients,
    getInfusingPatients,
    currentPatientViewId,
    getPatientById,
    setSelectedPatient,
  } = useInfusionStore(
    useShallow(state => ({
      currentRole: state.currentRole,
      selectedPatientId: state.selectedPatientId,
      getWaitingPatients: state.getWaitingPatients,
      getInfusingPatients: state.getInfusingPatients,
      currentPatientViewId: state.currentPatientViewId,
      getPatientById: state.getPatientById,
      setSelectedPatient: state.setSelectedPatient,
    }))
  );

  const waitingPatients = getWaitingPatients();
  const infusingPatients = getInfusingPatients();

  const handleSelectPatient = (patient: Patient) => {
    if (currentRole === 'patient') return;
    setSelectedPatient(patient.id);
    onSelectPatient(patient);
  };

  const handleViewDetails = (patient: Patient) => {
    if (currentRole === 'patient') return;
    onViewPatientDetails(patient);
  };

  if (currentRole === 'patient') {
    const currentPatient = currentPatientViewId
      ? getPatientById(currentPatientViewId)
      : null;

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">我的输液状态</h3>
        {currentPatient ? (
          <div className="text-center py-8 animate-fade-in">
            <div className="text-6xl font-bold text-blue-600 mb-4">
              {currentPatient.queueNumber}
            </div>
            <p className="text-gray-600 mb-2">
              {currentPatient.name}，您好！
            </p>
            <div className={cn(
              'inline-block px-4 py-2 rounded-full text-sm font-medium',
              currentPatient.status === 'waiting'
                ? 'bg-orange-50 text-orange-600'
                : 'bg-blue-50 text-blue-600'
            )}>
              {PATIENT_STATUS_LABELS[currentPatient.status]}
            </div>
            {currentPatient.status === 'waiting' && (
              <div className="mt-6 text-left bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">预计等待时间：</span>
                  <span className="text-orange-600">{formatDuration(currentPatient.estimatedWaitTime)}</span>
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">前面还有：</span>
                  <span className="text-blue-600">
                    {waitingPatients.findIndex(p => p.id === currentPatient.id)} 位患者
                  </span>
                </p>
              </div>
            )}
            {currentPatient.seatId && (
              <div className="mt-4 text-lg">
                <span className="text-gray-600">座位号：</span>
                <span className="font-bold text-green-600">{currentPatient.seatId}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            暂无排队信息
          </div>
        )}
      </div>
    );
  }

  const selectedPatient = selectedPatientId ? getPatientById(selectedPatientId) : null;
  const selectedIsWaiting = selectedPatient?.status === 'waiting';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">排队队列</h3>
        <p className="text-sm text-gray-500">
          等待 {waitingPatients.length} 人，输液中 {infusingPatients.length} 人
        </p>
      </div>
      {currentRole === 'nurse' && selectedPatientId && selectedIsWaiting && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold">✓</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                已选中 <span className="font-bold">{selectedPatient?.name}</span>（{selectedPatient?.queueNumber}）
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                {(selectedPatient?.isAllergyRisk && !selectedPatient?.allergyConfirmed)
                  ? '⚠️ 过敏待确认，不能安排座位，请先点击详情按钮确认过敏'
                  : '请前往右侧座位图点击绿色可用座位安排患者'
                }
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="p-4 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
        {waitingPatients.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            暂无排队患者
          </div>
        ) : (
          waitingPatients.map((patient, index) => (
            <PatientItem
              key={patient.id}
              patient={patient}
              index={index}
              isSelected={selectedPatientId === patient.id}
              onSelect={() => handleSelectPatient(patient)}
              onViewDetails={() => handleViewDetails(patient)}
              currentRole={currentRole}
            />
          ))
        )}
      </div>
    </div>
  );
}
