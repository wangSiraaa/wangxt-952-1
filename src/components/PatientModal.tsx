import { X, AlertTriangle, Pill, Syringe, Clock, Check, XCircle } from 'lucide-react';
import { useInfusionStore } from '../store/useInfusionStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '../lib/utils';
import { PATIENT_STATUS_LABELS } from '../types';
import { formatTime, getInfusionDuration } from '../utils/formatters';
import type { Patient } from '../types';

interface PatientModalProps {
  patient: Patient;
  onClose: () => void;
}

export default function PatientModal({ patient, onClose }: PatientModalProps) {
  const {
    currentRole,
    markAllergyRisk,
    markSpecialMedication,
    startInfusion,
    completeInfusion,
    cancelQueue,
    canCancelQueue,
    canStartInfusion,
    confirmAllergy,
    setSelectedPatient,
  } = useInfusionStore(
    useShallow(state => ({
      currentRole: state.currentRole,
      markAllergyRisk: state.markAllergyRisk,
      markSpecialMedication: state.markSpecialMedication,
      startInfusion: state.startInfusion,
      completeInfusion: state.completeInfusion,
      cancelQueue: state.cancelQueue,
      canCancelQueue: state.canCancelQueue,
      canStartInfusion: state.canStartInfusion,
      confirmAllergy: state.confirmAllergy,
      setSelectedPatient: state.setSelectedPatient,
    }))
  );

  const needsAllergyConfirm = patient.isAllergyRisk && !patient.allergyConfirmed;
  const canCancel = canCancelQueue(patient.id);
  const canStart = canStartInfusion(patient.id);

  const handleClose = () => {
    setSelectedPatient(null);
    onClose();
  };

  const handleCancelQueue = () => {
    cancelQueue(patient.id);
    handleClose();
  };

  const handleStartInfusion = () => {
    startInfusion(patient.id);
    handleClose();
  };

  const handleCompleteInfusion = () => {
    completeInfusion(patient.id);
    handleClose();
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-orange-50 text-orange-600';
      case 'infusing':
        return 'bg-blue-50 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-800">{patient.name}</h2>
                <span className="text-sm text-gray-500">{patient.age}岁{patient.gender}</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full font-medium">
                  {patient.queueNumber}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  getStatusStyle(patient.status)
                )}>
                  {PATIENT_STATUS_LABELS[patient.status]}
                </span>
                {patient.seatId && (
                  <span className="text-sm text-gray-500">座位：{patient.seatId}</span>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">基本信息</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">排队号</span>
                    <span className="text-sm font-medium">{patient.queueNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">年龄性别</span>
                    <span className="text-sm font-medium">{patient.age}岁{patient.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">分配时间</span>
                    <span className="text-sm font-medium">{formatTime(patient.assignedAt)}</span>
                  </div>
                  {patient.status === 'infusing' && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">已输液</span>
                      <span className="text-sm font-medium text-blue-600">
                        {getInfusionDuration(patient.infusionStartedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-1">
                    <AlertTriangle size={14} className="text-red-500" />
                    过敏史
                  </span>
                </h3>
                <div className={cn(
                  'rounded-xl p-4',
                  patient.allergies.length > 0 ? 'bg-red-50' : 'bg-gray-50'
                )}>
                  {patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded-full"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">无过敏史</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-1">
                    <Pill size={14} className="text-orange-500" />
                    用药信息
                  </span>
                </h3>
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm text-gray-800">{patient.medication}</p>
                </div>
              </div>

              {patient.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">医生备注</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700">{patient.notes}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">风险标记</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-500" />
                      <span className="text-sm">过敏风险</span>
                    </div>
                    {currentRole === 'doctor' && patient.status === 'waiting' ? (
                      <button
                        onClick={() => markAllergyRisk(patient.id, !patient.isAllergyRisk)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                          patient.isAllergyRisk
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        )}
                      >
                        {patient.isAllergyRisk ? '已标记' : '未标记'}
                      </button>
                    ) : (
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs',
                        patient.isAllergyRisk ? 'bg-red-50 text-red-600' : 'bg-gray-200 text-gray-500'
                      )}>
                        {patient.isAllergyRisk ? '是' : '否'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Pill size={16} className="text-orange-500" />
                      <span className="text-sm">特殊用药</span>
                    </div>
                    {currentRole === 'doctor' && patient.status === 'waiting' ? (
                      <button
                        onClick={() => markSpecialMedication(patient.id, !patient.isSpecialMedication)}
                        className={cn(
                          'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                          patient.isSpecialMedication
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        )}
                      >
                        {patient.isSpecialMedication ? '已标记' : '未标记'}
                      </button>
                    ) : (
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs',
                        patient.isSpecialMedication ? 'bg-orange-50 text-orange-600' : 'bg-gray-200 text-gray-500'
                      )}>
                        {patient.isSpecialMedication ? '是' : '否'}
                      </span>
                    )}
                  </div>

                  {needsAllergyConfirm && currentRole === 'nurse' && (
                    <div className="bg-red-50 rounded-xl p-3 border-2 border-dashed border-red-500 animate-breath">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={16} className="text-red-500 animate-pulse" />
                          <span className="text-sm text-red-600 font-medium">需人工确认过敏</span>
                        </div>
                        <button
                          onClick={() => confirmAllergy(patient.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Check size={14} />
                          确认
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock size={16} />
              <span>预计等待：{patient.estimatedWaitTime}分钟</span>
            </div>
            <div className="flex flex-wrap gap-3 justify-end">
              {currentRole === 'nurse' && (
                <>
                  {canCancel && (
                    <button
                      onClick={handleCancelQueue}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <XCircle size={16} />
                      取消排队
                    </button>
                  )}
                  {canStart && (
                    <button
                      onClick={handleStartInfusion}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Syringe size={16} />
                      开始输液
                    </button>
                  )}
                  {patient.status === 'infusing' && (
                    <button
                      onClick={handleCompleteInfusion}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check size={16} />
                      完成输液
                    </button>
                  )}
                </>
              )}
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
