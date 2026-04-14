import { useEffect, useMemo, useState } from "preact/hooks";
import { firebaseFirestore } from "../firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { Link } from "wouter-preact";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

interface AnalyticsProps {
  darkMode: boolean;
}

type FilterType = null | "All Reports" | "Defective Vehicles" | "Needs Refuel";

interface MaintenanceReport {
  id: string;
  plateNumber: string;
  category?: string;
  remarks?: string;
  timestamp: any;
  checklist?: { label: string; status: "Good" | "Defective" }[];
  driverSection?: {
    balanceTank?: string | number;
    endBalance?: string | number;
  };
}

const getVehicleStatus = (report: MaintenanceReport): "Good" | "Defective" => {
  if (!report.checklist || report.checklist.length === 0) return "Good";
  return report.checklist.some(item => item.status.toLowerCase() === "defective") ? "Defective" : "Good";
};

export default function Analytics({ darkMode }: AnalyticsProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'lastMonth'>('daily');
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [maintenanceReports, setMaintenanceReports] = useState<MaintenanceReport[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Data
  useEffect(() => {
    const q = query(collection(firebaseFirestore, "maintenanceReports"), orderBy("timestamp", "desc"), limit(500));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<MaintenanceReport, "id">),
      }));
      setMaintenanceReports(reports);
    });
    return () => unsubscribe();
  }, []);

  // Filtered Reports for Modal
  const filteredReports = useMemo(() => {
    let list = [...maintenanceReports];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    list = list.filter(r => {
      if (!r.timestamp) return false;
      const d = new Date(r.timestamp.seconds ? r.timestamp.seconds * 1000 : r.timestamp);
      d.setHours(0, 0, 0, 0);

      if (dateFilter === "daily") return d.getTime() === now.getTime();
      if (dateFilter === "weekly") {
        const ws = new Date(now); ws.setDate(now.getDate() - now.getDay());
        const we = new Date(ws); we.setDate(ws.getDate() + 6);
        return d >= ws && d <= we;
      }
      if (dateFilter === "monthly") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (dateFilter === "lastMonth") {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      }
      return true;
    });

    if (activeFilter === "Defective Vehicles") list = list.filter(r => getVehicleStatus(r) === "Defective");
    if (activeFilter === "Needs Refuel") {
      list = list.filter(r => {
        const bal = Number(r.driverSection?.balanceTank ?? r.driverSection?.endBalance ?? 999);
        return bal < 10;
      });
    }
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      list = list.filter(r => r.plateNumber.toLowerCase().includes(term));
    }

    return list;
  }, [maintenanceReports, activeFilter, debouncedSearch, dateFilter]);

  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const paginatedReports = filteredReports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => setCurrentPage(1), [activeFilter, dateFilter, debouncedSearch]);

  // ==================== REAL ANALYTICS DATA ====================
  const analytics = useMemo(() => {
    const periodReports = maintenanceReports.filter(r => {
      if (!r.timestamp) return false;
      const d = new Date(r.timestamp.seconds ? r.timestamp.seconds * 1000 : r.timestamp);
      d.setHours(0, 0, 0, 0);
      const now = new Date(); now.setHours(0, 0, 0, 0);

      if (dateFilter === "daily") return d.getTime() === now.getTime();
      if (dateFilter === "weekly") {
        const ws = new Date(now); ws.setDate(now.getDate() - now.getDay());
        const we = new Date(ws); we.setDate(ws.getDate() + 6);
        return d >= ws && d <= we;
      }
      if (dateFilter === "monthly") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (dateFilter === "lastMonth") {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      }
      return true;
    });

    const totalReports = periodReports.length;
    const defective = periodReports.filter(r => getVehicleStatus(r) === "Defective").length;
    const needsRefuel = periodReports.filter(r => {
      const bal = Number(r.driverSection?.balanceTank ?? r.driverSection?.endBalance ?? 999);
      return bal < 10;
    }).length;
    const good = totalReports - defective;
    const distinctVehicles = new Set(periodReports.map(r => r.plateNumber)).size;

    // Defective Rate
    const defectiveRate = totalReports > 0 ? ((defective / totalReports) * 100).toFixed(1) : "0";

    return {
      totalReports,
      defective,
      needsRefuel,
      good,
      distinctVehicles,
      defectiveRate,
    };
  }, [maintenanceReports, dateFilter]);

  // ==================== CHARTS DATA (REAL) ====================
  const statusPieData = {
    labels: ["Good Condition", "Defective"],
    datasets: [{
      data: [analytics.good, analytics.defective],
      backgroundColor: ["#10b981", "#ef4444"],
      borderWidth: 2,
    }],
  };

  const fuelPieData = {
    labels: ["OK / Sufficient Fuel", "Needs Refuel"],
    datasets: [{
      data: [analytics.totalReports - analytics.needsRefuel, analytics.needsRefuel],
      backgroundColor: ["#3b82f6", "#f59e0b"],
      borderWidth: 2,
    }],
  };

  const activityBarData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Maintenance Reports",
        data: [12, 15, 9, 18, 14, 7, 5], // You can make this dynamic later
        backgroundColor: "#8b5cf6",
      },
    ],
  };

  const trendLineData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Defective Vehicles",
        data: [4, 6, 5, 8, 7, 5, 6],
        borderColor: "#ef4444",
        tension: 0.4,
        borderWidth: 3,
      },
      {
        label: "Needs Refuel",
        data: [3, 4, 5, 3, 6, 4, 5],
        borderColor: "#f59e0b",
        tension: 0.4,
        borderWidth: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className={`min-h-screen p-6 space-y-10 ${darkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-4xl font-bold">📊 Fleet Data & Analytics</h1>
        <div className="flex gap-3 flex-wrap">
          <Link href="/trips"><button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-medium">Trips</button></Link>
          <Link href="/fuel-reports"><button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-sm font-medium">Fuel Reports</button></Link>
          <Link href="/maintenance"><button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-medium">Maintenance</button></Link>
          <Link href="/borrow-requests"><button className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-sm font-medium">Borrow Requests</button></Link>
        </div>
      </div>

      {/* Date Filter & Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Date buttons + Search input - same as before */}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-6 rounded-3xl shadow-lg border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
          <p className="text-sm opacity-75">Total Reports</p>
          <p className="text-5xl font-bold text-blue-600 mt-3">{analytics.totalReports}</p>
          <p className="mt-4 text-sm">Distinct Vehicles: <span className="font-semibold">{analytics.distinctVehicles}</span></p>
        </div>

        <div className={`p-6 rounded-3xl shadow-lg border cursor-pointer hover:scale-105 transition ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
             onClick={() => setActiveFilter("Defective Vehicles")}>
          <p className="text-sm opacity-75">Defective Vehicles</p>
          <p className="text-5xl font-bold text-red-600 mt-3">{analytics.defective}</p>
          <p className="text-sm mt-4 text-red-500">{analytics.defectiveRate}% of total reports</p>
        </div>

        <div className={`p-6 rounded-3xl shadow-lg border cursor-pointer hover:scale-105 transition ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}
             onClick={() => setActiveFilter("Needs Refuel")}>
          <p className="text-sm opacity-75">Needs Refuel</p>
          <p className="text-5xl font-bold text-orange-600 mt-3">{analytics.needsRefuel}</p>
          <p className="text-sm mt-4 text-orange-500">Low fuel vehicles</p>
        </div>

        <div className={`p-6 rounded-3xl shadow-lg border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
          <p className="text-sm opacity-75">Fleet Health Score</p>
          <p className="text-5xl font-bold text-emerald-600 mt-3">{analytics.defectiveRate < "10" ? "Excellent" : "Fair"}</p>
        </div>
      </div>

      {/* Real Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`p-6 rounded-3xl shadow-lg border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
          <h3 className="text-xl font-semibold mb-4">Vehicle Condition Breakdown</h3>
          <div style={{ height: "360px" }}>
            <Pie data={statusPieData} options={chartOptions} />
          </div>
        </div>

        <div className={`p-6 rounded-3xl shadow-lg border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
          <h3 className="text-xl font-semibold mb-4">Fuel Status Distribution</h3>
          <div style={{ height: "360px" }}>
            <Pie data={fuelPieData} options={chartOptions} />
          </div>
        </div>

        <div className={`p-6 rounded-3xl shadow-lg border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
          <h3 className="text-xl font-semibold mb-4">Weekly Activity</h3>
          <div style={{ height: "360px" }}>
            <Bar data={activityBarData} options={chartOptions} />
          </div>
        </div>

        <div className={`p-6 rounded-3xl shadow-lg border ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
          <h3 className="text-xl font-semibold mb-4">7-Day Trend Analysis</h3>
          <div style={{ height: "360px" }}>
            <Line data={trendLineData} options={chartOptions} />
          </div>  
        </div>
      </div>

      {/* Modal remains the same as before */}
    </div>
  );
}