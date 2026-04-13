// src/pages/FuelReports.tsx
import { Link } from "wouter-preact";
import { useState, useEffect } from "preact/hooks";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { firebaseFirestore } from "../firebase";
import { vehicleTypes } from "../components/VehicleTypes";

export interface Trip {
  id: string;
  fuelSlipDate?: string;
  timestamp?: number;
  tripTicketNo?: string;
  plateNumber?: string;
  description?: string;
  fuelType?: string;
  driver?: string;
  passengers?: string[];
  purpose?: string;
  fuelPrice?: number;
  fuelQuantity?: number;
  totalAmount?: number;
  status?: string;
  requestedDateTime?: string;
}

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

function formatHeader(text: string) {
  return text
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

function exportToCSV(data: Trip[]) {
  if (!data.length) return;

  const headers = [
    "Date", "Trip No", "Plate", "Description", "Fuel Type",
    "Driver", "Passengers", "Purpose", "Fuel Price", "Fuel Qty", "Total"
  ];

  const rows = data.map((t) => [
    t.fuelSlipDate ?? "",
    t.tripTicketNo ?? "",
    t.plateNumber ?? "",
    t.description ?? "",
    t.fuelType ?? "",
    t.driver ?? "",
    Array.isArray(t.passengers) ? t.passengers.join(", ") : "",
    t.purpose ?? "",
    t.fuelPrice ?? "",
    t.fuelQuantity ?? 0,
    t.totalAmount ?? 0,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((v) => `"${v}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fuel_reports_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

export default function FuelReports() {
  const { trips, maintenanceReports, loading, error } = useTrips();   // ← from hook

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("All");

  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editedFuelPrice, setEditedFuelPrice] = useState<Record<string, string>>({});

  const pageSize = 100;

  // ================== MERGED TRIPS ==================
  const mergedTrips = trips.map((trip) => {
    const plate = trip.plateNumber ?? "";

    const vehicleInfo = vehicleTypes[plate] || {
      description: "",
      fuelType: "Unleaded",
      tankCapacity: 0,
    };

    const tankCapacity = Number(vehicleInfo.tankCapacity) || 0;

    // Find matching maintenance
    let maintenance: any = null;
    if (trip.id) {
      maintenance = maintenanceReports.find((m) => String(m.tripId) === String(trip.id));
    }

    // Same day fallback
    if (!maintenance && plate && trip.fuelSlipDate) {
      const tripDateStr = trip.fuelSlipDate;
      maintenance = maintenanceReports
        .filter((m) => m.plateNumber === plate)
        .filter((m) => {
          if (m.tripId) return String(m.tripId) === String(trip.id);
          let maintDate = null;
          if (m.timestamp) {
            const ts = m.timestamp.seconds ? m.timestamp.seconds * 1000 : m.timestamp;
            maintDate = new Date(ts).toLocaleDateString("en-CA");
          }
          return maintDate === tripDateStr;
        })
        .sort((a, b) => (b.timestamp?.seconds || b.timestamp || 0) - (a.timestamp?.seconds || a.timestamp || 0))[0];
    }

    const driverSection = maintenance?.driverSection;

    let fuelQuantity = 0;
    if (maintenance && driverSection?.balanceTank != null) {
      fuelQuantity = Math.max(0, tankCapacity - Number(driverSection.balanceTank));
    }

    const savedFuelPrice = Number(trip.fuelPrice ?? 0);
    const displayFuelPrice = editingRow === trip.id && editedFuelPrice[trip.id] !== undefined
      ? (editedFuelPrice[trip.id] === "" ? 0 : parseFloat(editedFuelPrice[trip.id]) || 0)
      : savedFuelPrice;

    const totalAmount = fuelQuantity * displayFuelPrice;

    let status = "No Checklist";
    if (maintenance && driverSection?.balanceTank != null) {
      status = (tankCapacity > 0 && Number(driverSection.balanceTank) <= tankCapacity * 0.2)
        ? "Needs Refuel"
        : "OK";
    }

    return {
      ...trip,
      description: vehicleInfo.description,
      fuelType: vehicleInfo.fuelType,
      fuelPrice: displayFuelPrice,
      fuelQuantity,
      totalAmount,
      status,
    };
  });

  // ------------------- FILTERING & PAGINATION -------------------
  const aprilStart = new Date(new Date().getFullYear(), 3, 1);

  const filteredByDate = mergedTrips.filter((trip) => {
    if (!trip.fuelSlipDate) return false;

    const tripDate = new Date(trip.fuelSlipDate);
    tripDate.setHours(0, 0, 0, 0);

    if (tripDate < aprilStart) return false;

    if (dateFilter === "All") return true;
    if (dateFilter === "Today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return tripDate.getTime() === today.getTime();
    }
    if (dateFilter === "This Month") {
      const now = new Date();
      return tripDate.getMonth() === now.getMonth() && tripDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === "Last Month") {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return tripDate.getMonth() === lastMonth.getMonth() && tripDate.getFullYear() === lastMonth.getFullYear();
    }
    return true;
  });

  const sortedTrips = filteredByDate.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

  const filteredTrips = sortedTrips.filter((trip) => {
    const term = searchTerm.toLowerCase();
    return (
      (trip.tripTicketNo || "").toLowerCase().includes(term) ||
      (trip.plateNumber || "").toLowerCase().includes(term) ||
      (trip.driver || "").toLowerCase().includes(term) ||
      (trip.purpose || "").toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredTrips.length / pageSize);
  const paginatedTrips = filteredTrips.slice((page - 1) * pageSize, page * pageSize);

  const totalAmount = paginatedTrips.reduce((sum, t) => sum + (t.totalAmount ?? 0), 0);

  const handleFuelPriceSave = async (tripId: string, valueStr: string) => {
    const value = parseFloat(valueStr);
    if (isNaN(value) || value < 0) return;

    try {
      await updateDoc(doc(firebaseFirestore, "trips", tripId), { fuelPrice: value });
    } catch (err) {
      console.error("Failed to update fuelPrice:", err);
    }
  };

  return (
    <div className="max-w-full mx-auto p-4">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Fuel Reports</h1>
        <div className="flex gap-2">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={() => exportToCSV(filteredTrips)}
          >
            Export CSV
          </button>
          <Link href="/">
            <button className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Back</button>
          </Link>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <select
          className="border p-2 rounded"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.currentTarget.value); setPage(1); }}
        >
          <option>All</option>
          <option>Today</option>
          <option>This Month</option>
          <option>Last Month</option>
        </select>

        <input
          type="text"
          placeholder="Search by trip no, plate, driver, or purpose..."
          className="flex-1 min-w-[250px] p-2 border rounded"
          value={searchTerm}
          onInput={(e) => { setSearchTerm(e.currentTarget.value); setPage(1); }}
        />
      </div>

      {/* SUMMARY */}
      <div className="mb-4 bg-gray-100 p-4 rounded flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">Total Fuel Expenses</p>
          <p className="text-2xl font-bold">₱{totalAmount.toFixed(2)}</p>
        </div>
        <div className="text-right">
          Total Reports: <span className="font-semibold">{filteredTrips.length}</span>
        </div>
      </div>

      {/* TABLE */}
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-50">
            {categories.map((c) => (
              <th key={c} className="border p-2 text-left font-medium">
                {formatHeader(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={categories.length} className="text-center py-8">Loading...</td></tr>
          ) : paginatedTrips.length === 0 ? (
            <tr><td colSpan={categories.length} className="text-center py-8">No fuel reports found.</td></tr>
          ) : (
            paginatedTrips.map((trip) => (
              <tr key={trip.id} className="hover:bg-gray-50">
                {categories.map((field) => {
                  const value = (trip as any)[field];

                  if (field === "fuelPrice") {
                    const isEditing = editingRow === trip.id;
                    return (
                      <td key={field} className="border p-2">
                        {isEditing ? (
                          <input
                            autoFocus
                            type="text"
                            inputMode="decimal"
                            className="w-28 border rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                            value={editedFuelPrice[trip.id] ?? value ?? ""}
                            onInput={(e) => setEditedFuelPrice(prev => ({ ...prev, [trip.id]: e.currentTarget.value }))}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter") {
                                await handleFuelPriceSave(trip.id, editedFuelPrice[trip.id] ?? "");
                                setEditedFuelPrice(prev => { const ns = {...prev}; delete ns[trip.id]; return ns; });
                                setEditingRow(null);
                              }
                              if (e.key === "Escape") {
                                setEditedFuelPrice(prev => { const ns = {...prev}; delete ns[trip.id]; return ns; });
                                setEditingRow(null);
                              }
                            }}
                            onBlur={async () => {
                              await handleFuelPriceSave(trip.id, editedFuelPrice[trip.id] ?? "");
                              setEditedFuelPrice(prev => { const ns = {...prev}; delete ns[trip.id]; return ns; });
                              setEditingRow(null);
                            }}
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-blue-600 font-medium"
                            onClick={() => setEditingRow(trip.id)}
                          >
                            ₱{Number(value || 0).toFixed(2)}
                          </span>
                        )}
                      </td>
                    );
                  }

                  if (field === "fuelQuantity" || field === "totalAmount") {
                    return <td key={field} className="border p-2 font-medium">{value == null ? "-" : Number(value).toFixed(2)}</td>;
                  }

                  if (field === "passengers") {
                    return (
                      <td key={field} className="border p-2">
                        {Array.isArray(trip.passengers) && trip.passengers.length > 0 ? trip.passengers.join(", ") : "-"}
                      </td>
                    );
                  }

                  return <td key={field} className="border p-2">{value ?? "-"}</td>;
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-4">
        <button className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>Previous</button>
        <span className="text-sm">Page {page} of {totalPages || 1}</span>
        <button className="bg-gray-200 px-4 py-2 rounded disabled:opacity-50" onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages || totalPages === 0}>Next</button>
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}

// ------------------- HOOK -------------------
function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenanceReports, setMaintenanceReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubTrips = onSnapshot(collection(firebaseFirestore, "trips"), (snap) => {
      try {
        const data = snap.docs.map((docSnap) => {
          const d: any = docSnap.data();
          let fuelSlipDate = "";
          let timestamp: number | undefined;

          // PRIMARY: requestedDateTime (mula sa Request Form)
          // Fallback: dateTime or estimatedArrival
          const dateField = d.requestedDateTime || d.dateTime || d.estimatedArrival || d.departure;

          if (dateField) {
            let parsedDate: Date | null = null;

            if (dateField?.toDate && typeof dateField.toDate === "function") {
              parsedDate = dateField.toDate();
            } else {
              parsedDate = new Date(dateField);
            }

            if (parsedDate && !isNaN(parsedDate.getTime())) {
              const year = parsedDate.getFullYear();
              const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
              const day = String(parsedDate.getDate()).padStart(2, "0");
              fuelSlipDate = `${year}-${month}-${day}`;
              timestamp = parsedDate.getTime();
            }
          }

          return {
            id: docSnap.id,
            fuelSlipDate,
            timestamp,
            tripTicketNo: d.tripCode ?? docSnap.id.substring(0, 8).toUpperCase(),
            plateNumber: d.vehicleAssigned ?? "",
            driver: d.driverName ?? "",
            passengers: Array.isArray(d.passengers) ? d.passengers : [],
            purpose: d.purpose ?? "",
            fuelPrice: d.fuelPrice ?? 0,
            requestedDateTime: d.requestedDateTime,   // keep original for reference
          };
        });

        setTrips(data);
        setLoading(false);
      } catch (err) {
        console.error("Error parsing trips:", err);
        setError("Error loading trips data");
        setLoading(false);
      }
    });

    const unsubMaint = onSnapshot(
      collection(firebaseFirestore, "maintenanceReports"),
      (snap) => {
        setMaintenanceReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    return () => {
      unsubTrips();
      unsubMaint();
    };
  }, []);

  return { trips, maintenanceReports, loading, error };
}