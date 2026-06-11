import { User, Stethoscope, Users } from 'lucide-react';
import { useInfusionStore } from '../store/useInfusionStore';
import { ROLE_LABELS, type UserRole } from '../types';
import { cn } from '../lib/utils';

const roles: { value: UserRole; label: string; icon: typeof User }[] = [
  { value: 'nurse', label: ROLE_LABELS.nurse, icon: User },
  { value: 'doctor', label: ROLE_LABELS.doctor, icon: Stethoscope },
  { value: 'patient', label: ROLE_LABELS.patient, icon: Users },
];

export default function RoleSwitcher() {
  const currentRole = useInfusionStore(state => state.currentRole);
  const setCurrentRole = useInfusionStore(state => state.setCurrentRole);

  return (
    <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
      {roles.map(role => {
        const Icon = role.icon;
        const isActive = currentRole === role.value;
        return (
          <button
            key={role.value}
            onClick={() => setCurrentRole(role.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300',
              isActive
                ? 'bg-blue-600 text-white shadow-md scale-105'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon size={18} />
            <span>{role.label}</span>
          </button>
        );
      })}
    </div>
  );
}
