import { useState } from "preact/hooks";
import { collection, addDoc, serverTimestamp, query, getDocs } from "firebase/firestore";
import { firebaseFirestore } from "../firebase";

interface ChecklistItem {
  id: number;
  label: string;
  status?: "Good" | "Defective";
}

// Vehicle lists
const automotivePlates = [
  "SKU 532", "SAB 6183", "SAA 7857", "SAB 6182",
  "DOL 180", "131202", "SAA 6494", "SBA 1045", "SBA 1406"
];

const motorcyclePlates = [
  "TRYC. NO. 01", "TRYC. NO. 02", "TRYC. NO. 03",
  "TRYC. NO. 04", "MV287", "MV291", "MV231"
];

// Checklist items
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

export default function Maintenance({ category }: { category: "Automotive" | "Motorcycle" }) {
  const [items, setItems] = useState<ChecklistItem[]>(
    category === "Automotive" ? [...automotiveItems] : [...motorcycleItems]
  );

  const [selectedPlate, setSelectedPlate] = useState(
    category === "Automotive" ? automotivePlates[0] : motorcyclePlates[0]
  );

   const generateTrackingId = async (): Promise<string> => {
    const today = new Date();
    const dateStr = today.toISOString().slice(2,10).replace(/-/g, ""); // e.g., "260318"

    // Get current count of reports today for sequence
    const q = query(collection(firebaseFirestore, "maintenanceReports"));
    const snapshot = await getDocs(q);
    const todayCount = snapshot.docs.filter(doc => {
      const data = doc.data() as any;
      return data.timestamp?.toDate?.()?.toISOString().slice(0,10) === today.toISOString().slice(0,10);
    }).length;

    const sequence = (todayCount + 1).toString().padStart(4, "0"); // "0005"
    return `${dateStr}-${sequence}`; // e.g., "260318-0005"
  };

  const [remarks, setRemarks] = useState("");

  // Driver Section Fields
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [gasIssued, setGasIssued] = useState("");
  const [balanceTank, setBalanceTank] = useState("");
  const [addPurchased, setAddPurchased] = useState("");
  const [deductUsed, setDeductUsed] = useState("");
  const [endBalance, setEndBalance] = useState("");
  const [speedoStart, setSpeedoStart] = useState("");
  const [speedoEnd, setSpeedoEnd] = useState("");
  const [distanceTravelled, setDistanceTravelled] = useState("");
  const [driverRemarks, setDriverRemarks] = useState("");

  const [inspectedBy, setInspectedBy] = useState("");
  const [conformedBy, setConformedBy] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔹 Handles Good/Defective toggle
  const handleStatusChange = (id: number, status: "Good" | "Defective") => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item))
    );
  };

  // 🔹 Submit form to Firestore
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const trackingId = await generateTrackingId();
      // 🔹 Convert numeric fields
      const numericBalanceTank = Number(balanceTank || 0);
      const numericAddPurchased = Number(addPurchased || 0);
      const numericDeductUsed = Number(deductUsed || 0);
      const numericEndBalance = Number(endBalance || 0);
      const numericSpeedoStart = Number(speedoStart || 0);
      const numericSpeedoEnd = Number(speedoEnd || 0);
      const numericDistance = Number(distanceTravelled || 0);

      // 🔹 FIRESTORE SAVE
      await addDoc(collection(firebaseFirestore, "maintenanceReports"), {
        trackingId,
        category,
        plateNumber: selectedPlate,
        checklist: items,
        remarks,
        driverSection: {
          departureTime,
          arrivalTime,
          gasIssued: numericBalanceTank, // 🔹 Optional: can leave as string
          balanceTank: numericBalanceTank,
          addPurchased: numericAddPurchased,
          total: numericBalanceTank + numericAddPurchased,
          deductUsed: numericDeductUsed,
          endBalance: numericEndBalance,
          speedoStart: numericSpeedoStart,
          speedoEnd: numericSpeedoEnd,
          distanceTravelled: numericDistance,
          driverRemarks,
        },
        inspectedBy,
        conformedBy,
        timestamp: serverTimestamp(),
      });

      alert("Checklist submitted successfully!");
      window.history.back();

    } catch (error) {
      console.error("Error submitting checklist:", error);
      alert("Error submitting checklist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which plate numbers to show based on category
  const plateNumbers = category === "Automotive" ? automotivePlates : motorcyclePlates;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* === HEADER WITH LOGO AND TEXT === */}
      <div className="flex items-center mb-6 border-b pb-2">
        <div className="flex-shrink-0">
          <img
            src="/images/PIWAD-LOGO.png"
            alt="PIWAD Logo"
            className="h-20 w-auto"
          />
        </div>
        <div className="ml-4">
          <p className="text-sm font-semibold">Republic of the Philippines</p>
          <p className="text-lg font-bold">PILI WATER DISTRICT</p>
          <p className="text-sm">
            Sta. Rita Agro-Industrial Park, San Jose, Pili, Camarines Sur 4418
          </p>
        </div>
      </div>

      {/* Title + Back Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          CHECKLIST OF VEHICLE AND MOTORCYCLE
        </h1>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
        >
          Back
        </button>
      </div>

      {/* Plate Number Selection */}
      <div className="mb-6">
        <label className="font-semibold">Select Plate Number:</label>
        <select
          value={selectedPlate}
          onChange={e => setSelectedPlate(e.currentTarget.value)}
          className="w-full border p-2 rounded"
        >
          {plateNumbers.map(plate => (
            <option key={plate} value={plate}>
              {plate}
            </option>
          ))}
        </select>
      </div>

      {/* Checklist Table */}
      <table className="w-full border border-gray-300 mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">#</th>
            <th className="border px-2 py-1 text-left">Item</th>
            <th className="border px-2 py-1">Good</th>
            <th className="border px-2 py-1">Defective</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td className="border px-2 py-1">{item.id}</td>
              <td className="border px-2 py-1">{item.label}</td>
              <td className="border text-center">
                <input
                  type="radio"
                  name={`status-${item.id}`}
                  checked={item.status === "Good"}
                  onChange={() => handleStatusChange(item.id, "Good")}
                />
              </td>
              <td className="border text-center">
                <input
                  type="radio"
                  name={`status-${item.id}`}
                  checked={item.status === "Defective"}
                  onChange={() => handleStatusChange(item.id, "Defective")}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Inspector Remarks */}
      <label className="font-semibold">Inspector Remarks:</label>
      <textarea
        className="w-full border rounded p-2 mb-6"
        value={remarks}
        onChange={e => setRemarks(e.currentTarget.value)}
      />

      {/* DRIVER SECTION */}
      <h2 className="text-xl font-bold mb-2">B. To Be Filled by the Driver</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input placeholder="Time of Departure" value={departureTime} onInput={e => setDepartureTime((e.target as HTMLInputElement).value)} className="border p-2 rounded" />
        <input placeholder="Time of Arrival" value={arrivalTime} onInput={e => setArrivalTime((e.target as HTMLInputElement).value)} className="border p-2 rounded" />
        <input placeholder="Gasoline Issued (Liters)" value={gasIssued} onInput={e => setGasIssued((e.target as HTMLInputElement).value)} className="border p-2 rounded" />
        <input placeholder="Balance in Tank (Liters)" value={balanceTank} onInput={e => setBalanceTank((e.target as HTMLInputElement).value)} className="border p-2 rounded" />
        <input placeholder="Add Purchased (Liters)" value={addPurchased} onInput={e => setAddPurchased((e.target as HTMLInputElement).value)} className="border p-2 rounded" />
        <input placeholder="Deduct Used (Liters)" value={deductUsed} onInput={e => setDeductUsed((e.target as HTMLInputElement).value)} className="border p-2 rounded" />
        <input placeholder="Balance End of Trip (Liters)" value={endBalance} onInput={e => setEndBalance((e.target as HTMLInputElement).value)} className="border p-2 rounded" />
        <input placeholder="Speedometer Start (kms)" value={speedoStart} onInput={e => setSpeedoStart((e.target as HTMLInputElement).value)} className="border p-2 rounded" />
        <input placeholder="Speedometer End (kms)" value={speedoEnd} onInput={e => setSpeedoEnd((e.target as HTMLInputElement).value)} className="border p-2 rounded" />
        <input placeholder="Distance Travelled (kms)" value={distanceTravelled} onInput={e => setDistanceTravelled((e.target as HTMLInputElement).value)} className="border p-2 rounded" />
      </div>

      <textarea
        placeholder="Driver Remarks"
        className="w-full border rounded p-2 mb-6"
        value={driverRemarks}
        onChange={e => setDriverRemarks(e.currentTarget.value)}
      />

      <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 mb-6">
        <strong>IMPORTANT REMINDER:</strong>{" "}
        {category === "Automotive"
          ? "Clean all Door Handles, Steering Wheel, Gear Shift Lever, Dashboard and Flooring."
          : "Cleanliness of Service Motorcycle and Trimobile."}
      </div>

      <div className="mb-6">
        <input
          placeholder="Inspected by (Assigned Driver)"
          className="w-full border p-2 rounded mb-4"
          value={inspectedBy}
          onChange={e => setInspectedBy(e.currentTarget.value)}
        />
        <input
          placeholder="Conformed by (Driver/Mechanic)"
          className="w-full border p-2 rounded"
          value={conformedBy}
          onChange={e => setConformedBy(e.currentTarget.value)}
        />
      </div>

      {/* 🔹 Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`px-6 py-2 rounded text-white ${isSubmitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}