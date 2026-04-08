import { useEffect, useMemo, useState } from "preact/hooks";
import { firebaseFirestore } from "../firebase";
import { collection, onSnapshot, query, orderBy} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import MaintenanceModal from "./MaintenanceModal";
import {Chart as ChartJS,ArcElement,Tooltip,Legend,CategoryScale,LinearScale,BarElement} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

interface AnalyticsProps {
  darkMode: boolean;
}

type FilterType =
  | null
  | "Maintenance Reports"
  | "Defective Vehicles"
  | "Needs Refuel";

 export interface MaintenanceReport {
  id: string;
  trackingId: string;
  plateNumber: string;
  category: string;
  remarks: string;
  inspectedBy: string;
  conformedBy?: string;
  evidenceUrl?: string;
  timestamp: any;
  status?: string;
  checklist?: { label: string; status: "Good" | "Defective" }[];
  inspectorRemarks?: string;
  driverSection?: {
    balanceTank?: number;
   speedReading?: number;
    driverRemarks?: string;
    [key: string]: any; 
  };
   driverSignature?: string;
    mechanicSignature?: string;
}

// 🔴 Vehicle status helper
const getVehicleStatus = (report: any): string => {
  const hasDefective = report.checklist?.some(
    (item: any) => item.status === "Defective"
  );

  if (hasDefective) return "Defective";

  return "Good";
};
const formatTime = (timeStr?: string) => {
  if (!timeStr) return "-";
  const [hour, minute] = timeStr.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${suffix}`;
};
export default function Analytics({ darkMode }: AnalyticsProps) {
  const { isAdmin } = useAuth(); // 🔹 Admin check

  // 🔹 BLOCK NON-ADMINS FROM VIEWING ENTIRE COMPONENT
  if (!isAdmin) {
    return (
      <div className={`p-6 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
        <h1 className="text-3xl font-bold">📊 Analytics Dashboard</h1>
        <p className="mt-4 text-red-500 font-semibold">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [maintenanceReports, setMaintenanceReports] = useState<MaintenanceReport[]>([]);
  const [selectedMaintenance, setSelectedMaintenance] = useState<MaintenanceReport | null>(null);
  // ✅ ADDED START - VEHICLE STATUS PIE CHART
const vehicleStatusChart = useMemo(() => {
  let good = 0;
  let defective = 0;

  maintenanceReports.forEach((r) => {
    const status = getVehicleStatus(r);
    if (status === "Good") good++;
    else defective++;
  });

  return {
    labels: ["Good", "Defective"],
    datasets: [
      {
        data: [good, defective],
        backgroundColor: ["#34D399", "#F87171"],
        borderWidth: 10 // Green for Good, Red for Defective
      },
    ],
  };
}, [maintenanceReports]);
// ✅ ADDED END


// ✅ ADDED START - VEHICLE CATEGORY BAR CHART
const vehicleCategoryChart = useMemo(() => {
  if (!maintenanceReports.length) {
  return {
    labels: [],
    datasets: [{ data: [] }],
  };
}
  const counts: Record<string, number> = {};

  maintenanceReports.forEach((r) => {
    const category = r.category || "Unknown";
    counts[category] = (counts[category] || 0) + 1;
  });

  // ✅ ADDED START - FIXED SORTED BAR CHART
const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

return {
  labels: sortedEntries.map(([key]) => key),
  datasets: [
    {
      label: "Vehicles per Category",
      data: sortedEntries.map(([, value]) => value),
      backgroundColor: "#3b82f6",
      borderRadius: 6, // ✅ para mas maganda UI
    },
  ],
};
// ✅ ADDED END
}, [maintenanceReports]);
// ✅ ADDED END

const driverChart = useMemo(() => {
  const counts: Record<string, number> = {};

  maintenanceReports.forEach((r) => {
    const driver = r.driverSection?.driverRemarks || "Unknown Driver";
    counts[driver] = (counts[driver] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return {
    labels: sorted.map(([name]) => name),
    datasets: [
      {
        label: "Driver Activity (Reports)",
        data: sorted.map(([, value]) => value),
        backgroundColor: "#f59e0b", // amber color
        borderRadius: 6,
      },
    ],
  };
}, [maintenanceReports]);

  // ---------------- DEBOUNCE SEARCH ----------------
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // ---------------- FETCH MAINTENANCE REPORTS ----------------
  useEffect(() => {
    const maintenanceColRef = collection(firebaseFirestore, "maintenanceReports");
    const q = query(
      maintenanceColRef,
      orderBy("timestamp", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports: MaintenanceReport[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MaintenanceReport, "id">),
      }));
      setMaintenanceReports(reports);
    });

    return () => unsubscribe();
  }, []);

  // ---------------- CARD CLICK ----------------
  const handleCardClick = (type: FilterType) => {
    setSelectedMaintenance(null);
    setActiveFilter(type === activeFilter ? null : type);
  };

  // ---------------- FILTERED REPORTS ----------------
  const filteredReports = useMemo(() => {
    let filtered = maintenanceReports;

    if (activeFilter === "Defective Vehicles") {
      filtered = filtered.filter(r => getVehicleStatus(r) === "Defective");
    }

    if (activeFilter === "Needs Refuel") {
      filtered = filtered.filter(r => {
        if (!r.driverSection || r.driverSection.balanceInTank === undefined) return false;

        const balance = Number(r.driverSection.balanceInTank);
        if (isNaN(balance)) return false;

        // Determine tank capacity based on vehicle type
        const plate = (r.plateNumber || "").toUpperCase();
        const isMotorcycle = plate.includes("TRYC") || plate.includes("MC") || plate.includes("MOTOR");
        
        const fullTank = isMotorcycle ? 10 : 20;           // liters
        const threshold = fullTank * 0.20;                 // 20% 

        return balance <= threshold;                       // <= 20% na lang
      });
    }

    // Search filter
    if (debouncedSearch.trim() !== "") {
      filtered = filtered.filter(r =>
        r.plateNumber.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    return filtered;
  }, [activeFilter, maintenanceReports, debouncedSearch]);

  // ---------------- RETURN UI ----------------
  return (
    <div className={`p-6 space-y-8 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
      <h1 className="text-3xl font-bold">📊 Analytics Dashboard</h1>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search plate number..."
        className="w-full p-3 rounded-xl border shadow-sm focus:ring-2 focus:ring-blue-500"
        value={searchQuery}
        onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
      />

      {/* 🔴 SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[
          { title: "Maintenance Reports", value: maintenanceReports.length },
          { title: "Defective Vehicles", value: maintenanceReports.filter(r => getVehicleStatus(r) === "Defective").length },
          { title: "Needs Refuel", value: maintenanceReports.filter(r => r.driverSection && r.driverSection.balanceInTank !== undefined && Number(r.driverSection.balanceInTank) < 0.5).length },
        ].map((card) => (
          <div
            key={card.title}
            onClick={() => handleCardClick(card.title as FilterType)}
            className={`cursor-pointer rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 ${
              activeFilter === card.title ? "ring-2 ring-blue-500" : ""
            }`}
          >
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="text-3xl font-bold text-blue-600">{card.value}</p>
          </div>
        ))}
      </div>
      {/* ✅ ADDED START - CHARTS SECTION */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  
  
<div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
  <h3 className="text-lg font-semibold mb-2">Driver Activity</h3>
  <Bar data={driverChart} />
</div>

  {/* PIE CHART */}
  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
    <h3 className="text-lg font-semibold mb-2">Vehicle Status</h3>
    <Pie data={vehicleStatusChart} />
  </div>

  {/* BAR CHART */}
  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
    <h3 className="text-lg font-semibold mb-2">Vehicle Categories</h3>
    <Bar data={vehicleCategoryChart} />
  </div>
  

</div>
{/* ✅ ADDED END */}
            <MaintenanceModal
        darkMode={darkMode}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        reports={filteredReports}              
        getVehicleStatus={getVehicleStatus}
      />
    </div>
  );
}