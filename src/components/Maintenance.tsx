// src/pages/Maintenance.tsx
import { useState, useEffect } from "preact/hooks";
import { collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { firebaseFirestore } from "../firebase";

interface ChecklistItem {
  id: number;
  label: string;
  status?: "Good" | "Defective";
}

interface TripOption {
  id: string;
  tripTicketNo: string;
  plateNumber: string;
  fuelSlipDate: string;
  driver: string;
  timestamp: number;
}

// ================== PLATES ==================
const automotivePlates = [
  "SKU 532", "SAB 6183", "SAA 7857", "SAB 6182", "131206",
  "DOL 180", "131202", "SAA 6494", "SBA 1045", "SBA 1406", "SEH 336", "SEH 673"
];

const motorcyclePlates = [
  "TRYC. NO. 01", "TRYC. NO. 02", "TRYC. NO. 03",
  "TRYC. NO. 04", "MV287", "MV291", "MV231"
];

// ================== CHECKLIST ITEMS ==================
const automotiveItems: ChecklistItem[] = [
  { id: 1, label: "Check horn portion" },
  { id: 2, label: "Check wiper operation" },
  { id: 3, label: "Check windshield washer operation, and washer water level" },
  { id: 4, label: "Check headlight (H&L) operation and condition (adjust if necessary)" },
  { id: 5, label: "Check signal light operation" },
  { id: 6, label: "Check hazard/emergency light operation" },
  { id: 7, label: "Check back-up light operation" },
  { id: 8, label: "Check stop light operation" },
  { id: 9, label: "Check seatbelt condition" },
  { id: 10, label: "Check battery & battery cable clamp" },
  { id: 11, label: "Check brake fluid level" },
  { id: 12, label: "Check radiator water level & coolant" },
  { id: 13, label: "Check power steering fluid level" },
  { id: 14, label: "Check engine oil condition & level" },
  { id: 15, label: "Check ATF" },
  { id: 16, label: "Check tire condition include spare tire" },
  { id: 17, label: "Check instrument panel gauges" },
  { id: 18, label: "Check side/back mirror" },
  { id: 19, label: "Check plate light operation" },
  { id: 20, label: "Check handtools and jack condition" },
];

const motorcycleItems: ChecklistItem[] = [
  { id: 1, label: "Check front finder" },
  { id: 2, label: "Check rear fender" },
  { id: 3, label: "Check speedometer Assy and Housing" },
  { id: 4, label: "Check signal light front left/right" },
  { id: 5, label: "Check signal light rear left/right" },
  { id: 6, label: "Check headlight assy/cowling" },
  { id: 7, label: "Check brake/clutch lever" },
  { id: 8, label: "Check rubber grip left/right" },
  { id: 9, label: "Check left handle switch assy" },
  { id: 10, label: "Check right handle switch assy" },
  { id: 11, label: "Check cables clutch/accelerator/brake" },
  { id: 12, label: "Check side mirror left/right" },
  { id: 13, label: "Check ignition switch assy & key" },
  { id: 14, label: "Check fuel tank/filler cap/ fuel cock" },
  { id: 15, label: "Check kick starter assy" },
  { id: 16, label: "Check footrest bar & rubber" },
  { id: 17, label: "Check gear shifting lever w/ rubber" },
  { id: 18, label: "Check front wheel rim" },
  { id: 19, label: "Check front wheel hub" },
  { id: 20, label: "Check front & rear wheel spokes" },
  { id: 21, label: "Check sprockets/chain/ v belt with oil grease" },
  { id: 22, label: "Check rear shock absorber right/left" },
  { id: 23, label: "Check horn assy" },
  { id: 24, label: "Check tail light assy" },
  { id: 25, label: "Check basic tools" },
];

export default function Maintenance({
  category,
}: {
  category: "Automotive" | "Motorcycle";
}) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string>("");

  const [tripOptions, setTripOptions] = useState<TripOption[]>([]);
  const [existingMaintenance, setExistingMaintenance] = useState<string[]>([]);

  const [remarks, setRemarks] = useState("");
  const [balanceTank, setBalanceTank] = useState("");
  const [odometerReading, setOdometerReading] = useState("");
  const [driverRemarks, setDriverRemarks] = useState("");

  const [inspectedBy, setInspectedBy] = useState("");
  const [conformedBy, setConformedBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Trips and Existing Maintenance
  useEffect(() => {
    const unsubscribeTrips = onSnapshot(collection(firebaseFirestore, "trips"), (snap) => {
      const trips: TripOption[] = snap.docs.map((doc) => {
        const d = doc.data();
        const tripDate = d.estimatedArrival ? new Date(d.estimatedArrival) : new Date(0);
        
        return {
          id: doc.id,
          tripTicketNo: d.tripCode || doc.id.substring(0, 8).toUpperCase(),
          plateNumber: d.vehicleAssigned || "",
          fuelSlipDate: tripDate.toLocaleDateString("en-CA"),
          driver: d.driverName || "",
          timestamp: tripDate.getTime(),
        };
      });
      setTripOptions(trips);
    });

    const unsubscribeMaint = onSnapshot(collection(firebaseFirestore, "maintenanceReports"), (snap) => {
      const maintainedIds = snap.docs
        .map((doc) => doc.data().tripId)
        .filter((id): id is string => typeof id === "string");
      setExistingMaintenance(maintainedIds);
    });

    return () => {
      unsubscribeTrips();
      unsubscribeMaint();
    };
  }, []);

  // Reset when category changes
  useEffect(() => {
    const initialItems = category === "Automotive" ? [...automotiveItems] : [...motorcycleItems];
    setItems(initialItems.map((item) => ({ ...item, status: undefined })));

    const initialPlate = category === "Automotive" ? automotivePlates[0] : motorcyclePlates[0];
    setSelectedPlate(initialPlate);
    setSelectedTripId("");
  }, [category]);

  const handleStatusChange = (id: number, status: "Good" | "Defective") => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  // Select All Functions
  const selectAllGood = () => {
    if (!confirm("Mark ALL items as GOOD?")) return;
    setItems((prev) => prev.map((item) => ({ ...item, status: "Good" })));
  };

  const selectAllDefective = () => {
    if (!confirm("Mark ALL items as DEFECTIVE?")) return;
    setItems((prev) => prev.map((item) => ({ ...item, status: "Defective" })));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!selectedPlate) return alert("Please select a plate number");
    if (!items.every((i) => i.status)) return alert("Please complete all checklist items");

    setIsSubmitting(true);

    try {
      await addDoc(collection(firebaseFirestore, "maintenanceReports"), {
        category,
        plateNumber: selectedPlate,
        tripId: selectedTripId || null,
        checklist: items,
        remarks: remarks.trim(),
        driverSection: {
          balanceTank: balanceTank ? parseFloat(balanceTank) : null,
          odometerReading: odometerReading ? parseFloat(odometerReading) : null,
          driverRemarks: driverRemarks.trim(),
        },
        inspectedBy: inspectedBy.trim(),
        conformedBy: conformedBy.trim(),
        timestamp: serverTimestamp(),
      });

      alert("Checklist submitted successfully!");

      // Reset form
      setBalanceTank("");
      setOdometerReading("");
      setDriverRemarks("");
      setRemarks("");
      setInspectedBy("");
      setConformedBy("");
      setSelectedTripId("");
    } catch (err) {
      console.error("Error:", err);
      alert("Error submitting checklist");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Today's trips filter
  const todayStr = new Date().toLocaleDateString("en-CA");

  const availableTrips = tripOptions
    .filter((trip) => {
      return (
        trip.plateNumber === selectedPlate &&
        trip.fuelSlipDate === todayStr &&
        !existingMaintenance.includes(trip.id)
      );
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6 border-b pb-2">
        <img src="/images/PIWAD-LOGO.png" alt="PIWAD Logo" className="h-20 w-auto" />
        <div className="ml-4">
          <p className="text-sm font-semibold">Republic of the Philippines</p>
          <p className="text-lg font-bold">PILI WATER DISTRICT</p>
          <p className="text-sm">Sta. Rita Agro-Industrial Park, San Jose, Pili, Camarines Sur 4418</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">CHECKLIST OF VEHICLE AND MOTORCYCLE</h1>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
        >
          Back
        </button>
      </div>

      {/* Plate Number */}
      <div className="mb-6">
        <label className="font-semibold">Select Plate Number:</label>
        <select
          value={selectedPlate}
          onChange={(e) => {
            setSelectedPlate(e.currentTarget.value);
            setSelectedTripId("");
          }}
          className="w-full border p-2 rounded mt-1"
        >
          {(category === "Automotive" ? automotivePlates : motorcyclePlates).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Trip Selection */}
      <div className="mb-6">
        <label className="font-semibold block mb-1">Today's Trip:</label>
        <select
          value={selectedTripId}
          onChange={(e) => setSelectedTripId(e.currentTarget.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">-- Select Trip --</option>
          {availableTrips.length > 0 ? (
            availableTrips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.tripTicketNo} — {trip.fuelSlipDate} — Driver: {trip.driver || "N/A"}
              </option>
            ))
          ) : (
            <option disabled>No available trips today for this plate</option>
          )}
        </select>

        {selectedPlate && availableTrips.length === 0 && (
          <p className="text-orange-600 text-sm mt-2">
            No trips are available today for plate <strong>{selectedPlate}</strong> that have not yet been checked.
          </p>
        )}
      </div>

      {/* Checklist Table with Small Select All Buttons */}
      <table className="w-full border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">#</th>
            <th className="border px-2 py-1 text-left">Item</th>
            <th className="border px-2 py-1 text-center">
              Good
              <br />
              <button
                onClick={selectAllGood}
                className="text-[10px] mt-1 px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded"
              >
                Select all
              </button>
            </th>
            <th className="border px-2 py-1 text-center">
              Defective
              <br />
              <button
                onClick={selectAllDefective}
                className="text-[10px] mt-1 px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Select all
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="border px-2 py-1">{item.id}</td>
              <td className="border px-2 py-1">{item.label}</td>
              <td className="border text-center">
                <input
                  type="checkbox"
                  checked={item.status === "Good"}
                  onChange={() => handleStatusChange(item.id, "Good")}
                />
              </td>
              <td className="border text-center">
                <input
                  type="checkbox"
                  checked={item.status === "Defective"}
                  onChange={() => handleStatusChange(item.id, "Defective")}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Inspector Remarks */}
      <div className="mb-6">
        <label className="font-semibold">Inspector Remarks:</label>
        <textarea
          className="w-full border rounded p-2 mt-1"
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.currentTarget.value)}
        />
      </div>

      {/* Driver Section */}
      <h2 className="text-xl font-bold mb-3">B. Fuel Checklist (To Be Filled by the Driver)</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="number"
          step="0.01"
          placeholder="Balance in Tank (Liters)"
          value={balanceTank}
          onChange={(e) => setBalanceTank(e.currentTarget.value)}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Odometer Reading (kms)"
          value={odometerReading}
          onChange={(e) => setOdometerReading(e.currentTarget.value)}
          className="border p-2 rounded"
        />
      </div>

      <textarea
        placeholder="Driver Remarks"
        className="w-full border rounded p-2 mb-6"
        rows={3}
        value={driverRemarks}
        onChange={(e) => setDriverRemarks(e.currentTarget.value)}
      />

      {/* Reminder */}
      <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 mb-6">
        <strong>IMPORTANT REMINDER:</strong>{" "}
        {category === "Automotive"
          ? "Clean all Door Handles, Steering Wheel, Gear Shift Lever, Dashboard and Flooring."
          : "Cleanliness of Service Motorcycle and Trimobile."}
      </div>

      {/* Signatories */}
      <div className="mb-6 space-y-4">
        <input
          placeholder="Inspected by (Assigned Driver)"
          className="w-full border p-2 rounded"
          value={inspectedBy}
          onChange={(e) => setInspectedBy(e.currentTarget.value)}
        />
        <input
          placeholder="Conformed by (Driver/Mechanic)"
          className="w-full border p-2 rounded"
          value={conformedBy}
          onChange={(e) => setConformedBy(e.currentTarget.value)}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full md:w-auto px-8 py-3 rounded text-white font-medium ${
          isSubmitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isSubmitting ? "Submitting..." : "Submit Checklist"}
      </button>
    </div>
  );
}