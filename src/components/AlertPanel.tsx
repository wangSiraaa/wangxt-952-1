import { AlertTriangle, Pill, Check, Eye, FlaskConical, Siren } from 'lucide-react';
import { useInfusionStore } from '../store/useInfusionStore';
import { useShallow } from 'zustand/react/shallow';
import { SKIN_TEST_LABELS } from '../types';
import { cn } from '../lib/utils';
import type { Patient } from '../types';

interface AlertPanelProps {
  onSelectPatient: (patient: Patient) => void;
}

interface AlertItemProps {
  patient: Patient;
  currentRole: string;
  alertType: 'observation_alert' | 'allergy' | 'skin_test_positive' | 'verifying' | 'special_med';
  onConfirmAllergy?: () => void;
  onResolveObservationAlert?: () => void;
  onViewDetail: () => void;
}

function AlertItem({ patient, currentRole, alertType, onConfirmAllergy, onResolveObservationAlert, onViewDetail }: AlertItemProps) {
  const needsAllergyConfirm = patient.isAllergyRisk && !patient.allergyConfirmed;

  const config = {
    observation_alert: {
      border: 'border-red-600',
      bg: 'bg-red-50',
      iconBg: 'bg-red-600',
      icon: <Siren size={16} className="text-white" />,
      animate: true,
    },
    allergy: {
      border: 'border-red-500',
      bg: 'bg-red-50',
      iconBg: 'bg-red-500',
      icon: <AlertTriangle size={16} className="text-white" />,
      animate: true,
    },
    skin_test_positive: {
      border: 'border-red-500',
      bg: 'bg-red-50',
      iconBg: 'bg-red-500',
      icon: <FlaskConical size={16} className="text-white" />,
      animate: false,
    },
    verifying: {
      border: 'border-cyan-500',
      bg: 'bg-cyan-50',
      iconBg: 'bg-cyan-500',
      icon: <FlaskConical size={16} className="text-white" />,
      animate: false,
    },
    special_med: {
      border: 'border-orange-500',
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-500',
      icon: <Pill size={16} className="text-white" />,
      animate: false,
    },
  };

  const c = config[alertType];

  const getAlertMessage = () => {
    switch (alertType) {
      case 'observation_alert':
        return (
          <span className="text-red-600 font-medium">
            留观异常：{patient.observationAlertNote}
          </span>
        );
      case 'allergy':
        return (
          <span className="text-red-600 font-medium">
            过敏风险：{patient.allergies.join('、')}，需人工确认
          </span>
        );
      case 'skin_test_positive':
        return (
          <span className="text-red-600 font-medium">
            皮试阳性：{SKIN_TEST_LABELS[patient.skinTestResult]}，禁止用药
          </span>
        );
      case 'verifying':
        return (
          <span className="text-cyan-600">
            药品核验{patient.drugBatchVerified ? '✓' : '待完成'} · 皮试{SKIN_TEST_LABELS[patient.skinTestResult]}
            {!patient.drugBatchVerified && '，请完成核验后进入排队'}
          </span>
        );
      case 'special_med':
        return (
          <span className="text-orange-600">
            特殊用药：{patient.medication}
          </span>
        );
    }
  };

  return (
    <div
      className={cn(
        'p-4 rounded-xl border-2 mb-3 transition-all duration-300',
        c.border,
        c.bg,
        c.animate && 'animate-breath'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', c.iconBg)}>
            {c.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{patient.name}</span>
              <span className="text-sm text-gray-500">{patient.queueNumber}</span>
            </div>
            <p className="text-sm mt-1">{getAlertMessage()}</p>
            {patient.notes && (
              <p className="text-xs text-gray-500 mt-1">备注：{patient.notes}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {currentRole === 'nurse' && needsAllergyConfirm && alertType === 'allergy' && (
            <button
              onClick={onConfirmAllergy}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check size={14} />
              确认
            </button>
          )}
          {currentRole === 'nurse' && alertType === 'observation_alert' && (
            <button
              onClick={onResolveObservationAlert}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check size={14} />
              解除
            </button>
          )}
          {currentRole !== 'patient' && (
            <button
              onClick={onViewDetail}
              className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-700 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              详情
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AlertPanel({ onSelectPatient }: AlertPanelProps) {
  const {
    currentRole,
    getAlertPatients,
    confirmAllergy,
    resolveObservationAlert,
    getPatientById,
  } = useInfusionStore(
    useShallow(state => ({
      currentRole: state.currentRole,
      getAlertPatients: state.getAlertPatients,
      confirmAllergy: state.confirmAllergy,
      resolveObservationAlert: state.resolveObservationAlert,
      getPatientById: state.getPatientById,
    }))
  );

  const alertPatients = getAlertPatients();
  const observationAlerts = alertPatients.filter(p => p.status === 'observation' && p.observationAlert);
  const allergyAlerts = alertPatients.filter(p => p.isAllergyRisk && !p.allergyConfirmed && p.status !== 'observation');
  const skinTestAlerts = alertPatients.filter(p => p.skinTestResult === 'positive');
  const verifyingAlerts = alertPatients.filter(p => p.status === 'verifying');
  const specialMedAlerts = alertPatients.filter(p => p.isSpecialMedication && p.allergyConfirmed && p.status === 'waiting');

  const handleViewDetail = (patientId: string) => {
    const patient = getPatientById(patientId);
    if (patient) {
      onSelectPatient(patient);
    }
  };

  if (currentRole === 'patient') {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border-2 border-red-500 overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-red-500" />
          <h3 className="text-lg font-semibold text-gray-800">异常提醒</h3>
          {alertPatients.length > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {alertPatients.length}
            </span>
          )}
        </div>
      </div>
      <div className="p-4 max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
        {alertPatients.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Check size={48} className="mx-auto mb-2 text-green-500 opacity-50" />
            <p>暂无异常提醒</p>
          </div>
        ) : (
          <>
            {observationAlerts.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                  <Siren size={14} />
                  留观告警 ({observationAlerts.length})
                </h4>
                {observationAlerts.map(patient => (
                  <AlertItem
                    key={patient.id}
                    patient={patient}
                    currentRole={currentRole}
                    alertType="observation_alert"
                    onResolveObservationAlert={() => resolveObservationAlert(patient.id)}
                    onViewDetail={() => handleViewDetail(patient.id)}
                  />
                ))}
              </div>
            )}
            {allergyAlerts.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                  <AlertTriangle size={14} />
                  待确认过敏 ({allergyAlerts.length})
                </h4>
                {allergyAlerts.map(patient => (
                  <AlertItem
                    key={patient.id}
                    patient={patient}
                    currentRole={currentRole}
                    alertType="allergy"
                    onConfirmAllergy={() => confirmAllergy(patient.id)}
                    onViewDetail={() => handleViewDetail(patient.id)}
                  />
                ))}
              </div>
            )}
            {skinTestAlerts.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                  <FlaskConical size={14} />
                  皮试阳性 ({skinTestAlerts.length})
                </h4>
                {skinTestAlerts.map(patient => (
                  <AlertItem
                    key={patient.id}
                    patient={patient}
                    currentRole={currentRole}
                    alertType="skin_test_positive"
                    onViewDetail={() => handleViewDetail(patient.id)}
                  />
                ))}
              </div>
            )}
            {verifyingAlerts.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-cyan-600 mb-2 flex items-center gap-1">
                  <FlaskConical size={14} />
                  核验中 ({verifyingAlerts.length})
                </h4>
                {verifyingAlerts.map(patient => (
                  <AlertItem
                    key={patient.id}
                    patient={patient}
                    currentRole={currentRole}
                    alertType="verifying"
                    onViewDetail={() => handleViewDetail(patient.id)}
                  />
                ))}
              </div>
            )}
            {specialMedAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-orange-600 mb-2 flex items-center gap-1">
                  <Pill size={14} />
                  特殊用药 ({specialMedAlerts.length})
                </h4>
                {specialMedAlerts.map(patient => (
                  <AlertItem
                    key={patient.id}
                    patient={patient}
                    currentRole={currentRole}
                    alertType="special_med"
                    onViewDetail={() => handleViewDetail(patient.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
