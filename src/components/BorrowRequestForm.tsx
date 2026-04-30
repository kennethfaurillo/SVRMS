import { useState, useEffect } from "preact/hooks";
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, limit } from "firebase/firestore";
import { firebaseFirestore } from "../firebase";

type Item = {
  particulars: string;
  quantity: string;
  remarks: string;
};

const waterDistrictItems = [
  "Air Compressor",
  "Atlas Copco-Jack Hammer (Hydraulic)",
  "Atlas Copco-Jack Hammer (Pneumatic)",
  "Airman Pneumatic - Jack Hammer (Toku TPB-90)",
  "Concrete Cutter 1",
  "Concrete Cutter 2",
  "Concrete Cutter 3",
  "Grass Cutter 1",
  "Grass Cutter 2",
  "Grass Cutter 3",
  "Grass Cutter 4",
  "Jack Hammer Hilti 1",
  "Jack Hammer Hilti 2",
  "Jack Hammer Hilti 3",
  "Mobile Gen-set 10KVA",
  "Welding Generator",
  "Pipe Threader",
  "Power Spray",
  "Stanley-Jackhammer/1 Dewatering",
  "Stanley-Jackhammer/2 Dewatering",
  "Dewatering New",
  "Dewatering Old",
  "Tampering Machine 1",
  "Tampering Machine 2",

  //Quarterly
  "Butt Fusion Machine",
  "Cement Mixer 1",
  "Cement Mixer 2",
  "Chainsaw",
  "Fusion Machine",

  //Semi Annually
  "Grease Pump",
  
  //Generator Set
  "GS #1: San Vicente",
  "GS #4: San Jose",
  "GS #5: La Purisima I",
  "GS #6: San Jose",
  "GS #7: PIWAD Office",
  "GS #8: San Vicente",
  "GS #9 C. Park",
  "GS #10 Del Rosario",
  "GS #11 Cadlan",
  "GS #12 La Purisima II",
  "GS #13 Caroyroyan",
  "GS #14 Palestina",
  "GS #15 Del Rosario",
  "GS #16 La Purisima II",
  "GS #17 Palestina",
  "GS #18 C. Park",
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
    <div className="min-h-screen bg-white p-8 text-sm text-gray-900 dark:bg-white dark:text-gray-900">
     <div className="max-w-4xl mx-auto border p-8 rounded-lg shadow-sm bg-white text-gray-900 dark:bg-white dark:text-gray-900 dark:border-gray-300">

        <h1 className="text-center font-bold text-2xl mb-8 text-gray-800">
          EQUIPMENT / MATERIAL BORROWERS REQUEST FORM
        </h1>

        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-600">Request No</label>
            <input 
              className="border w-full p-3 bg-gray-100 font-semibold text-lg rounded" 
              value={requestNo}
              readOnly 
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-600">Request Date</label>
            <input 
              type="date" 
              className="border w-full p-3 rounded"
              value={date}
              onChange={(e) => setDate(e.currentTarget.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-600">Name of Requestor</label>
            <input 
              className="border w-full p-3 rounded"
              value={requestor}
              onChange={(e) => setRequestor(e.currentTarget.value)}
              placeholder="Full Name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-600">Purpose</label>
            <input 
              className="border w-full p-3 rounded"
              value={purpose}
              onChange={(e) => setPurpose(e.currentTarget.value)}
              placeholder="Purpose of borrowing"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-600">Start Date (Hihiram)</label>
            <input 
              type="date" 
              className="border w-full p-3 rounded"
              value={startDate}
              onChange={(e) => setStartDate(e.currentTarget.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-600">Return Date (Ibabalik)</label>
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

          <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-50 dark:border-gray-300">
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

            {/* OK Button*/}
            <div className="flex justify-end mt-6">
         <button
            onClick={addItemToList}
            className={`
              mt-2 flex items-center justify-center
              px-6 py-3 text-sm font-medium rounded-lg border
              transition-all duration-300 transform

              bg-blue-600 border-gray-200 text-white hover:bg-blue-50
              dark:bg-gray-700 dark:border-gray-600 dark:text-blue-300 dark:hover:bg-gray-600

              hover:-translate-y-1 hover:scale-[1.02] hover:shadow-md
              active:scale-95 cursor-pointer
            `}
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
              className="flex justify-between items-center border p-4 mb-3 rounded-lg bg-white hover:bg-gray-50 dark:bg-white dark:hover:bg-gray-100 dark:border-gray-300"
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