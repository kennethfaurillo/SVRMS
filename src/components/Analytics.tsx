import { useEffect, useMemo, useState } from "preact/hooks";
import { firebaseFirestore } from "../firebase";
import { collection, onSnapshot, query, orderBy} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import MaintenanceModal from "./MaintenanceModal";
import {Chart as ChartJS,ArcElement,Tooltip,Legend,CategoryScale,LinearScale,BarElement} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import useTrips from "../hooks/useTrips";


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
  const { trips } = useTrips();

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
  //  VEHICLE STATUS PIE CHART
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

// VEHICLE CATEGORY BAR CHART
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

  //  BAR CHART
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

}, [maintenanceReports]);


const driverChart = useMemo(() => {
  const counts: Record<string, number> = {};

  
  maintenanceReports.forEach((r) => {
    let driverName = "Unknown Driver";

    if (r.inspectedBy && r.inspectedBy.trim() !== "") {
      driverName = r.inspectedBy.trim();
    } else if (r.driverSection?.driverRemarks && r.driverSection.driverRemarks.trim() !== "") {
      driverName = r.driverSection.driverRemarks.trim();
    }

    counts[driverName] = (counts[driverName] || 0) + 1;
  });

 
  trips.forEach((trip) => {
    if (trip.driverName && trip.driverName.trim() !== "") {
      const driverName = trip.driverName.trim();
      counts[driverName] = (counts[driverName] || 0) + 1;
    }
  });

  
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10); // top 10 lang para hindi masyadong mataas

  return {
    labels: sorted.map(([name]) => name),
    datasets: [
      {
        label: "Driver Activity (Reports)",
        data: sorted.map(([, value]) => value),
        backgroundColor: "#f59e0b",
        borderColor: "#d97706",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };
}, [maintenanceReports, trips]);

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
        
        const fullTank = isMotorcycle ? 10 : 20;           
        const threshold = fullTank * 0.20;                 

        return balance <= threshold;                       
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
  <div className={`min-h-screen p-6 space-y-8 transition-colors duration-200 
    ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
      <h1 className="text-3xl font-bold">📊 Analytics Dashboard</h1>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search plate number..."
        className={`w-full p-3 rounded-xl border shadow-sm focus:ring-2 focus:ring-blue-500 transition-colors
        ${darkMode 
          ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400" 
          : "bg-white border-gray-300 text-gray-900"
        }`}
        value={searchQuery}
        onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
      />

      {/* 🔴 SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[
          { title: "Maintenance Reports", value: maintenanceReports.length },
          { title: "Defective Vehicles", value: maintenanceReports.filter(r => getVehicleStatus(r) === "Defective").length },
         {
          title: "Needs Refuel",
          value: maintenanceReports.filter((r) => {
            const balance = Number(
              r.driverSection?.balanceInTank
            );

            if (isNaN(balance)) return false;

            const plate = (r.plateNumber || "").toUpperCase();

            const isMotorcycle =
              plate.includes("TRYC") ||
              plate.includes("MC") ||
              plate.includes("MOTOR");

            const fullTank = isMotorcycle ? 10 : 20;

            return balance <= fullTank * 0.2;
          }).length,
        },
        ].map((card) => (
          <div
            key={card.title}
            onClick={() => handleCardClick(card.title as FilterType)}
           className={`cursor-pointer rounded-2xl p-6 shadow-lg hover:shadow-xl transition transform hover:-translate-y-1
            ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}
            ${activeFilter === card.title ? "ring-2 ring-blue-500" : ""}`}
          >
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="text-3xl font-bold text-blue-600">{card.value}</p>
          </div>
        ))}
      </div>
      {/* CHARTS SECTION */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  
  
{/* DRIVER ACTIVITY CARD */}
<div className={`p-6 rounded-3xl shadow-lg transition-colors
  ${darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"}`}>
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold flex items-center gap-2">
      👨‍🔧 Driver Activity
      <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-full">
        Reports
      </span>
    </h3>
  </div>
  
  {driverChart.labels && driverChart.labels.length > 0 ? (
    <div style={{ height: "320px" }}>
      <Bar 
        data={driverChart} 
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: darkMode ? '#374151' : '#e5e7eb' },
              ticks: { color: darkMode ? '#9ca3af' : '#6b7280' }
            },
            x: {
              grid: { display: false },
              ticks: { 
                color: darkMode ? '#9ca3af' : '#6b7280',
                maxRotation: 45
              }
            }
          }
        }}
      />
    </div>
  ) : (
    <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
      No driver activity data yet
    </div>
  )}
</div>

  {/* PIE CHART */}
 <div className={`p-4 rounded-2xl shadow transition-colors
  ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
    <h3 className="text-lg font-semibold mb-2">Vehicle Status</h3>
    <Pie 
  data={vehicleStatusChart}
  options={{
    plugins: {
      legend: {
        labels: {
          color: darkMode ? "#fff" : "#000"
        }
      }
    }
  }}
/>
  </div>

  {/* BAR CHART */}
  <div className={`p-4 rounded-2xl shadow transition-colors
  ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
    <h3 className="text-lg font-semibold mb-2">Vehicle Categories</h3>
   <Bar 
  data={vehicleCategoryChart}
  options={{
    plugins: {
      legend: {
        labels: {
          color: darkMode ? "#fff" : "#000"
        }
      }
    },
    scales: {
      x: {
        ticks: { color: darkMode ? "#fff" : "#000" }
      },
      y: {
        ticks: { color: darkMode ? "#fff" : "#000" }
      }
    }
  }}
/>
  </div>
  

</div>

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