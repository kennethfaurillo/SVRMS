import { useMemo, useState, useEffect } from "preact/hooks";
import { doc, updateDoc, Timestamp, deleteDoc } from "firebase/firestore";
import { firebaseFirestore } from "../firebase";
import useBorrowRequests from "../hooks/useBorrowRequest";
import type { Equipment} from "../types";
import { useAuth } from "../contexts/AuthContext";
import useEquipment from "../hooks/useEquipment";

interface EquipmentTableProps {
  darkMode: boolean;
  onMarkReturned: (id: string, requestNo: string, requestor: string) => void;
  onMarkNotReturned: (id: string, requestNo: string, requestor: string) => void;
}

export default function EquipmentTable({ darkMode, onMarkReturned, onMarkNotReturned }: EquipmentTableProps) {
  const { equipment } = useEquipment();
  const { isAdmin } = useAuth();

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Equipment | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const ITEMS_PER_PAGE = 100;

  useEffect(() => {
  setCurrentPage(1);
}, [equipment, dateFilter]);

  const pastelColors = [
  { bg: "bg-blue-50", darkBg: "bg-blue-900/20", border: "border-blue-200", darkBorder: "border-blue-700" },
  { bg: "bg-green-50", darkBg: "bg-green-900/20", border: "border-green-200", darkBorder: "border-green-700" },
  { bg: "bg-purple-50", darkBg: "bg-purple-900/20", border: "border-purple-200", darkBorder: "border-purple-700" },
  { bg: "bg-yellow-50", darkBg: "bg-yellow-900/20", border: "border-yellow-200", darkBorder: "border-yellow-700" },
  { bg: "bg-pink-50", darkBg: "bg-pink-900/20", border: "border-pink-200", darkBorder: "border-pink-700" },
  { bg: "bg-indigo-50", darkBg: "bg-indigo-900/20", border: "border-indigo-200", darkBorder: "border-indigo-700" },
];
  
// 🔥 CONNECTED SOURCE: BorrowRequestsTable approved data
 const approvedEquipmentFiltered = useMemo(() => {

  const approved = equipment.filter(
    req => req.status === "Approved"
  );

  if (dateFilter === "all") return approved;

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return approved.filter((req) => {

    const requestDate = req.date
      ? new Date(req.date)
      : (req.createdAt?.toDate?.() || new Date(0));

    const requestDay = new Date(
      requestDate.getFullYear(),
      requestDate.getMonth(),
      requestDate.getDate()
    );

    switch (dateFilter) {

      case "daily":
        return requestDay.getTime() === today.getTime();

      case "weekly": {
        const weekStart = new Date(today);

        weekStart.setDate(
          today.getDate() - today.getDay()
        );

        const weekEnd = new Date(weekStart);

        weekEnd.setDate(
          weekStart.getDate() + 6
        );

        return (
          requestDay >= weekStart &&
          requestDay <= weekEnd
        );
      }

      case "monthly":
        return (
          requestDate.getMonth() === now.getMonth() &&
          requestDate.getFullYear() === now.getFullYear()
        );

      default:
        return true;
    }
  });

}, [equipment, dateFilter]);

const sorted = useMemo(() => {
  return [...approvedEquipmentFiltered].sort((a, b) => {
    const getDate = (req: Equipment): Date => {
      if (req.createdAt?.toDate) return req.createdAt.toDate();
      if (req.timestamp?.toDate) return req.timestamp.toDate();
      return new Date(0);
    };

    return getDate(b).getTime() - getDate(a).getTime();
  });
}, [approvedEquipmentFiltered]);

const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);

const paginatedRequests = useMemo(() => {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  return sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
}, [sorted, currentPage]);

  const handleEdit = (req: Equipment) => {
  setEditingId(req.id || null);
  setEditData(req);
};

const handleChange = (e: any) => {
  const { name, value } = e.target;

  setEditData((prev: any) => ({
    ...prev,
    [name]: value,
  }));
};

const cancelEdit = () => {
  setEditingId(null);
  setEditData(null);
};

