import { useState, useEffect } from "preact/hooks";
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, limit } from "firebase/firestore";
import { firebaseFirestore } from "../firebase";

type Item = {
  particulars: string;
  quantity: string;
  remarks: string;
};

// Realistic items for Pili Water District
const waterDistrictItems = [
  "PVC Pipe 2\"", "PVC Pipe 3\"", "PVC Pipe 4\"", "PVC Pipe 6\"",
  "Gate Valve 2\"", "Gate Valve 3\"", "Gate Valve 4\"",
  "Check Valve", "Ball Valve", "Coupling", "Elbow 90°", "Tee", "Reducer",
  "Rubber Gasket", "Flange", "Bolts & Nuts",
  "Water Meter", "Pressure Gauge",
  "Chlorine Test Kit", "Turbidity Meter", "pH Meter",
  "Safety Helmet", "Safety Boots", "Reflector Vest", "Gloves",
  "Pipe Wrench", "Pipe Cutter", "Threading Machine",
  "Generator", "Submersible Pump",
  "Office Chair", "Office Table", "Printer", "Laptop",
  "Others"
];

export default function BorrowersForm() {
  const [loading, setLoading] = useState(false);

  const [requestNo, setRequestNo] = useState("");
  const [date, setDate] = useState("");
  const [requestor, setRequestor] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  // Single form para sa pag-add ng item
  const [currentItem, setCurrentItem] = useState<Item>({
    particulars: "",
    quantity: "1",
    remarks: ""
  });

  // List of added items
  const [addedItems, setAddedItems] = useState<Item[]>([]);

  // Generate Request No
  const generateRequestNo = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${month}-`;

    try {
      const q = query(
        collection(firebaseFirestore, "borrowRequests"),
        orderBy("requestNo", "desc"),
        limit(1)
      );

      const snapshot = await getDocs(q);
      let nextNumber = 1;

      if (!snapshot.empty) {
        const latest = snapshot.docs[0].data().requestNo as string;
        if (latest?.startsWith(prefix)) {
          const lastNum = parseInt(latest.slice(-3));
          if (!isNaN(lastNum)) nextNumber = lastNum + 1;
        }
      }

      setRequestNo(`${prefix}${String(nextNumber).padStart(3, '0')}`);
    } catch (error) {
      console.error("Error generating request no:", error);
      setRequestNo(`${prefix}001`);
    }
  };

  useEffect(() => {
    generateRequestNo();
  }, []);

  // Add current item to the list
  const addItemToList = () => {
    if (!currentItem.particulars.trim()) {
      alert("Please select an item.");
      return;
    }

    setAddedItems([...addedItems, { ...currentItem }]);

    // Reset form para sa susunod na item
    setCurrentItem({
      particulars: "",
      quantity: "1",
      remarks: ""
    });
  };

  const removeAddedItem = (index: number) => {
    setAddedItems(addedItems.filter((_, i) => i !== index));
  };

  const handleCurrentItemChange = (field: keyof Item, value: string) => {
    setCurrentItem(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (loading || !requestNo) return;

    setLoading(true);

    try {
      if (addedItems.length === 0) {
        alert("Please add at least one item.");
        setLoading(false);
        return;
      }

      await addDoc(collection(firebaseFirestore, "borrowRequests"), {
        requestNo,
        date,
        requestor,
        purpose,
        startDate,
        returnDate,
        items: addedItems,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      alert(`Borrow request submitted successfully!\nRequest No: ${requestNo}`);

      // Reset form
      setDate("");
      setRequestor("");
      setPurpose("");
      setStartDate("");
      setReturnDate("");
      setAddedItems([]);
      setCurrentItem({ particulars: "", quantity: "1", remarks: "" });
      generateRequestNo();

    } catch (error: any) {
      console.error("Submit Error:", error);
      alert(error?.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8 text-sm">
      <div className="max-w-4xl mx-auto border p-8 rounded-lg shadow-sm bg-white">

        <h1 className="text-center font-bold text-2xl mb-8 text-gray-800">
          EQUIPMENT / MATERIAL BORROWERS REQUEST FORM
        </h1>

        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">Request No</label>
            <input 
              className="border w-full p-3 bg-gray-100 font-semibold text-lg rounded" 
              value={requestNo}
              readOnly 
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">Request Date</label>
            <input 
              type="date" 
              className="border w-full p-3 rounded"
              value={date}
              onChange={(e) => setDate(e.currentTarget.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">Name of Requestor</label>
            <input 
              className="border w-full p-3 rounded"
              value={requestor}
              onChange={(e) => setRequestor(e.currentTarget.value)}
              placeholder="Full Name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">Purpose</label>
            <input 
              className="border w-full p-3 rounded"
              value={purpose}
              onChange={(e) => setPurpose(e.currentTarget.value)}
              placeholder="Purpose of borrowing"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">Start Date (Hihiram)</label>
            <input 
              type="date" 
              className="border w-full p-3 rounded"
              value={startDate}
              onChange={(e) => setStartDate(e.currentTarget.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600">Return Date (Ibabalik)</label>
            <input 
              type="date" 
              className="border w-full p-3 rounded"
              value={returnDate}
              onChange={(e) => setReturnDate(e.currentTarget.value)}
            />
          </div>
        </div>

        {/* Add New Item Form - with OK button at the bottom */}
        <div className="mb-10">
          <h2 className="font-bold text-lg mb-4">Add Item</h2>

          <div className="border rounded-lg p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <label className="text-xs font-medium mb-1 block">Name of Item</label>
                <select
                  className="border w-full p-3 rounded"
                  value={currentItem.particulars}
                  onChange={(e) => handleCurrentItemChange("particulars", e.currentTarget.value)}
                >
                  <option value="">-- Select Item --</option>
                  {waterDistrictItems.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-medium mb-1 block">Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="border w-full p-3 rounded"
                  value={currentItem.quantity}
                  onChange={(e) => handleCurrentItemChange("quantity", e.currentTarget.value)}
                />
              </div>

              <div className="md:col-span-12">
                <label className="text-xs font-medium mb-1 block">Remarks (optional)</label>
                <input
                  className="border w-full p-3 rounded"
                  value={currentItem.remarks}
                  onChange={(e) => handleCurrentItemChange("remarks", e.currentTarget.value)}
                  placeholder="Size, specification, location, etc."
                />
              </div>
            </div>

            {/* OK Button - nasa ibaba na */}
            <div className="flex justify-end mt-6">
              <button 
                onClick={addItemToList}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>

        {/* Selected Items Summary */}
        <div className="mb-10">
          <h2 className="font-bold text-lg mb-4">Selected Items ({addedItems.length})</h2>

          {addedItems.length === 0 && (
            <p className="text-gray-500 italic p-6 border rounded bg-gray-50 text-center">
              No items added yet. Fill up the form above and click "OK".
            </p>
          )}

          {addedItems.map((item, index) => (
            <div 
              key={index} 
              className="flex justify-between items-center border p-4 mb-3 rounded-lg bg-white hover:bg-gray-50"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.particulars}</p>
                <p className="text-sm text-gray-600">
                  Quantity: <span className="font-medium">{item.quantity}</span>
                  {item.remarks && ` • ${item.remarks}`}
                </p>
              </div>

              <button
                onClick={() => removeAddedItem(index)}
                className="text-red-600 hover:text-red-700 font-medium text-sm px-4 py-1 rounded hover:bg-red-50 transition"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !requestNo || !startDate || !returnDate || addedItems.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-4 rounded-lg font-semibold text-lg transition"
        >
          {loading ? "Submitting Request..." : "Submit Borrow Request"}
        </button>
      </div>
    </div>
  );
}