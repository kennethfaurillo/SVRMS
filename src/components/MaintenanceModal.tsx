import { useState } from "preact/hooks";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { firebaseFirestore } from "../firebase";
import type { FilterType, MaintenanceReport } from "../types";

/* =========================
   PROPS
========================= */
interface Props {
  darkMode: boolean;
  activeFilter: FilterType;
  setActiveFilter: React.Dispatch<React.SetStateAction<FilterType>>;
  reports: MaintenanceReport[];
  getVehicleStatus: (r: MaintenanceReport) => string;
}

/* =========================
   COMPONENT - Updated UI (similar to TripTicketModal)
========================= */
export default function MaintenanceModal({
  darkMode,
  activeFilter,
  setActiveFilter,
  reports,
  getVehicleStatus,
}: Props) {
  const [selectedMaintenance, setSelectedMaintenance] =
    useState<MaintenanceReport | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  
  const filteredReports = reports;

  if (!activeFilter) return null;

  return (
    <div 
      style={{ 
        position: "fixed", 
        inset: 0, 
        background: "rgba(0,0,0,0.6)", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        zIndex: 9999 
      }} 
      onClick={() => setActiveFilter(null)}
    >
      <div 
        style={{ 
          background: darkMode ? "#1f2937" : "#fff", 
          width: "95%", 
          maxWidth: "820px", 
          maxHeight: "92vh", 
          overflowY: "auto", 
          borderRadius: "12px", 
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER - Same style as TripTicketModal */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          padding: "20px 24px", 
          borderBottom: darkMode ? "1px solid #374151" : "1px solid #e5e7eb" 
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: "24px", 
            fontWeight: "bold", 
            color: darkMode ? "#fff" : "#111827" 
          }}>
            {activeFilter}
          </h2>
          <button
            onClick={() => setActiveFilter(null)}
            style={{ 
              fontSize: "28px", 
              color: darkMode ? "#9ca3af" : "#6b7280", 
              background: "none", 
              border: "none", 
              cursor: "pointer" 
            }}
          >
            ✕
          </button>
        </div>

        {/* CONTENT AREA */}
        <div style={{ padding: "24px" }}>

          {/* LIST OF REPORTS */}
          {filteredReports.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px 0", color: darkMode ? "#9ca3af" : "#6b7280" }}>
              No reports available.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "380px", overflowY: "auto" }}>
              {filteredReports.map((m) => (
                <div
                  key={m.id || m.plateNumber}
                  onClick={() => setSelectedMaintenance(m)}
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    background: getVehicleStatus(m) === "Defective" 
                      ? (darkMode ? "#7f1d1d" : "#fee2e2") 
                      : (darkMode ? "#374151" : "#f3f4f6"),
                    border: getVehicleStatus(m) === "Defective" 
                      ? "1px solid #ef4444" 
                      : "1px solid transparent"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontSize: "18px" }}>{m.plateNumber}</strong>
                      <p style={{ margin: "4px 0 0", color: darkMode ? "#d1d5db" : "#4b5563" }}>
                        {m.category}
                      </p>
                    </div>
                    <span style={{
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      fontSize: "14px",
                      fontWeight: "600",
                      background: getVehicleStatus(m) === "Defective" ? "#ef4444" : "#10b981",
                      color: "#fff"
                    }}>
                      {m.status || getVehicleStatus(m)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DETAILS SECTION */}
          {selectedMaintenance && (
            <div style={{ 
              marginTop: "28px", 
              padding: "24px", 
              background: darkMode ? "#111827" : "#f9fafb", 
              borderRadius: "10px",
              border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb"
            }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: "22px", color: darkMode ? "#fff" : "#111827" }}>
                {selectedMaintenance.plateNumber}
              </h3>

              {/* =========================
                  EDIT MODE
              ========================= */}
              {isEditing ? (
                <>
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

                  <select
                    className="border p-2 rounded w-full my-2"
                    value={
                      selectedMaintenance.status ||
                      getVehicleStatus(selectedMaintenance)
                    }
                    onChange={(e: Event) =>
                      setSelectedMaintenance({
                        ...selectedMaintenance,
                        status: (e.target as HTMLSelectElement).value as "Good" | "Defective",
                      })
                    }
                  >
                    <option value="Good">Good</option>
                    <option value="Defective">Defective</option>
                  </select>

                  {selectedMaintenance.checklist?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 my-1">
                      <span>{item.label}:</span>
                      <select
                        value={item.status}
                        onChange={(e: Event) => {
                          const updated = [...(selectedMaintenance.checklist || [])];
                          updated[idx].status = (e.target as HTMLSelectElement).value as "Good" | "Defective";
                          setSelectedMaintenance({
                            ...selectedMaintenance,
                            checklist: updated,
                          });
                        }}
                        className="border p-1 rounded"
                      >
                        <option value="Good">Good</option>
                        <option value="Defective">Defective</option>
                      </select>
                    </div>
                  ))}

                  {selectedMaintenance.driverSection &&
                    Object.entries(selectedMaintenance.driverSection).map(
                      ([key, value]) => (
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
                      )
                    )}

                  {/* ACTIONS */}
                  <div className="flex gap-3 mt-4">
                    <button
                      className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
                      onClick={async () => {
                        await updateDoc(
                          doc(firebaseFirestore, "maintenanceReports", selectedMaintenance.id),
                          { ...selectedMaintenance }
                        );
                        alert("Maintenance report updated!");
                        setIsEditing(false);
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
                        if (!confirm("Are you sure you want to delete this maintenance report?")) return;
                        await deleteDoc(
                          doc(firebaseFirestore, "maintenanceReports", selectedMaintenance.id)
                        );
                        setSelectedMaintenance(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                /* =========================
                    VIEW MODE
                ========================= */
                <>
                  <p>
                    <strong>Tracking ID:</strong>{" "}
                    {selectedMaintenance.trackingId}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {selectedMaintenance.status || getVehicleStatus(selectedMaintenance)}
                  </p>
                  <p>
                    <strong>Category:</strong> {selectedMaintenance.category}
                  </p>
                  <p>
                    <strong>Inspector Remarks:</strong>{" "}
                    {selectedMaintenance.inspectorRemarks || "-"}
                  </p>

                  {selectedMaintenance.checklist?.map((item, idx) => (
                    <p key={idx}>
                      <strong>{item.label}:</strong> {item.status}
                    </p>
                  ))}

                  {selectedMaintenance.driverSection &&
                    Object.entries(selectedMaintenance.driverSection).map(
                      ([key, value]) => (
                        <p key={key}>
                          <strong>{key}:</strong> {value || "-"}
                        </p>
                      )
                    )}

                  {/* ACTIONS */}
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

                    <button
                      className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                      onClick={async () => {
                        if (!confirm("Are you sure you want to delete this maintenance report?")) return;
                        await deleteDoc(
                          doc(firebaseFirestore, "maintenanceReports", selectedMaintenance.id)
                        );
                        setSelectedMaintenance(null);
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
    </div>
  );
}