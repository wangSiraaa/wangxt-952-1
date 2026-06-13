import { useState } from 'react';
import { X, AlertTriangle, Pill, Syringe, Clock, Check, XCircle, Pause, Play, FlaskConical, Eye, Baby, ShieldAlert, Siren } from 'lucide-react';
import { useInfusionStore } from '../store/useInfusionStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '../lib/utils';
import { PATIENT_STATUS_LABELS, SKIN_TEST_LABELS, RISK_LEVEL_LABELS, INFUSION_PHASE_LABELS } from '../types';
import { formatTime, getInfusionDuration } from '../utils/formatters';
import type { Patient, SkinTestResult, RiskLevel } from '../types';

interface PatientModalProps {
  patient: Patient;
  onClose: () => void;
}

export default function PatientModal({ patient, onClose }: PatientModalProps) {
  const [alertNote, setAlertNote] = useState('');

  const {
    currentRole,
    markAllergyRisk,
    markSpecialMedication,
    setRiskLevel,
    startInfusion,
    pauseInfusion,
    resumeInfusion,
    nextBottle,
    completeInfusion,
    cancelQueue,
    canCancelQueue,
    canStartInfusion,
    confirmAllergy,
    verifyDrugBatch,
    setSkinTestResult,
    passVerification,
    triggerObservationAlert,
    resolveObservationAlert,
    completeObservation,
    setSelectedPatient,
  } = useInfusionStore(
    useShallow(state => ({
      currentRole: state.currentRole,
      markAllergyRisk: state.markAllergyRisk,
      markSpecialMedication: state.markSpecialMedication,
      setRiskLevel: state.setRiskLevel,
      startInfusion: state.startInfusion,
      pauseInfusion: state.pauseInfusion,
      resumeInfusion: state.resumeInfusion,
      nextBottle: state.nextBottle,
      completeInfusion: state.completeInfusion,
      cancelQueue: state.cancelQueue,
      canCancelQueue: state.canCancelQueue,
      canStartInfusion: state.canStartInfusion,
      confirmAllergy: state.confirmAllergy,
      verifyDrugBatch: state.verifyDrugBatch,
      setSkinTestResult: state.setSkinTestResult,
      passVerification: state.passVerification,
      triggerObservationAlert: state.triggerObservationAlert,
      resolveObservationAlert: state.resolveObservationAlert,
      completeObservation: state.completeObservation,
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

  const canPassVerification = patient.status === 'verifying' && patient.drugBatchVerified && (!patient.isAllergyRisk || patient.allergyConfirmed) && patient.skinTestResult !== 'pending';

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'verifying': return 'bg-cyan-50 text-cyan-600';
      case 'waiting': return 'bg-orange-50 text-orange-600';
      case 'infusing': return 'bg-blue-50 text-blue-600';
      case 'paused': return 'bg-yellow-50 text-yellow-600';
      case 'observation': return 'bg-purple-50 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
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
                {patient.status !== 'verifying' && patient.status !== 'waiting' && (
                  <span className="text-xs text-gray-400">
                    {INFUSION_PHASE_LABELS[patient.infusionPhase]}
                    {patient.bottleCount > 1 && ` · ${patient.currentBottle}/${patient.bottleCount}瓶`}
                  </span>
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

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
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
                  {(patient.status === 'infusing' || patient.status === 'paused') && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">已输液</span>
                      <span className="text-sm font-medium text-blue-600">
                        {getInfusionDuration(patient.infusionStartedAt)}
                      </span>
                    </div>
                  )}
                  {patient.status === 'paused' && patient.pausedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">暂停时间</span>
                      <span className="text-sm font-medium text-yellow-600">
                        {formatTime(patient.pausedAt)}
                      </span>
                    </div>
                  )}
                  {patient.status === 'observation' && patient.observationStartedAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">留观开始</span>
                      <span className="text-sm font-medium text-purple-600">
                        {formatTime(patient.observationStartedAt)}
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
                    <FlaskConical size={14} className="text-cyan-500" />
                    药品核验
                  </span>
                </h3>
                <div className="bg-cyan-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">药品批次核验</span>
                    {currentRole === 'nurse' && !patient.drugBatchVerified && (patient.status === 'verifying' || patient.status === 'waiting') ? (
                      <button
                        onClick={() => verifyDrugBatch(patient.id)}
                        className="px-3 py-1 bg-cyan-600 text-white text-xs rounded-lg hover:bg-cyan-700 transition-colors"
                      >
                        确认核验
                      </button>
                    ) : (
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs',
                        patient.drugBatchVerified ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'
                      )}>
                        {patient.drugBatchVerified ? '已核验' : '未核验'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">皮试结果</span>
                    {currentRole === 'nurse' && patient.skinTestResult === 'pending' && (patient.status === 'verifying' || patient.status === 'waiting') ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSkinTestResult(patient.id, 'negative')}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                          阴性
                        </button>
                        <button
                          onClick={() => setSkinTestResult(patient.id, 'positive')}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                        >
                          阳性
                        </button>
                      </div>
                    ) : (
                      <span className={cn(
                        'px-2 py-0.5 rounded text-xs',
                        patient.skinTestResult === 'negative' ? 'bg-green-100 text-green-600' :
                        patient.skinTestResult === 'positive' ? 'bg-red-100 text-red-600' :
                        'bg-gray-200 text-gray-500'
                      )}>
                        {SKIN_TEST_LABELS[patient.skinTestResult]}
                      </span>
                    )}
                  </div>
                  {patient.status === 'verifying' && canPassVerification && (
                    <button
                      onClick={() => passVerification(patient.id)}
                      className="w-full py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      核验通过，进入排队
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  <span className="flex items-center gap-1">
                    <Pill size={14} className="text-orange-500" />
                    用药信息
                  </span>
                </h3>
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm text-gray-800">{patient.medication}</p>
                  {patient.bottleCount > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      共 {patient.bottleCount} 瓶，当前第 {patient.currentBottle} 瓶
                    </p>
                  )}
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
                  {currentRole === 'doctor' && (patient.status === 'verifying' || patient.status === 'waiting') && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <span className="text-sm font-medium text-gray-600">风险等级</span>
                      <select
                        value={patient.riskLevel}
                        onChange={(e) => setRiskLevel(patient.id, e.target.value as RiskLevel)}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1"
                      >
                        <option value="normal">普通</option>
                        <option value="child">儿童优先</option>
                        <option value="high">高风险</option>
                        <option value="allergy_review">过敏复核</option>
                      </select>
                    </div>
                  )}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-500" />
                      <span className="text-sm">过敏风险</span>
                    </div>
                    {currentRole === 'doctor' && (patient.status === 'verifying' || patient.status === 'waiting') ? (
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
                    {currentRole === 'doctor' && (patient.status === 'verifying' || patient.status === 'waiting') ? (
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

                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <span className="text-sm">当前风险等级</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs',
                      patient.riskLevel === 'child' ? 'bg-pink-50 text-pink-600' :
                      patient.riskLevel === 'high' ? 'bg-red-50 text-red-600' :
                      patient.riskLevel === 'allergy_review' ? 'bg-amber-50 text-amber-600' :
                      'bg-gray-200 text-gray-500'
                    )}>
                      {RISK_LEVEL_LABELS[patient.riskLevel]}
                    </span>
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

              {patient.status === 'observation' && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    <span className="flex items-center gap-1">
                      <Eye size={14} className="text-purple-500" />
                      留观信息
                    </span>
                  </h3>
                  <div className={cn(
                    'rounded-xl p-4',
                    patient.observationAlert ? 'bg-red-50 border-2 border-red-500' : 'bg-purple-50'
                  )}>
                    {patient.observationAlert ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Siren size={16} className="text-red-600 animate-pulse" />
                          <span className="text-sm text-red-600 font-medium">留观异常告警</span>
                        </div>
                        <p className="text-sm text-red-600">{patient.observationAlertNote}</p>
                        {currentRole === 'nurse' && (
                          <button
                            onClick={() => resolveObservationAlert(patient.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Check size={14} />
                            解除告警
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-purple-600">留观中，开始时间：{formatTime(patient.observationStartedAt)}</p>
                        {currentRole === 'nurse' && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={alertNote}
                              onChange={(e) => setAlertNote(e.target.value)}
                              placeholder="输入异常描述..."
                              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                            />
                            <button
                              onClick={() => {
                                if (alertNote.trim()) {
                                  triggerObservationAlert(patient.id, alertNote.trim());
                                  setAlertNote('');
                                }
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <Siren size={14} />
                              触发告警
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                    <>
                      <button
                        onClick={() => pauseInfusion(patient.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                      >
                        <Pause size={16} />
                        暂停
                      </button>
                      {patient.bottleCount > patient.currentBottle && (
                        <button
                          onClick={() => nextBottle(patient.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Syringe size={16} />
                          续瓶
                        </button>
                      )}
                      <button
                        onClick={() => completeInfusion(patient.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check size={16} />
                        完成输液
                      </button>
                    </>
                  )}
                  {patient.status === 'paused' && (
                    <>
                      <button
                        onClick={() => resumeInfusion(patient.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Play size={16} />
                        恢复输液
                      </button>
                      <button
                        onClick={() => completeInfusion(patient.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check size={16} />
                        完成输液
                      </button>
                    </>
                  )}
                  {patient.status === 'observation' && !patient.observationAlert && (
                    <button
                      onClick={() => completeObservation(patient.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check size={16} />
                      结束留观
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
