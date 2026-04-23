import { useState } from "preact/hooks";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { firebaseFirestore } from "../firebase";
import type { FilterType, MaintenanceReport } from "../types";


/* =========================
   PROPS
========================= */
interface Props {
  darkMode: boolean;
  activeFilter: FilterType | null;
  setActiveFilter: React.Dispatch<React.SetStateAction<FilterType>>;
  reports: MaintenanceReport[];
  getVehicleStatus: (report: MaintenanceReport) => string;
}

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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const updateField = (field: string, value: any) => {
  setSelectedMaintenance((prev: any) => ({
    ...prev,
    ...prev,
    [field]: value,
  }));
};
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
        {/* HEADER */}
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
                 onClick={() => {
                  setSelectedMaintenance(m);
                  setIsDetailModalOpen(true);
                }}
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

        {isDetailModalOpen && selectedMaintenance && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10000,
    }}
    onClick={() => setIsDetailModalOpen(false)}
  >
    <div
      style={{
        width: "90%",
        maxWidth: "900px",
        background: darkMode ? "#111827" : "#fff",
        borderRadius: "12px",
        padding: "20px",
        maxHeight: "90vh",
        overflowY: "auto",
      }}
      onClick={(e) => e.stopPropagation()}
    >

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>{selectedMaintenance.plateNumber}</h2>
        <button onClick={() => setIsDetailModalOpen(false)}>✕</button>
      </div>

      {/* BASIC INFO */}
      <div style={{ marginTop: "20px", display: "grid", gap: "8px" }}>
        <p><strong>Tracking ID:</strong> {selectedMaintenance.trackingId}</p>

       <p>
  <strong>Status:</strong>{" "}
  {isEditing ? (
    <select
      value={selectedMaintenance.status}
      onChange={(e: any) =>
        updateField("status", e.target.value)
      }
    >
      <option value="Good">Good</option>
      <option value="Defective">Defective</option>
    </select>
  ) : (
    selectedMaintenance.status || getVehicleStatus(selectedMaintenance)
  )}
</p>
        <p><strong>Category:</strong> {selectedMaintenance.category}</p>

        <p>
          <strong>Inspected By:</strong>{" "}
          {selectedMaintenance.inspectedBy || "—"}
        </p>

        <p>
          <strong>Conformed By:</strong>{" "}
          {selectedMaintenance.conformedBy || "—"}
        </p>

        <p>
  <strong>Inspector Remarks:</strong>{" "}
  {isEditing ? (
    <input
      value={selectedMaintenance.inspectorRemarks || ""}
      onInput={(e: any) =>
        updateField("inspectorRemarks", e.target.value)
      }
    />
  ) : (
    selectedMaintenance.inspectorRemarks || selectedMaintenance.remarks || "-"
  )}
</p>
      </div>

      <hr style={{ margin: "16px 0" }} />

      {/* CHECKLIST */}
      <h3>Checklist</h3>
      <div style={{ display: "grid", gap: "8px" }}>
        {selectedMaintenance.checklist?.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px",
              background: darkMode ? "#1f2937" : "#f3f4f6",
              borderRadius: "6px",
            }}
          >
            <span>{item.label}</span>
            {isEditing ? (
  <select
    value={item.status}
    onChange={(e: any) => {
      const updated = (selectedMaintenance.checklist || []).map((c, i) =>
        i === idx ? { ...c, status: e.target.value } : c
      );

      updateField("checklist", updated);
    }}
  >
    <option value="Good">Good</option>
    <option value="Defective">Defective</option>
  </select>
) : (
  <strong>{item.status}</strong>
)}
          </div>
        ))}
      </div>

      <hr style={{ margin: "16px 0" }} />

      {/* DRIVER SECTION */}
      <h3>Driver Section</h3>
      {selectedMaintenance.driverSection &&
        Object.entries(selectedMaintenance.driverSection).map(([key, value]) => (
          <p>
        <strong>{key}:</strong>{" "}
        {isEditing ? (
          <input
            value={value || ""}
            onInput={(e: any) => {
              updateField("driverSection", {
                ...selectedMaintenance.driverSection,
                [key]: e.target.value,
              });
            }}
          />
        ) : (
          value || "-"
        )}
</p>
        ))}

      <hr style={{ margin: "16px 0" }} />

      {/* SIGNATURES */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        <div>
          <p><strong>Driver Signature</strong></p>
          {selectedMaintenance.driverSignature?.startsWith("data:image") ? (
            <img
              src={selectedMaintenance.driverSignature}
              style={{ width: "100%", borderRadius: "8px", border: "1px solid #ddd" }}
            />
          ) : (
            <div style={{ padding: "20px", border: "1px dashed #ccc" }}>
              No signature
            </div>
          )}
        </div>

        <div>
          <p><strong>Mechanic Signature</strong></p>
          {selectedMaintenance.mechanicSignature?.startsWith("data:image") ? (
            <img
              src={selectedMaintenance.mechanicSignature}
              style={{ width: "100%", borderRadius: "8px", border: "1px solid #ddd" }}
            />
          ) : (
            <div style={{ padding: "20px", border: "1px dashed #ccc" }}>
              No signature
            </div>
          )}
        </div>

      </div>

      {/* FOOTER */}
       {/* ACTIONS */}
                  <div className="flex gap-3 mt-4">
                    <button
                      className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                     onClick={async () => {
                      if (!selectedMaintenance) return;

                      if (isEditing) {
                        const { id, ...data } = selectedMaintenance;

                        await updateDoc(
                          doc(firebaseFirestore, "maintenanceReports", id),
                          data
                        );

                        setIsEditing(false);
                      } else {
                        setIsEditing(true);
                      }
                    }}
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
                       setIsEditing(false);
                       setIsDetailModalOpen(false);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}