const saveEdit = async (id: string) => {
  if (!editData) return;

  setLoadingId(id);

  try {
    await updateDoc(doc(firebaseFirestore, "borrowRequests", id), {
      requestor: editData.requestor,
      purpose: editData.purpose,
      items: editData.items,
      dateReturned:
  editData.status === "Returned"
    ? new Date().toISOString()
    : null,
    });

    cancelEdit();
  } catch (err) {
    console.error(err);
    alert("Failed to update request.");
  } finally {
    setLoadingId(null);
  }
};

const handleDelete = async (req: Equipment) => {
  if (!req.id) return;

  const confirmDelete = confirm("Delete this request?");
  if (!confirmDelete) return;

  setLoadingId(req.id);

  try {
    await deleteDoc(doc(firebaseFirestore, "borrowRequests", req.id));
  } catch (err) {
    console.error(err);
    alert("Failed to delete request.");
  } finally {
    setLoadingId(null);
  }
};

  return (
    <div className={`p-4 rounded-lg mt-6 ${darkMode ? "bg-gray-700 text-white" : "bg-gray-50 text-gray-900"}`}>
      
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">

  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">

    <h2 className="text-xl font-bold">
      Equipment Return Monitoring
    </h2>

    <div className="flex flex-wrap gap-2">

      {(['all', 'daily', 'weekly', 'monthly'] as const).map((filter) => (

        <button
          key={filter}
          onClick={() => setDateFilter(filter)}
          className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
            dateFilter === filter
              ? 'bg-blue-600 text-white'
              : darkMode
              ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >

          {filter === 'all' && 'All'}
          {filter === 'daily' && 'Today'}
          {filter === 'weekly' && 'This Week'}
          {filter === 'monthly' && 'This Month'}

          ({approvedEquipmentFiltered.length})

        </button>

      ))}

    </div>

  </div>

</div>

      {paginatedRequests.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          No approved equipment from Borrow Requests.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            
            <thead className={darkMode ? "bg-gray-600" : "bg-gray-100"}>
              <tr>
                <th className="border px-3 py-2 text-left">Request No. & Date</th>
                <th className="border px-3 py-2 text-left">Requestor</th>
                <th className="border px-3 py-2 text-left">Purpose</th>
                <th className="border px-3 py-2 text-left">Items</th>
                <th className="border px-3 py-2 text-left">Location</th>
                <th className="border px-3 py-2 text-left">Status</th>
                {isAdmin && (
                  <th className="border px-3 py-2 text-left">Action</th>
                )}
              </tr>
            </thead>

            <tbody>
              {paginatedRequests.map((req, index) => (
                <tr
                  key={req.id}
                  className={`
                    ${pastelColors[index % pastelColors.length].bg}
                    ${darkMode ? pastelColors[index % pastelColors.length].darkBg : ""}
                    border-l-4
                    ${darkMode ? pastelColors[index % pastelColors.length].darkBorder : pastelColors[index % pastelColors.length].border}transition-opacity duration-200
                  `}
                >

                 <td className="border px-3 py-2 font-medium">
                    {req.requestNo}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {req.date ? new Date(req.date).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      }) : '—'}
                    </div>
                  </td>

                  <td className="border px-3 py-2">
                    {editingId === req.id ? (
                      <input
                        name="requestor"
                        value={editData?.requestor || ""}
                        onChange={handleChange}
                        className="border px-2 py-1 w-full"
                      />
                    ) : (
                      req.requestor
                    )}
                  </td>

              <td className="border px-3 py-2">
                    {editingId === req.id ? (
                      <input
                        name="purpose"
                        value={editData?.purpose || ""}
                        onChange={handleChange}
                        className="border px-2 py-1 w-full"
                      />
                    ) : (
                      req.purpose
                    )}
                  </td>

                <td className="border px-3 py-2">
                    {editingId === req.id ? (
                      <input
                        name="items"
                        value={editData?.items?.map(i => i.particulars).join(", ") || ""}
                        onChange={handleChange}
                        className="border px-2 py-1 w-full"
                      />
                    ) : (
                      req.items?.map(i => i.particulars).join(", ")
                    )}
                  </td>

                  <td className="border px-3 py-2">
                    {editingId === req.id ? (
                      <input
                        name="location"
                        value={editData?.items?.map(i => i.location).join(", ") || ""}
                        onChange={handleChange}
                        className="border px-2 py-1 w-full"
                      />
                    ) : (
                      req.items?.map(i => i.location).join(", ")
                    )}
                  </td>

                  <td className="border px-3 py-2">
                    {editingId === req.id ? (
                      <select
                        name="status"
                        value={editData?.status || ""}
                        onChange={handleChange}
                        className="border px-2 py-1 w-full"
                      >
                       <option value="Returned">Returned</option>
                      <option value="Not Returned">Not Returned</option>
                      </select>
                    ) : (
                     <span className={
                        (req.dateReturned ? "Returned" : "Not Returned") === "Returned"
                          ? "text-green-600 font-semibold"
                          : "text-red-500 font-semibold"
                      }>
                        {req.dateReturned ? "Returned" : "Not Returned"}
                      </span>
                    )}
                  </td>


                 {isAdmin && (
                      <td className="border px-3 py-2">
                        {editingId === req.id ? (
                          // ✅ EDIT MODE (same concept sa TripsTable)
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(req.id!)}
                              disabled={loadingId === req.id}
                            className="px-2 sm:px-3 py-1 rounded-md text-xs transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                            >
                              Save
                            </button>

                            <button
                              onClick={cancelEdit}
                              className="px-2 sm:px-3 py-1 rounded-md text-xs transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md bg-gray-500 text-white hover:bg-gray-600 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          // ✅ NORMAL MODE
                          <div className="flex gap-2">

                            {/* EDIT BUTTON (IBINALIK NA) */}
                            <button
                              onClick={() => handleEdit(req)}
                            className="px-2 sm:px-3 py-1 rounded-md text-xs transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                            >
                              Edit
                            </button>

                            {/* RETURN / NOT RETURN */}
                            {!req.dateReturned ? (
                              <button
                               onClick={async () => {
                                  if (!req.id) return;
                                  setLoadingId(req.id);
                                  await onMarkReturned(req.id, req.requestNo, req.requestor);
                                  setLoadingId(null);
                                }}
                                className="px-2 sm:px-3 py-1 rounded-md text-xs transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md bg-green-500 text-white hover:bg-green-600 cursor-pointer"
                              >
                                Mark As Returned
                              </button>
                            ) : (
                              <button
                               onClick={async () => {
                                  if (!req.id) return;
                                  setLoadingId(req.id);
                                  await onMarkNotReturned(req.id, req.requestNo, req.requestor);
                                  setLoadingId(null);
                                }}
                                className="px-2 sm:px-3 py-1 rounded-md text-xs transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md bg-yellow-500 text-white hover:bg-yellow-600 cursor-pointer"
                              >
                                Mark As Not Returned
                              </button>
                            )}

                            {/* DELETE */}
                            <button
                              onClick={() => handleDelete(req)}
                              className="px-2 sm:px-3 py-1 rounded-md text-xs transition-all duration-150 ease-in-out transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                            >
                              Delete
                            </button>

                          </div>
                        )}
                      </td>
                    )}

                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}
       {totalPages > 1 && (
  <div className="flex items-center justify-between mt-6 px-2">

    <button
      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
      disabled={currentPage === 1}
      className={`px-5 py-2 text-sm font-medium rounded-md ${
        currentPage === 1
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : darkMode
          ? "bg-gray-600 hover:bg-gray-500 text-gray-200"
          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
      }`}
    >
      ← Previous
    </button>

    <div className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
      Page <span className="font-semibold">{currentPage}</span> of {totalPages}
    </div>

    <button
      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
      disabled={currentPage === totalPages}
      className={`px-5 py-2 text-sm font-medium rounded-md ${
        currentPage === totalPages
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : darkMode
          ? "bg-gray-600 hover:bg-gray-500 text-gray-200"
          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
      }`}
    >
      Next →
    </button>

  </div>
)}
    </div>
  );
}