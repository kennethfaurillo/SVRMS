// src/pages/MaintenanceReports.tsx
import { useEffect, useState, useMemo } from "preact/hooks";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { firebaseFirestore } from "../firebase";
import { vehicleTypes } from "../components/VehicleTypes"; // Ensure this has tankCapacity info

// -------------------
// TYPES
// -------------------
interface MaintenanceReport {
  id: string;
  plateNumber?: string;
  category?: string;
  remarks?: string;
  inspectedBy?: string;
  conformedBy?: string;
  timestamp?: any;
  checklist?: { label: string; status: "Good" | "Defective" }[];
  driverSection?: {
    gasIssued?: number;
    balanceTank?: number;  // current fuel in tank (not full capacity)
    addPurchased?: number;
    deductUsed?: number;
    endBalance?: number;   // remaining fuel
  };
}

// -------------------
// STATUS HELPERS
// -------------------
const getVehicleStatus = (report: MaintenanceReport) => {
  if (!report.checklist) return "Good";
  return report.checklist.some((i) => i.status === "Defective") ? "Defective" : "Good";
};

// Fixed Fuel Status: uses full tank capacity from vehicleTypes
const getFuelStatus = (report: MaintenanceReport) => {
  const endBalance = report.driverSection?.endBalance ?? 0;

  // Get full tank capacity from vehicle info
  const plate = report.plateNumber ?? "";
  const vehicleInfo = vehicleTypes[plate] || { tankCapacity: 0 };
  const tankCapacity = vehicleInfo.tankCapacity ?? 0;

  if (!tankCapacity) return "No Data";

  // Threshold: 20% of full tank
  const refuelThreshold = tankCapacity * 0.2;
  return endBalance <= refuelThreshold ? "Needs Refuel" : "OK";
};

// -------------------
// COMPONENT
// -------------------
export default function MaintenanceReports() {
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<MaintenanceReport | null>(null);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState<"All" | "Today" | "LastMonth">("All");

  // -------------------
  // FETCH DATA
  // -------------------
  useEffect(() => {
    const ref = collection(firebaseFirestore, "maintenanceReports");
    const q = query(ref, orderBy("timestamp", "desc"), limit(50));

    const unsub = onSnapshot(q, (snapshot) => {
      const data: MaintenanceReport[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MaintenanceReport, "id">),
      }));
      setReports(data);
    });

    return () => unsub();
  }, []);

  // -------------------
  // FILTERED DATA
  // -------------------
  const filtered = useMemo(() => {
    let data = [...reports];

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

    data = data.filter((r) => {
      if (!r.timestamp) return false;
      const ts = new Date(r.timestamp.seconds * 1000);
      if (filterDate === "Today") return ts >= startOfToday;
      if (filterDate === "LastMonth") return ts >= startOfLastMonth && ts <= endOfLastMonth;
      return true; // All
    });

    if (search.trim()) {
      data = data.filter((r) =>
        r.plateNumber?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return data;
  }, [reports, filterDate, search]);

  // -------------------
  // TABLE COLUMNS
  // -------------------
  const columns = ["Date", "Plate Number", "Category", "Vehicle Status", "Fuel Status"];

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <h1 className="text-3xl font-bold">🛠 Maintenance Reports</h1>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search plate number..."
        className="w-full p-3 rounded border"
        value={search}
        onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
      />

      {/* DATE FILTER BUTTONS */}
      <div className="flex gap-3 mb-4">
        {["All", "Today", "LastMonth"].map((f) => (
          <button
            key={f}
            onClick={() => setFilterDate(f as any)}
            className={`px-4 py-2 rounded ${
              filterDate === f ? "bg-blue-600 text-white" : "bg-gray-300"
            }`}
          >
            {f === "All" ? "All" : f === "Today" ? "Today" : "Last Month"}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded-xl shadow p-4">
        <table className="w-full text-sm border border-slate-200">
          <thead className="bg-slate-100">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 border text-left">{col}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4 text-gray-600">
                  No maintenance reports found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 border">
                    {r.timestamp ? new Date(r.timestamp.seconds * 1000).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-2 border">{r.plateNumber ?? "-"}</td>
                  <td className="px-4 py-2 border">{r.category ?? "-"}</td>

                  {/* Vehicle Status + Checklist */}
                  <td className="px-4 py-2 border flex flex-col">
                    <span className={getVehicleStatus(r) === "Defective" ? "text-red-600 font-bold" : ""}>
                      {getVehicleStatus(r)}
                    </span>
                    {r.checklist?.length ? (
                      <button
                        className="text-blue-600 underline text-sm mt-1"
                        onClick={() => setSelectedChecklist(r)}
                      >
                        View Checklist
                      </button>
                    ) : null}
                  </td>

                  {/* Fuel Status */}
                  <td className={`px-4 py-2 border ${getFuelStatus(r) === "Needs Refuel" ? "text-red-600 font-bold" : ""}`}>
                    {getFuelStatus(r)}
                    {r.driverSection?.endBalance !== undefined && (
                      <span className="text-gray-500 text-xs ml-2">({r.driverSection.endBalance} L)</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CHECKLIST MODAL */}
      {selectedChecklist && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20"
          onClick={() => setSelectedChecklist(null)}
        >
          <div
            className="bg-white p-6 rounded w-11/12 md:w-1/2 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-2">{selectedChecklist.plateNumber} - Checklist</h2>
            {selectedChecklist.checklist?.map((item, i) => (
              <p key={i}>
                {item.label}:{" "}
                <span className={item.status === "Defective" ? "text-red-600 font-bold" : "text-green-600"}>
                  {item.status}
                </span>
              </p>
            ))}
            <button
              onClick={() => setSelectedChecklist(null)}
              className="mt-4 px-4 py-2 bg-gray-400 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}