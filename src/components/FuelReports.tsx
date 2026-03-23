// src/pages/FuelReports.tsx
import { Link } from "wouter-preact";
import { useState, useEffect } from "preact/hooks";
import { collection, onSnapshot, query } from "firebase/firestore";
import { firebaseFirestore } from "../firebase";
import { vehicleTypes } from "../components/VehicleTypes";

// -------------------
// Trip Interface
// -------------------
export interface Trip {
  id: string;
  fuelSlipDate?: string;
  tripTicketNo?: string;
  plateNumber?: string;
  description?: string;
  fuelType?: string;
  driver?: string;
  passengers?: string[]; // <-- passengers as array
  purpose?: string;
  fuelPrice?: number;
  fuelQuantity?: number;
  totalAmount?: number;
  status?: string;
}

// -------------------
// Fixed Table Categories
// -------------------
const categories: (keyof Trip)[] = [
  "fuelSlipDate",
  "tripTicketNo",
  "plateNumber",
  "description",
  "fuelType",
  "driver",
  "passengers",
  "purpose",
  "fuelPrice",
  "fuelQuantity",
  "totalAmount",
  "status",
];

// -------------------
// Convert camelCase to readable header
// -------------------
function formatHeader(text: string) {
  return text
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

// -------------------
// FuelReports Component
// -------------------
export default function FuelReports() {
  const { trips, maintenanceReports, loading, error } = useTrips();
  const [searchTerm, setSearchTerm] = useState("");

  // -------------------
  // Merge maintenance data into trips
  // -------------------
  const mergedTrips = trips.map((trip) => {
    const plate = trip.plateNumber ?? "";
    const vehicleInfo =
      vehicleTypes[plate] || {
        description: "",
        fuelType: "Unleaded",
        tankCapacity: 0,
      };

    // Find corresponding maintenance report
    const maintenance = maintenanceReports.find((m) => m.plateNumber === plate);
    const driverSection = maintenance?.driverSection || {};

    // Compute fuel quantity consumed
    const fuelQuantity = Number(driverSection.deductUsed) || 0;

    // Use driver-entered fuel price
    const fuelPrice = Number(driverSection.fuelPrice) || 0;

    // Compute end balance and status
    const endBalance = Number(driverSection.endBalance) || 0;
    const tankCapacity = Number(vehicleInfo.tankCapacity) || 0;
    const refuelThreshold = tankCapacity * 0.2;

    const status = maintenance
      ? endBalance <= refuelThreshold
        ? "Needs Refuel"
        : "OK"
      : "No Data";

    return {
      ...trip,
      description: vehicleInfo.description,
      fuelType: vehicleInfo.fuelType,
      fuelPrice,
      fuelQuantity,
      totalAmount: fuelPrice * fuelQuantity,
      status,
    };
  });

  // -------------------
  // Filter: Today onwards only
  // -------------------
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredByDate = mergedTrips.filter((trip) => {
    if (!trip.fuelSlipDate) return false;
    const tripDate = new Date(trip.fuelSlipDate);
    return !isNaN(tripDate.getTime()) && tripDate >= today;
  });

  // -------------------
  // Sort by latest first
  // -------------------
  const sortedTrips = filteredByDate.sort((a, b) => {
    const dateA = a.fuelSlipDate ? new Date(a.fuelSlipDate).getTime() : 0;
    const dateB = b.fuelSlipDate ? new Date(b.fuelSlipDate).getTime() : 0;
    return dateB - dateA;
  });

  // -------------------
  // Search filter
  // -------------------
  const filteredTrips = sortedTrips.filter((trip) => {
    const term = searchTerm.toLowerCase();
    return (
      trip.tripTicketNo?.toLowerCase().includes(term) ||
      trip.plateNumber?.toLowerCase().includes(term) ||
      trip.driver?.toLowerCase().includes(term) ||
      trip.purpose?.toLowerCase().includes(term)
    );
  });

  // -------------------
  // Totals
  // -------------------
  const totalAmount = filteredTrips.reduce(
    (sum, t) => sum + (t.totalAmount ?? 0),
    0
  );

  return (
    <div className="max-w-full mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Fuel Reports</h1>
        <Link href="/">
          <button className="bg-slate-200 px-4 py-2 rounded hover:bg-slate-300">
            Back
          </button>
        </Link>
      </div>

      {/* Summary */}
      <div className="mb-4 bg-slate-100 p-4 rounded-lg flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-600">Total Fuel Expenses</p>
          <p className="text-2xl font-bold text-slate-800">
            ₱{totalAmount.toFixed(2)}
          </p>
        </div>
        <div className="text-sm text-slate-600">
          Total Reports: <span className="font-semibold">{filteredTrips.length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by Trip No, Plate, Driver, or Purpose..."
          className="w-full p-2 border rounded"
          value={searchTerm}
          onInput={(e) => setSearchTerm(e.currentTarget.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-slate-200 bg-white rounded-xl shadow-sm">
          <thead className="bg-slate-100">
            <tr>
              {categories.map((field) => (
                <th key={field} className="px-4 py-2 border">
                  {formatHeader(field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={categories.length} className="text-center py-4 text-slate-600">
                  Loading fuel reports...
                </td>
              </tr>
            ) : (
              filteredTrips.map((trip, idx) => (
                <tr key={trip.id || idx} className="hover:bg-slate-50">
                  {categories.map((field) => {
                    const value = trip[field];

                    // Format numeric fields
                    if (field === "fuelPrice" || field === "fuelQuantity" || field === "totalAmount") {
                      return (
                        <td key={field} className="px-4 py-2 border">
                          {value !== undefined ? Number(value).toFixed(2) : "-"}
                        </td>
                      );
                    }

                    // Highlight Needs Refuel in red
                    if (field === "status") {
                      return (
                        <td
                          key={field}
                          className={`px-4 py-2 border ${value === "Needs Refuel" ? "text-red-600 font-bold" : ""}`}
                        >
                          {value ?? "-"}
                        </td>
                      );
                    }

                    // Display passengers as comma-separated string
                    if (field === "passengers") {
                      return (
                        <td key={field} className="px-4 py-2 border">
                          {Array.isArray(trip.passengers) && trip.passengers.length > 0
                            ? trip.passengers.join(", ")
                            : "-"}
                        </td>
                      );
                    }

                    return (
                      <td key={field} className="px-4 py-2 border">
                        {value ?? "-"}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}

// -------------------
// Hook to fetch trips + maintenance
// -------------------
function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenanceReports, setMaintenanceReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Trips collection
    const tripsRef = collection(firebaseFirestore, "trips");
    const tripsQuery = query(tripsRef);

    const unsubscribeTrips = onSnapshot(
      tripsQuery,
      (snapshot) => {
        const fetchedTrips: Trip[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          let fuelSlipDate = "";
          if (data.estimatedArrival) {
            const d = new Date(data.estimatedArrival);
            if (!isNaN(d.getTime())) {
              fuelSlipDate = d.toISOString().split("T")[0]; // YYYY-MM-DD
            }
          }

          return {
            id: doc.id,
            fuelSlipDate,
            tripTicketNo: data.tripCode ?? "",
            plateNumber: data.vehicleAssigned ?? "",
            description: "",
            fuelType: "",
            driver: data.driverName ?? "",
            passengers: Array.isArray(data.passengers) ? data.passengers : [], // <-- fixed
            purpose: data.purpose ?? "",
          };
        });

        setTrips(fetchedTrips);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to fetch trips.");
        setLoading(false);
      }
    );

    // Maintenance reports
    const maintenanceRef = collection(firebaseFirestore, "maintenanceReports");
    const unsubscribeMaintenance = onSnapshot(
      maintenanceRef,
      (snapshot) => {
        const reports = snapshot.docs.map((doc) => doc.data());
        setMaintenanceReports(reports);
      },
      (err) => console.error(err)
    );

    return () => {
      unsubscribeTrips();
      unsubscribeMaintenance();
    };
  }, []);

  return { trips, maintenanceReports, loading, error };
}