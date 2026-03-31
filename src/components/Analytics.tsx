import { useEffect, useMemo, useState } from "preact/hooks";
import { firebaseFirestore } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import MaintenanceModal from "./MaintenanceModal";

interface AnalyticsProps {
  darkMode: boolean;
}

type FilterType =
  | null
  | "Maintenance Reports"
  | "Defective Vehicles"
  | "Needs Refuel";

interface MaintenanceReport {
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
    departureTime?: string;
    arrivalTime?: string;
    gasIssued?: string;
    balanceTank?: string;
    addPurchased?: string;
    deductUsed?: string;
    endBalance?: string;
    speedoStart?: string;
    speedoEnd?: string;
    driverRemarks?: string;
  };
}

// 🔴 Vehicle status helper
const getVehicleStatus = (report: MaintenanceReport) => {
  if (!report.checklist || report.checklist.length === 0) return "Good";
  const hasDefective = report.checklist.some(item => item.status.toLowerCase() === "defective");
  return hasDefective ? "Defective" : "Good";
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
  const [isEditing, setIsEditing] = useState(false);

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
        if (!r.driverSection || r.driverSection.balanceTank === undefined) return false;

        const balance = Number(r.driverSection.balanceTank);
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
          { title: "Needs Refuel", value: maintenanceReports.filter(r => r.driverSection && r.driverSection.balanceTank !== undefined && Number(r.driverSection.balanceTank) < 0.5).length },
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