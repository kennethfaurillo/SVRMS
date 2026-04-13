import { useEffect, useMemo, useState } from "preact/hooks";
import { firebaseFirestore } from "../firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

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

export default function Analytics({ darkMode }: AnalyticsProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [dateFilter, setDateFilter] = useState<"All" | "Today" | "This Month" | "Last Month">("Today");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [maintenanceReports, setMaintenanceReports] = useState<MaintenanceReport[]>([]);
  const [] = useState<MaintenanceReport | null>(null);

  // ---------------- DEBOUNCE SEARCH ----------------
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // ---------------- FETCH VEHICLES ----------------
  useEffect(() => {
    const maintenanceColRef = collection(firebaseFirestore, "maintenanceReports");
    const q = query(maintenanceColRef, orderBy("timestamp", "desc"), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports: MaintenanceReport[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MaintenanceReport, "id">),
      }));
      setMaintenanceReports(reports);
    });
    return () => unsubscribe();
  }, []);

  // ---------------- FILTERED REPORTS ----------------
  const filteredReports = useMemo(() => {
    let filtered = maintenanceReports;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    filtered = filtered.filter((r) => {
      if (!r.timestamp) return false;
      const reportDate = new Date(r.timestamp.seconds ? r.timestamp.seconds * 1000 : r.timestamp);
      reportDate.setHours(0, 0, 0, 0);

      if (dateFilter === "Today") return reportDate.getTime() === now.getTime();
      if (dateFilter === "This Month") return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
      if (dateFilter === "Last Month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return reportDate.getMonth() === lastMonth.getMonth() && reportDate.getFullYear() === lastMonth.getFullYear();
      }
      return true; // "All"
    });

    if (activeFilter === "Defective Vehicles") {
      filtered = filtered.filter(r => getVehicleStatus(r) === "Defective");
    }

    if (activeFilter === "Needs Refuel") {
      filtered = filtered.filter(
        r => r.driverSection && r.driverSection.balanceTank !== undefined && Number(r.driverSection.balanceTank) < 10
      );
    }

    if (debouncedSearch.trim() !== "") {
      filtered = filtered.filter(r =>
        r.plateNumber.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    return filtered;
  }, [activeFilter, maintenanceReports, debouncedSearch, dateFilter]);

  // ---------------- DAILY SUMMARY ----------------
  const dailySummary = useMemo(() => {
    const reportsForDate = maintenanceReports.filter((r) => {
      if (!r.timestamp) return false;
      const reportDate = new Date(r.timestamp.seconds ? r.timestamp.seconds * 1000 : r.timestamp);
      reportDate.setHours(0, 0, 0, 0);

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (dateFilter === "Today") return reportDate.getTime() === now.getTime();
      if (dateFilter === "This Month") return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
      if (dateFilter === "Last Month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return reportDate.getMonth() === lastMonth.getMonth() && reportDate.getFullYear() === lastMonth.getFullYear();
      }
      return true;
    });

    const distinctVehicles = new Set(reportsForDate.map(r => r.plateNumber));
    const defectiveVehicles = new Set(reportsForDate.filter(r => getVehicleStatus(r) === "Defective").map(r => r.plateNumber));
    const needsRefuelVehicles = new Set(reportsForDate.filter(r => r.driverSection && r.driverSection.balanceTank !== undefined && Number(r.driverSection.balanceTank) < 10).map(r => r.plateNumber));

    return {
      totalReports: reportsForDate.length,
      distinctVehicles: distinctVehicles.size,
      defectiveVehicles: defectiveVehicles.size,
      needsRefuelVehicles: needsRefuelVehicles.size,
    };
  }, [maintenanceReports, dateFilter]);

  return (
    <div className={`p-6 space-y-8 ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
      <h1 className="text-3xl font-bold">📊 Analytics Dashboard</h1>

      {/* DATE FILTER + SEARCH */}
      <div className="flex gap-2 items-center mb-4">
        <label>Date:</label>
        <select
          className="border p-2 rounded"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.currentTarget.value as any)}
        >
          <option>All</option>
          <option>Today</option>
          <option>This Month</option>
          <option>Last Month</option>
        </select>

        <input
          type="text"
          placeholder="Search plate number..."
          className="flex-1 p-2 border rounded"
          value={searchQuery}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg cursor-pointer" onClick={() => setActiveFilter("Maintenance Reports")}>
          <h2 className="text-lg font-semibold">Maintenance Reports</h2>
          <p className="text-3xl font-bold text-blue-600">{dailySummary.totalReports}</p>
          <p className="text-sm text-gray-500">Vehicles checked: {dailySummary.distinctVehicles}</p>
        </div>

        <div className="rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg cursor-pointer" onClick={() => setActiveFilter("Defective Vehicles")}>
          <h2 className="text-lg font-semibold">Defective Vehicles</h2>
          <p className="text-3xl font-bold text-red-600">{dailySummary.defectiveVehicles}</p>
        </div>

        <div className="rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg cursor-pointer" onClick={() => setActiveFilter("Needs Refuel")}>
          <h2 className="text-lg font-semibold">Needs Refuel</h2>
          <p className="text-3xl font-bold text-orange-600">{dailySummary.needsRefuelVehicles}</p>
        </div>
      </div>

      {/* MODAL */}
      {activeFilter && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50"
          onClick={() => setActiveFilter(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{activeFilter}</h2>
              <button className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" onClick={() => setActiveFilter(null)}>✖</button>
            </div>

            {filteredReports.length === 0 ? (
              <p>No reports available.</p>
            ) : (
              <ul className="space-y-2">
                {filteredReports.map((m) => {
                  const timestampStr = m.timestamp
                    ? new Date(m.timestamp.seconds ? m.timestamp.seconds * 1000 : m.timestamp).toLocaleString()
                    : "-";
                  return (
                    <li
                      key={m.id || m.plateNumber}
                      className={`p-3 rounded-lg cursor-pointer 
                        ${getVehicleStatus(m) === "Defective" ? "bg-red-100 dark:bg-red-800" : "bg-gray-100 dark:bg-gray-700"} 
                        hover:bg-gray-200 dark:hover:bg-gray-600`}
                    >
                      <p>
                        <strong>{m.plateNumber}</strong> — {m.category} — {getVehicleStatus(m)} — <span className="text-sm text-gray-500">{timestampStr}</span>
                        {activeFilter === "Needs Refuel" && m.driverSection?.balanceTank !== undefined && (
                          <span className="ml-2 text-red-500 font-bold">({m.driverSection.balanceTank} L)</span>
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}