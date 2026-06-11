import { AlertTriangle, Pill, Check } from 'lucide-react';
import { useInfusionStore } from '../store/useInfusionStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '../lib/utils';
import type { Patient } from '../types';

interface AlertPanelProps {
  onSelectPatient: (patient: Patient) => void;
}

interface AlertItemProps {
  patient: Patient;
  currentRole: string;
  onConfirmAllergy: () => void;
  onViewDetail: () => void;
}

function AlertItem({ patient, currentRole, onConfirmAllergy, onViewDetail }: AlertItemProps) {
  const needsAllergyConfirm = patient.isAllergyRisk && !patient.allergyConfirmed;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border-2 mb-3 transition-all duration-300',
        needsAllergyConfirm
          ? 'border-red-500 bg-red-50 animate-breath'
          : 'border-orange-500 bg-orange-50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            needsAllergyConfirm ? 'bg-red-500' : 'bg-orange-500'
          )}>
            {needsAllergyConfirm ? (
              <AlertTriangle size={16} className="text-white" />
            ) : (
              <Pill size={16} className="text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{patient.name}</span>
              <span className="text-sm text-gray-500">{patient.queueNumber}</span>
            </div>
            <p className="text-sm mt-1">
              {needsAllergyConfirm ? (
                <span className="text-red-600 font-medium">
                  过敏风险：{patient.allergies.join('、')}，需人工确认
                </span>
              ) : (
                <span className="text-orange-600">
                  特殊用药：{patient.medication}
                </span>
              )}
            </p>
            {patient.notes && (
              <p className="text-xs text-gray-500 mt-1">备注：{patient.notes}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {currentRole === 'nurse' && needsAllergyConfirm && (
            <button
              onClick={onConfirmAllergy}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check size={14} />
              确认
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
    getPatientById,
  } = useInfusionStore(
    useShallow(state => ({
      currentRole: state.currentRole,
      getAlertPatients: state.getAlertPatients,
      confirmAllergy: state.confirmAllergy,
      getPatientById: state.getPatientById,
    }))
  );

  const alertPatients = getAlertPatients();
  const allergyAlerts = alertPatients.filter(p => p.isAllergyRisk && !p.allergyConfirmed);
  const specialMedAlerts = alertPatients.filter(p => p.isSpecialMedication && (p.allergyConfirmed || !p.isAllergyRisk));

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
            {allergyAlerts.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-red-600 mb-2">
                  待确认过敏 ({allergyAlerts.length})
                </h4>
                {allergyAlerts.map(patient => (
                  <AlertItem
                    key={patient.id}
                    patient={patient}
                    currentRole={currentRole}
                    onConfirmAllergy={() => confirmAllergy(patient.id)}
                    onViewDetail={() => handleViewDetail(patient.id)}
                  />
                ))}
              </div>
            )}
            {specialMedAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-orange-600 mb-2">
                  特殊用药 ({specialMedAlerts.length})
                </h4>
                {specialMedAlerts.map(patient => (
                  <AlertItem
                    key={patient.id}
                    patient={patient}
                    currentRole={currentRole}
                    onConfirmAllergy={() => {}}
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
