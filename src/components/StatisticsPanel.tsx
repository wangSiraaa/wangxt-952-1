import { Clock, Syringe, Armchair, Sparkles, FlaskConical, Pause, Eye, UserCheck } from 'lucide-react';
import { useInfusionStore } from '../store/useInfusionStore';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: typeof Clock;
  colorClass: string;
  bgClass: string;
  dotClass: string;
}

function StatCard({ title, value, icon: Icon, colorClass, bgClass, dotClass }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', bgClass)}>
          <Icon className={colorClass} size={24} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1">
        <div className={cn('w-2 h-2 rounded-full animate-pulse', dotClass)} />
        <span className="text-xs text-gray-400">实时更新</span>
      </div>
    </div>
  );
}

export default function StatisticsPanel() {
  const stats = useInfusionStore(
    useShallow(state => state.getStatistics())
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
      <StatCard
        title="核验中"
        value={stats.verifyingCount}
        icon={FlaskConical}
        colorClass="text-cyan-600"
        bgClass="bg-cyan-50"
        dotClass="bg-cyan-500"
      />
      <StatCard
        title="排队中"
        value={stats.waitingCount}
        icon={Clock}
        colorClass="text-orange-600"
        bgClass="bg-orange-50"
        dotClass="bg-orange-500"
      />
      <StatCard
        title="待开始"
        value={stats.seatedCount}
        icon={UserCheck}
        colorClass="text-teal-600"
        bgClass="bg-teal-50"
        dotClass="bg-teal-500"
      />
      <StatCard
        title="输液中"
        value={stats.infusingCount}
        icon={Syringe}
        colorClass="text-blue-600"
        bgClass="bg-blue-50"
        dotClass="bg-blue-500"
      />
      <StatCard
        title="已暂停"
        value={stats.pausedCount}
        icon={Pause}
        colorClass="text-yellow-600"
        bgClass="bg-yellow-50"
        dotClass="bg-yellow-500"
      />
      <StatCard
        title="留观中"
        value={stats.observationCount}
        icon={Eye}
        colorClass="text-purple-600"
        bgClass="bg-purple-50"
        dotClass="bg-purple-500"
      />
      <StatCard
        title="可用座位"
        value={stats.availableSeats}
        icon={Armchair}
        colorClass="text-green-600"
        bgClass="bg-green-50"
        dotClass="bg-green-500"
      />
      <StatCard
        title="消毒中"
        value={stats.disinfectingSeats}
        icon={Sparkles}
        colorClass="text-red-600"
        bgClass="bg-red-50"
        dotClass="bg-red-500"
      />
    </div>
  );
}
