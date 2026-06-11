import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import RoleSwitcher from "@/components/RoleSwitcher";
import StatisticsPanel from "@/components/StatisticsPanel";
import QueueList from "@/components/QueueList";
import SeatMap from "@/components/SeatMap";
import AlertPanel from "@/components/AlertPanel";
import PatientModal from "@/components/PatientModal";
import { Stethoscope } from "lucide-react";
import { useInfusionStore } from "@/store/useInfusionStore";
import type { Patient } from "@/types";

function HomePage() {
  const currentRole = useInfusionStore((state) => state.currentRole);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const roleLabels = {
    nurse: "护士工作站",
    doctor: "医生工作站",
    patient: "患者视图",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">门诊输液排队系统</h1>
                <p className="text-xs text-slate-500">{roleLabels[currentRole]}</p>
              </div>
            </div>
            <RoleSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        <StatisticsPanel />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-1">
            <QueueList onSelectPatient={setSelectedPatient} />
          </div>

          <div className="lg:col-span-2 space-y-4">
            <SeatMap onSelectPatient={setSelectedPatient} />
            <AlertPanel onSelectPatient={setSelectedPatient} />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 mt-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          门诊输液排队系统 v1.0 · 本地数据模式 · 支持容器部署
        </div>
      </footer>

      {selectedPatient && (
        <PatientModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
}
