import { useMemo } from "preact/hooks";
import useBorrowRequests from "../hooks/useBorrowRequest";

export default function EquipmentBorrowReport() {
  const { borrowRequests } = useBorrowRequests();

  // Approved + Returned only
  const filteredRequests = useMemo(() => {
    return borrowRequests.filter((req) => {
      const status = req.status?.toLowerCase().trim();
      return status === "approved" || status === "returned";
    });
  }, [borrowRequests]);

  // ================= FULL DATE FORMATTER =================
  const formatDate = (date?: any): string => {
    if (!date) return "—";

    // 1. Firestore Timestamp (pinakamahalaga ngayon)
    if (typeof date === "object" && date?.toDate) {
      try {
        return date.toDate().toLocaleString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return "—";
      }
    }

    // 2. ISO String or other string dates (para sa old data)
    if (typeof date === "string") {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }

    // 3. Fallback
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";

    return d.toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ================= SHORT DATE =================
  const formatShortDate = (date?: any): string => {
    if (!date) return "—";

    if (typeof date === "object" && date?.toDate) {
      return date.toDate().toLocaleDateString("en-PH", {
        month: "long",
        day: "numeric",
      });
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";

    return d.toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
    });
  };

  // ================= ITEMS =================
  const getItems = (req: any) => {
    const items = req.items || [];
    if (!items.length) return "—";

    return items
      .map((item: any) =>
        `${item.particulars || item.name || "—"} (${item.quantity ?? item.qty ?? 0})`
      )
      .join("\n");
  };

  const getQtyTotal = (req: any) => {
    const items = req.items || [];
    return items.reduce((sum: number, item: any) => {
      return sum + (Number(item.quantity ?? item.qty) || 0);
    }, 0);
  };

  // ================= GET RETURNED DATE =================
  const getReturnedDate = (req: any): any => {
    if (!req) return null;

    // Priority order — returnedAt ang pangunahin
    return (
      req.returnedAt ||
      req.dateReturned ||
      req.returnedAtDate ||
      req.returnedAtTimestamp ||
      req.returnedTimestamp ||
      req.actualReturnDate ||
      null
    );
  };

  // ================= CSV EXPORT =================
  const exportCSV = () => {
    const headers = [
      "Request No",
      "Date",
      "Requestor",
      "Purpose",
      "Intended Period",
      "Items",
      "Total Qty",
      "Date Returned",
    ];

    const rows = filteredRequests.map((req) => {
      const returnedDate = getReturnedDate(req);

      return [
        req.requestNo || "",
        formatDate(req.createdAt || req.date),
        req.requestor || "",
        req.purpose || "",
        `${formatShortDate(req.startDate)} - ${formatShortDate(req.returnDate)}`,
        getItems(req).replace(/\n/g, " | "),
        getQtyTotal(req),
        formatDate(returnedDate),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `borrow-report-${new Date().toISOString().slice(0, 10)}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Equipment Borrow Report</h1>

        <button
          onClick={exportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Export CSV
        </button>
      </div>

      {/* TABLE */}
      {filteredRequests.length === 0 ? (
        <p className="text-gray-500">No borrow requests found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Request No & Date</th>
                <th className="p-2 border">Requestor</th>
                <th className="p-2 border">Purpose</th>
                <th className="p-2 border">Intended Period</th>
                <th className="p-2 border">Items</th>
                <th className="p-2 border">Total Qty</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Date Returned</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map((req) => {
                const status = req.status?.toLowerCase().trim();
                const returnedDate = getReturnedDate(req);

                return (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="p-2 border">
                      <div className="font-medium">{req.requestNo || "—"}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(req.createdAt || req.date)}
                      </div>
                    </td>
                    <td className="p-2 border">{req.requestor || "—"}</td>
                    <td className="p-2 border">{req.purpose || "—"}</td>

                    <td className="p-2 border">
                      {formatShortDate(req.startDate)} - {formatShortDate(req.returnDate)}
                    </td>

                    <td className="p-2 border whitespace-pre-line">{getItems(req)}</td>
                    <td className="p-2 border text-center">{getQtyTotal(req)}</td>

                    <td className="p-2 border font-semibold">
                      {status === "returned" ? (
                        <span className="text-blue-600">Returned</span>
                      ) : (
                        <span className="text-green-600">Approved</span>
                      )}
                    </td>

                    <td className="p-2 border">
                      {formatDate(returnedDate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}