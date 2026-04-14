import { useEffect, useMemo, useState } from "preact/hooks";
import { firebaseFirestore } from "../firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export default function ItemsChecklistPage() {

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 controls which request is opened for editing (UNDO mode)
  const [editId, setEditId] = useState<string | null>(null);

  const [filter, setFilter] = useState<"all" | "daily" | "weekly" | "monthly">("all");

  // ================= LOAD =================
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(firebaseFirestore, "borrowRequests"));

      const data = snap.docs.map((d) => {
        const req = d.data();

        return {
          id: d.id,
          requestNo: req.requestNo,
          requestor: req.requestor,
          purpose: req.purpose,
          createdAt: req.createdAt?.toDate?.() || new Date(),

          hasMaintenanceChecklist: req.hasMaintenanceChecklist || false,

          items: (req.items || []).map((item: any) => ({
            name: item.particulars || item.name || "Unknown Item",
            quantity: item.quantity || 1,
            condition: item.condition || "",
          })),
        };
      });

      setRequests(data);
      setLoading(false);
    };

    load();
  }, []);

  // ================= FILTER =================
  const filtered = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return requests.filter((r) => {
      const d = new Date(r.createdAt);
      const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (filter === "daily") return day.getTime() === today.getTime();

      if (filter === "weekly") {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return day >= start && day <= end;
      }

      if (filter === "monthly") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [requests, filter]);

  // ================= TOGGLE =================
  const toggle = (reqIndex: number, itemIndex: number, value: "good" | "defective") => {
    const updated = [...requests];
    const item = updated[reqIndex].items[itemIndex];
    item.condition = item.condition === value ? "" : value;
    setRequests(updated);
  };

  // ================= SUBMIT =================
  const submitChecklist = async (reqIndex: number) => {
    const req = requests[reqIndex];

    const ref = doc(firebaseFirestore, "borrowRequests", req.id);

    await updateDoc(ref, {
      hasMaintenanceChecklist: true,
      checklist: req.items,
      checklistSubmittedAt: new Date(),
    });

    const updated = [...requests];
    updated[reqIndex].hasMaintenanceChecklist = true;
    setRequests(updated);
  };

  // ================= UNDO =================
  const undoChecklist = async (reqIndex: number) => {
    const req = requests[reqIndex];

    const ref = doc(firebaseFirestore, "borrowRequests", req.id);

    await updateDoc(ref, {
      hasMaintenanceChecklist: false,
      checklist: [],
      checklistSubmittedAt: null,
    });

    const updated = [...requests];
    updated[reqIndex].hasMaintenanceChecklist = false;
    setRequests(updated);

    // 🔥 auto open edit mode after undo
    setEditId(req.id);
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">

      {/* FILTER */}
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Maintenance Checklist</h1>

        <select
          value={filter}
          onChange={(e: any) => setFilter(e.target.value)}
          className="border px-3 py-1 rounded"
        >
          <option value="all">All</option>
          <option value="daily">Today</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
        </select>
      </div>

      {/* REQUEST LIST */}
      <div className="space-y-2">

        {filtered.map((req, reqIndex) => {

          const isOpen = editId === req.id; // 🔥 only opens when undo clicked

          return (
            <div key={req.id} className="border rounded-lg">

              {/* HEADER */}
              <div className="flex justify-between p-3">

                <div className="font-semibold">
                  Request #{req.requestNo}
                </div>

                <div className="flex gap-2">

                  {/* STATUS */}
                  <span className={`text-xs px-2 py-1 rounded ${
                    req.hasMaintenanceChecklist
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {req.hasMaintenanceChecklist ? "DONE" : "PENDING"}
                  </span>

                  {/* UNDO BUTTON ONLY IF DONE */}
                  {req.hasMaintenanceChecklist && (
                    <button
                      onClick={() => undoChecklist(reqIndex)}
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Undo
                    </button>
                  )}

                </div>

              </div>

              {/* ================= CHECKLIST ONLY IF: ================= */}
              {/* 1. NOT DONE OR 2. EDIT MODE (UNDO CLICKED) */}
              {(!req.hasMaintenanceChecklist || isOpen) && (

                <div className="p-4 border-t">

                  <table className="w-full border text-sm">

                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2">Item</th>
                        <th className="border p-2">Good</th>
                        <th className="border p-2">Defective</th>
                      </tr>
                    </thead>

                    <tbody>
                      {req.items.map((item: any, itemIndex: number) => (
                        <tr key={itemIndex}>

                          <td className="border p-2">
                            {item.name}
                            <div className="text-xs text-gray-500">
                              Qty: {item.quantity}
                            </div>
                          </td>

                          <td className="text-center border">
                            <input
                              type="checkbox"
                              checked={item.condition === "good"}
                              onChange={() => toggle(reqIndex, itemIndex, "good")}
                            />
                          </td>

                          <td className="text-center border">
                            <input
                              type="checkbox"
                              checked={item.condition === "defective"}
                              onChange={() => toggle(reqIndex, itemIndex, "defective")}
                            />
                          </td>

                        </tr>
                      ))}
                    </tbody>

                  </table>

                  {/* SUBMIT ONLY IF NOT DONE */}
                  {!req.hasMaintenanceChecklist && (
                    <div className="mt-3 text-right">
                      <button
                        onClick={() => submitChecklist(reqIndex)}
                        className="bg-green-600 text-white px-4 py-2 rounded"
                      >
                        Submit Checklist
                      </button>
                    </div>
                  )}

                </div>

              )}

            </div>
          );
        })}

      </div>
    </div>
  );
}