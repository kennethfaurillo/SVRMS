import { useEffect, useMemo, useState } from "preact/hooks";
import { firebaseFirestore } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, limit } from "firebase/firestore";

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

  // ---------------- FETCH VEHICLES ----------------
  useEffect(() => {
    const maintenanceColRef = collection(firebaseFirestore, "maintenanceReports");
    const q = query(
      maintenanceColRef,
      orderBy("timestamp", "desc"),
      limit(20) // 🔴 LIMIT to reduce reads
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
          { title: "Needs Refuel", value: maintenanceReports.filter(r => r.driverSection && r.driverSection.balanceTank !== undefined && Number(r.driverSection.balanceTank) < 10).length },
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

      {/* 🔴 MODAL */}
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
              <button
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                onClick={() => setActiveFilter(null)}
              >
                ✖
              </button>
            </div>

            {/* LIST OF REPORTS */}
            {filteredReports.length === 0 ? (
              <p>No reports available.</p>
            ) : (
              <ul className="space-y-2">
                {filteredReports.map((m) => (
                  <li
                    key={m.id || m.plateNumber}
                    className={`p-3 rounded-lg cursor-pointer 
                      ${getVehicleStatus(m) === "Defective" ? "bg-red-100 dark:bg-red-800" : "bg-gray-100 dark:bg-gray-700"} 
                      hover:bg-gray-200 dark:hover:bg-gray-600`}
                    onClick={() => setSelectedMaintenance(m)}
                  >
                    <p>
                      <strong>{m.plateNumber}</strong> — {m.category} — {m.status || getVehicleStatus(m)}
                      {activeFilter === "Needs Refuel" && m.driverSection?.balanceTank !== undefined && (
                        <span className="ml-2 text-red-500 font-bold">
                          ({m.driverSection.balanceTank} L)
                        </span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {/* 🔴 DETAILED VIEW */}
            {selectedMaintenance && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
                <h3 className="font-bold text-lg">{selectedMaintenance.plateNumber}</h3>

                {isEditing ? (
                  <>
                    {/* 🔴 EDITABLE FIELDS */}
                    <input
                      type="text"
                      className="border p-2 rounded w-full my-2"
                      value={selectedMaintenance.inspectorRemarks || ""}
                      placeholder="Inspector Remarks"
                      onInput={(e: Event) =>
                        setSelectedMaintenance({
                          ...selectedMaintenance,
                          inspectorRemarks: (e.target as HTMLInputElement).value,
                        })
                      }
                    />

                    {/* 🔴 STATUS SELECT */}
                    <select
                      className="border p-2 rounded w-full my-2"
                      value={selectedMaintenance.status || getVehicleStatus(selectedMaintenance)}
                      onChange={(e: Event) =>
                        setSelectedMaintenance({ ...selectedMaintenance, status: (e.target as HTMLSelectElement).value as "Good" | "Defective" })
                      }
                    >
                      <option value="Good">Good</option>
                      <option value="Defective">Defective</option>
                    </select>

                    {/* 🔴 CHECKLIST */}
                    {selectedMaintenance.checklist?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 my-1">
                        <span>{item.label}:</span>
                        <select
                          value={item.status}
                          onChange={(e: Event) => {
                            const updatedChecklist = [...selectedMaintenance.checklist!];
                            updatedChecklist[idx].status = (e.target as HTMLSelectElement).value as "Good" | "Defective";
                            setSelectedMaintenance({ ...selectedMaintenance, checklist: updatedChecklist });
                          }}
                          className="border p-1 rounded"
                        >
                          <option value="Good">Good</option>
                          <option value="Defective">Defective</option>
                        </select>
                      </div>
                    ))}

                    {/* 🔴 DRIVER SECTION EDITABLE */}
                    {selectedMaintenance.driverSection &&
                      Object.entries(selectedMaintenance.driverSection).map(([key, value]) => (
                        <div key={key} className="my-1">
                          <label className="mr-2">{key}:</label>
                          <input
                            type="text"
                            value={value || ""}
                            onInput={(e: Event) =>
                              setSelectedMaintenance({
                                ...selectedMaintenance,
                                driverSection: {
                                  ...selectedMaintenance.driverSection,
                                  [key]: (e.target as HTMLInputElement).value,
                                },
                              })
                            }
                            className="border p-1 rounded w-1/2"
                          />
                        </div>
                      ))}

                    {/* 🔴 ACTION BUTTONS (EDIT MODE) */}
                    <div className="flex gap-3 mt-4">
                      <button
                        className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
                        onClick={async () => {
                          if (!selectedMaintenance) return;
                          try {
                            await updateDoc(doc(firebaseFirestore, "maintenanceReports", selectedMaintenance.id), {
                              ...selectedMaintenance,
                            });
                            alert("Maintenance report updated!");
                            setIsEditing(false);
                          } catch (err) {
                            console.error(err);
                            alert("Failed to update maintenance report");
                          }
                        }}
                      >
                        Save
                      </button>

                      <button
                        className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </button>

                      <button
                        className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                        onClick={async () => {
                          if (!selectedMaintenance) return;
                          if (!confirm("Are you sure you want to delete this maintenance report?")) return;
                          try {
                            await deleteDoc(doc(firebaseFirestore, "maintenanceReports", selectedMaintenance.id));
                            alert("Maintenance report deleted!");
                            setSelectedMaintenance(null);
                          } catch (err) {
                            console.error(err);
                            alert("Failed to delete maintenance report");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 🔴 VIEW MODE */}
                    <p>
                      <strong>Status:</strong> {selectedMaintenance.status || getVehicleStatus(selectedMaintenance)}
                    </p>
                    <p>
                      <strong>Category:</strong> {selectedMaintenance.category}
                    </p>
                    <p>
                      <strong>Inspector Remarks:</strong> {selectedMaintenance.inspectorRemarks || "-"}
                    </p>
                    {selectedMaintenance.checklist?.map((item, idx) => (
                      <p key={idx}>
                        <strong>{item.label}:</strong> {item.status}
                      </p>
                    ))}
                    {selectedMaintenance.driverSection &&
                      Object.entries(selectedMaintenance.driverSection).map(([key, value]) => (
                        <p key={key}>
                          <strong>{key}:</strong> {value || "-"}
                        </p>
                      ))}

                    {/* 🔴 VIEW MODE ACTIONS WITH DELETE */}
                    <div className="flex gap-3 mt-4">
                      <button
                        className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                        onClick={() => setIsEditing(true)}
                      >
                        Update
                      </button>
                      <button
                        className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
                        onClick={() => setSelectedMaintenance(null)}
                      >
                        Cancel
                      </button>
                      {/* 🔹 DELETE BUTTON ADDED IN VIEW MODE */}
                      <button
                        className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                        onClick={async () => {
                          if (!selectedMaintenance) return;
                          if (!confirm("Are you sure you want to delete this maintenance report?")) return;
                          try {
                            await deleteDoc(doc(firebaseFirestore, "maintenanceReports", selectedMaintenance.id));
                            alert("Maintenance report deleted!");
                            setSelectedMaintenance(null);
                          } catch (err) {
                            console.error(err);
                            alert("Failed to delete maintenance report");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}