import { useState } from "preact/hooks";
import { collection, addDoc, serverTimestamp, query, getDocs } from "firebase/firestore";
import { firebaseFirestore } from "../firebase";
import SignatureCanvas from "react-signature-canvas";
import { useRef } from "preact/hooks";

interface ChecklistItem {
  id: number;
  label: string;
  status?: "Good" | "Defective";
}

// Vehicle lists
const automotivePlates = [
  "SKU 532", "SEH 336", "SBA 1406", "SAB 6183",
  "SBA 1045", "131202","131206", "SAB 6182", "SAA 7857", "SAA 6494", "SEH 673"
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

export default function Maintenance({
  category,
  darkMode
}: {
  category: "Automotive" | "Motorcycle";
  darkMode: boolean;
}) {
  const [items, setItems] = useState<ChecklistItem[]>(
    category === "Automotive" ? [...automotiveItems] : [...motorcycleItems]
  );

  const [selectedPlate, setSelectedPlate] = useState(
    category === "Automotive" ? automotivePlates[0] : motorcyclePlates[0]
  );

  const generateTrackingId = async (): Promise<string> => {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, "");

    const q = query(collection(firebaseFirestore, "maintenanceReports"));
    const snapshot = await getDocs(q);
    const todayCount = snapshot.docs.filter(doc => {
      const data = doc.data() as any;
      return data.timestamp?.toDate?.()?.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);
    }).length;

    const sequence = (todayCount + 1).toString().padStart(4, "0");
    return `${dateStr}-${sequence}`;
  };

  const [remarks, setRemarks] = useState("");

  // ==================== DRIVER SECTION - UPDATED FIELDS ====================
  const [balanceTank, setBalanceTank] = useState("");
  const [speedReading, setSpeedReading] = useState("");     
  const [driverRemarks, setDriverRemarks] = useState("");
  // =====================================================================

  const [inspectedBy, setInspectedBy] = useState("");
  const [conformedBy, setConformedBy] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const driverSigRef = useRef<SignatureCanvas>(null);
const mechanicSigRef = useRef<SignatureCanvas>(null);

  const handleStatusChange = (id: number, status: "Good" | "Defective") => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item))
    );
  };
  const selectAllGood = () => {
  if (!confirm("Mark ALL items as GOOD?")) return;
  setItems((prev) => prev.map((item) => ({ ...item, status: "Good" })));
};

const selectAllDefective = () => {
  if (!confirm("Mark ALL items as DEFECTIVE?")) return;
  setItems((prev) => prev.map((item) => ({ ...item, status: "Defective" })));
};

