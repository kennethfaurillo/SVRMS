// src/pages/MaintenanceReports.tsx
import { useEffect, useState, useMemo } from "preact/hooks";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { firebaseFirestore } from "../firebase";
import { vehicleTypes } from "./VehicleTypes";

interface ChecklistItem {
  label: string;
  status: "Good" | "Defective";
  mandatory?: boolean;
}

interface DriverSection {
  gasIssued?: number;
  balanceTank?: number;
  addPurchased?: number;
  deductUsed?: number;
  endBalance?: number;
  fuelPrice?: number;

  speedoStart?: number;
  speedoEnd?: number;
  distanceTravelled?: number;
}

interface MaintenanceReport {
  id: string;
  plateNumber?: string;
  category?: string;
  timestamp?: number;
  checklist?: ChecklistItem[];
  driverSection?: DriverSection;
}

export default function MaintenanceReports() {
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] =
    useState<MaintenanceReport | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const ref = collection(firebaseFirestore, "maintenanceReports");
    const q = query(ref, orderBy("timestamp", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const data: MaintenanceReport[] = snap.docs.map((docSnap) => {
        const d: any = docSnap.data();

        let ts: number | undefined;
        if (d.timestamp?.seconds) ts = d.timestamp.seconds * 1000;
        else if (d.timestamp) ts = new Date(d.timestamp).getTime();

        return { id: docSnap.id, ...d, timestamp: ts };
      });

      setReports(data);
    });

    return () => unsub();
  }, []);

  const handleDeleteReport = async (id: string) => {
    const ok = confirm("Delete this report?");
    if (!ok) return;

    try {
      await deleteDoc(doc(firebaseFirestore, "maintenanceReports", id));
      setSelectedReport(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete report");
    }
  };

  // 🔥 GET LATEST REPORT PER VEHICLE (GLOBAL FIX)
  const vehicles = useMemo(() => {
    return Object.entries(vehicleTypes).map(([plate, info]) => {
      const vehicleReports = reports.filter(
        (r) => r.plateNumber === plate
      );

      const lastReport = vehicleReports.sort(
        (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)
      )[0];

      return {
        plate,
        category: info.category || "Unknown",
        description: info.description || "",
        image: info.image || "",
        lastReport,
      };
    });
  }, [reports]);

  const filteredVehicles = vehicles.filter((v) =>
    v.plate.toLowerCase().includes(search.toLowerCase())
  );

  const automotiveVehicles = filteredVehicles.filter(
    (v) => v.category === "Automotive"
  );

  const motorcycleVehicles = filteredVehicles.filter(
    (v) => v.category === "Motorcycle"
  );

  const getVehicleStatus = (report?: MaintenanceReport) => {
    if (!report?.checklist) return "Good";
    const critical = report.checklist.filter((i) => i.mandatory);
    return critical.some((i) => i.status === "Defective")
      ? "Defective"
      : "Good";
  };

  const getFuelStatus = (report?: MaintenanceReport) => {
    if (!report) return "No Data";

    const balanceTank =
      report.driverSection?.balanceTank ??
      report.driverSection?.endBalance ??
      0;

    const plate = report.plateNumber ?? "";
    const vehicleInfo = vehicleTypes[plate] || { tankCapacity: 0 };
    const tankCapacity = vehicleInfo.tankCapacity ?? 0;

    if (!tankCapacity) return "No Data";

    const fuelQuantity = tankCapacity - balanceTank;
    const isNeedRefuel = balanceTank <= tankCapacity * 0.2;

    return isNeedRefuel
      ? `Needs Refuel|${balanceTank}|${fuelQuantity}`
      : `OK|${balanceTank}|${fuelQuantity}`;
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-6">
      <h1 className="text-3xl font-bold">Vehicle Maintenance Dashboard</h1>

      <input
        type="text"
        placeholder="Search vehicle plate..."
        className="w-full p-3 rounded border"
        value={search}
        onInput={(e) =>
          setSearch((e.target as HTMLInputElement).value)
        }
      />

      <div className="flex flex-col md:flex-row gap-6 mt-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">Automotive</h2>
          <div className="flex flex-wrap gap-4">
            {automotiveVehicles.length ? (
              automotiveVehicles.map((v) => (
                <VehicleCard
                  key={v.plate}
                  vehicle={v}
                  onClick={() => setSelectedVehicle(v.plate)}
                  getVehicleStatus={getVehicleStatus}
                  getFuelStatus={getFuelStatus}
                />
              ))
            ) : (
              <p className="text-gray-500">No vehicles found.</p>
            )}
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-4">
            Motorcycle / Trimobile
          </h2>
          <div className="flex flex-wrap gap-4">
            {motorcycleVehicles.length ? (
              motorcycleVehicles.map((v) => (
                <VehicleCard
                  key={v.plate}
                  vehicle={v}
                  onClick={() => setSelectedVehicle(v.plate)}
                  getVehicleStatus={getVehicleStatus}
                  getFuelStatus={getFuelStatus}
                />
              ))
            ) : (
              <p className="text-gray-500">No vehicles found.</p>
            )}
          </div>
        </div>
      </div>

      {selectedVehicle && (
        <VehicleReportsModal
          vehicle={selectedVehicle}
          reports={reports
            .filter((r) => r.plateNumber === selectedVehicle)
            .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))}
          onClose={() => setSelectedVehicle(null)}
          onViewChecklist={(r: any) => setSelectedReport(r)}
          getVehicleStatus={getVehicleStatus}
          getFuelStatus={getFuelStatus}
        />
      )}

      {selectedReport && (
        <ChecklistModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onDelete={handleDeleteReport}
        />
      )}
    </div>
  );
}

/* ================= VEHICLE CARD ================= */

function VehicleCard({
  vehicle,
  onClick,
  getVehicleStatus,
  getFuelStatus,
}: any) {
  const fuelData = vehicle.lastReport
    ? getFuelStatus(vehicle.lastReport).split("|")
    : null;

  const fuelStatus = fuelData?.[0];
  const balance = fuelData?.[1];
  const fuelQty = fuelData?.[2];

  return (
    <div
      className="w-60 bg-white shadow-lg rounded-xl p-3 cursor-pointer hover:shadow-xl"
      onClick={onClick}
    >
      {vehicle.image ? (
        <img
          src={vehicle.image}
          className="w-full h-36 object-cover rounded-md mb-2"
        />
      ) : (
        <div className="w-full h-36 bg-gray-200 flex items-center justify-center rounded-md mb-2">
          No Image
        </div>
      )}

      <h3 className="font-bold text-lg">{vehicle.plate}</h3>
      <p className="text-sm text-gray-600">{vehicle.description}</p>

      <p className="mt-2">
        Status:{" "}
        <span
          className={
            vehicle.lastReport &&
            getVehicleStatus(vehicle.lastReport) === "Defective"
              ? "text-red-600 font-bold"
              : "text-green-600"
          }
        >
          {vehicle.lastReport
            ? getVehicleStatus(vehicle.lastReport)
            : "No Data"}
        </span>
      </p>

      <p>
        Fuel:{" "}
        <span className="text-blue-600">
          {balance != null ? `${balance}L` : "No Data"}
        </span>
      </p>

      {fuelStatus === "Needs Refuel" && (
        <p className="text-red-600 text-sm font-bold">
          Needs Refuel - {fuelQty != null ? `${fuelQty}L` : "0L"}
        </p>
      )}
    </div>
  );
}

/* ================= VEHICLE REPORTS MODAL ================= */

function VehicleReportsModal({
  vehicle,
  reports,
  onClose,
  onViewChecklist,
  getVehicleStatus,
  getFuelStatus,
}: any) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-start pt-20 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">{vehicle} - Reports</h2>

        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Fuel</th>
              <th>Checklist</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((r: any) => {
              const fuel = getFuelStatus(r).split("|");

              return (
                <tr key={r.id}>
                  <td className="border p-2">
                    {r.timestamp
                      ? new Date(r.timestamp).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="border p-2">
                    {getVehicleStatus(r)}
                  </td>

                  <td className="border p-2">{fuel[1]}</td>

                  <td className="border p-2">
                    <button
                      className="text-blue-600 underline"
                      onClick={() => onViewChecklist(r)}
                    >
                      View Checklist
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ================= CHECKLIST MODAL ================= */

function ChecklistModal({ report, onClose, onDelete }: any) {
  const fuel = report.driverSection;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-start pt-20 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded w-11/12 md:w-2/3 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-xl font-bold">
            {report.plateNumber} - Maintenance Report
          </h2>
        </div>

        <h3 className="font-bold text-lg mb-2">A. Checklist</h3>

        {report.checklist?.length ? (
          <div className="space-y-1 text-sm mb-6">
            {report.checklist.map((item: any, i: number) => (
              <p key={i}>
                {item.label} -{" "}
                <span className="font-bold">{item.status}</span>
              </p>
            ))}
          </div>
        ) : (
          <p className="mb-6">No checklist data found.</p>
        )}

        <h3 className="font-bold text-lg mb-2">B. Fuel Reports</h3>
{fuel ? (
  <div className="space-y-1 text-sm pb-6 border-b">
    <p>
      Balance in Tank:{" "}
      <span className="font-bold">
        {fuel.balanceTank ?? 0} L
      </span>
    </p>

    <p>
      Odometer Reading:{" "}
      <span className="font-bold">
        {fuel.odometerReading ?? 0} km
      </span>
    </p>
  </div>
) : (
  <p className="pb-6 border-b">No fuel data found.</p>
)}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Close
          </button>

          <button
            onClick={() => onDelete(report.id)}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}