const clearAll = () => {
  if (!confirm("Clear ALL selections?")) return;
  setItems((prev) => prev.map((item) => ({ ...item, status: undefined })));
};

  const handleSubmit = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);

  try {
    // Basic validation
    if (!inspectedBy.trim()) {
      alert("Please enter 'Inspected by' name");
      return;
    }
    if (!conformedBy.trim()) {
      alert("Please enter 'Conformed by' name");
      return;
    }

    if (driverSigRef.current?.isEmpty()) {
      alert("Driver signature cannot be empty!");
      return;
    }
    if (mechanicSigRef.current?.isEmpty()) {
      alert("Mechanic signature cannot be empty!");
      return;
    }

    const trackingId = await generateTrackingId();

    
    const getSignatureDataUrl = (ref: any): string => {
      if (!ref?.current) return "";

      const canvas = ref.current.getCanvas();
      if (!canvas) return "";

     
      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d")!;
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      ctx.drawImage(canvas, 0, 0);

      const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;

      let top = 0;
      outer: for (let y = 0; y < tempCanvas.height; y++) {
        for (let x = 0; x < tempCanvas.width; x++) {
          if (data[(y * tempCanvas.width + x) * 4 + 3] > 0) { 
            top = y;
            break outer;
          }
        }
      }

      if (top === 0) return canvas.toDataURL("image/png");

      
      const trimmedHeight = tempCanvas.height - top;
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = tempCanvas.width;
      finalCanvas.height = trimmedHeight;

      finalCanvas.getContext("2d")!.drawImage(
        tempCanvas,
        0, top, tempCanvas.width, trimmedHeight,
        0, 0, tempCanvas.width, trimmedHeight
      );

      return finalCanvas.toDataURL("image/png");
    };

    const driverSignature = getSignatureDataUrl(driverSigRef);
    const mechanicSignature = getSignatureDataUrl(mechanicSigRef);

    await addDoc(collection(firebaseFirestore, "maintenanceReports"), {
      trackingId,
      category,
      plateNumber: selectedPlate,
      checklist: items,
      remarks,
      driverSection: {
        balanceInTank: Number(balanceTank || 0),
        speedReading: Number(speedReading || 0),
        driverRemarks,
      },
      inspectedBy: inspectedBy.trim(),
      conformedBy: conformedBy.trim(),
      timestamp: serverTimestamp(),
      driverSignature,
      mechanicSignature,
    });

    alert("✅ Checklist submitted successfully!");
    window.history.back();

  } catch (error) {
    console.error("Error submitting checklist:", error);
    alert("Error submitting checklist. Check console for details.");
  } finally {
    setIsSubmitting(false);
  }
};

  const plateNumbers = category === "Automotive" ? automotivePlates : motorcyclePlates;

  return (
    <div className={`p-6 min-h-screen transition-colors duration-200
  ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* HEADER WITH LOGO AND TEXT */}
      <div className="flex items-center mb-6 border-b pb-2">
        <div className="flex-shrink-0">
          <img
            src="/images/PIWAD-LOGO.png"
            alt="PIWAD Logo"
            className="h-20 w-auto"
          />
        </div>
        <div className="ml-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Republic of the Philippines
      </p>

      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        PILI WATER DISTRICT
      </p>

     <p className="text-sm text-gray-600 dark:text-gray-300">
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
          className={`w-full border p-2 rounded mt-1 transition-colors
           ${darkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
        >
          {plateNumbers.map(plate => (
            <option key={plate} value={plate}>
              {plate}
            </option>
          ))}
        </select>
      </div>

      {/* Checklist Table */}
      <table className={`w-full mb-6 border transition-colors
       ${darkMode ? "border-gray-700 text-gray-100" : "border-gray-300 text-gray-900"}`}>
       <thead>
        <tr className={`${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
          <th className="border px-3 py-3">#</th>
          <th className="border px-3 py-3 text-left">Item</th>
          <th className="border px-3 py-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="font-medium">Good</span>
              <button
                onClick={selectAllGood}
                className="text-xs px-4 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
              >
                Select all
              </button>
            </div>
          </th>
          <th className="border px-3 py-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="font-medium">Defective</span>
              <button
                onClick={selectAllDefective}
                className="text-xs px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium"
              >
                Select all
              </button>
            </div>
          </th>
          <th className="border px-3 py-3 text-center w-28">
            <button
              onClick={clearAll}
              className="text-xs px-5 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded font-medium"
            >
              Clear all
            </button>
          </th>
        </tr>
      </thead>
        <tbody>
         {items.map((item) => (
          <tr key={item.id} className={darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"}>
            <td className="border px-3 py-3 text-center">{item.id}</td>
            <td className="border px-3 py-3">{item.label}</td>
            <td className="border px-3 py-3 text-center">
              <input
                type="checkbox"
                checked={item.status === "Good"}
                onChange={() => handleStatusChange(item.id, "Good")}
                className="w-5 h-5"
              />
            </td>
            <td className="border px-3 py-3 text-center">
              <input
                type="checkbox"
                checked={item.status === "Defective"}
                onChange={() => handleStatusChange(item.id, "Defective")}
                className="w-5 h-5"
              />
            </td>
            <td className="border px-3 py-3"></td>   {/* Empty cell para sa Clear All column */}
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

      {/* ==================== B. TO BE FILLED BY THE DRIVER ==================== */}
      <h2 className="text-xl font-bold mb-4">B. To Be Filled by the Driver</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Only these two fields remain + Driver Remarks */}
        <div>
          <label className="block text-sm font-medium mb-1">Balance in Tank (Liters)</label>
          <input
            type="number"
            placeholder="Balance in Tank"
            value={balanceTank}
            onInput={e => setBalanceTank((e.target as HTMLInputElement).value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Speed Reading (kms)</label>
          <input
            type="number"
            placeholder="Speed Reading"
            value={speedReading}
            onInput={e => setSpeedReading((e.target as HTMLInputElement).value)}
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      {/* Driver Remarks */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Driver Remarks</label>
        <textarea
          placeholder="Driver Remarks"
          className="w-full border rounded p-2"
          value={driverRemarks}
          onChange={e => setDriverRemarks(e.currentTarget.value)}
          rows={3}
        />
      </div>

      <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 mb-6">
        <strong>IMPORTANT REMINDER:</strong>{" "}
        {category === "Automotive"
          ? "Clean all Door Handles, Steering Wheel, Gear Shift Lever, Dashboard and Flooring."
          : "Cleanliness of Service Motorcycle and Trimobile."}
      </div>

      {/* Signatures Section */}
      <div className="mb-6">
        <input
          placeholder="Inspected by (Assigned Driver)"
          className="w-full border p-2 rounded mb-2"
          value={inspectedBy}
          onChange={e => setInspectedBy(e.currentTarget.value)}
        />

        <div className="mb-4">
          <p className="text-sm mb-1">Driver Signature:</p>
          <SignatureCanvas
            ref={driverSigRef}
            penColor="black"
            canvasProps={{ width: 350, height: 150, className: "border" }}
          />
          <button
            type="button"
            onClick={() => driverSigRef.current?.clear()}
            className="text-xs text-red-500 mt-1"
          >
            Clear Signature
          </button>
        </div>

        <input
          placeholder="Conformed by (Driver/Mechanic)"
          className="w-full border p-2 rounded mb-2"
          value={conformedBy}
          onChange={e => setConformedBy(e.currentTarget.value)}
        />

        <div>
          <p className="text-sm mb-1">Mechanic Signature:</p>
          <SignatureCanvas
            ref={mechanicSigRef}
            penColor="black"
            canvasProps={{ width: 350, height: 150, className: "border" }}
          />
          <button
            type="button"
            onClick={() => mechanicSigRef.current?.clear()}
            className="text-xs text-red-500 mt-1"
          >
            Clear Signature
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`px-6 py-3 rounded text-white font-medium w-full md:w-auto ${isSubmitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {isSubmitting ? "Submitting..." : "Submit Checklist"}
      </button>
    </div>
  );
}