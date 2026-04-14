import { deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "preact/hooks";
import { useAuth } from "../contexts/AuthContext";
import { firebaseFirestore } from "../firebase";
import useBorrowRequests from "../hooks/useBorrowRequest";
import type { BorrowRequest, Item } from "../types";
import { exportBorrowRequestsToCsv } from "../utils";
import PrintBorrowersForm from "./PrintBorrowersForm";

interface BorrowRequestsTableProps {
    darkMode: boolean;
}

export default function BorrowRequestsTable({ darkMode }: BorrowRequestsTableProps) {
    const db = firebaseFirestore;
    const { isAdmin } = useAuth();
    const { borrowRequests } = useBorrowRequests();

    // States
    const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
    const [requestEditData, setRequestEditData] = useState<BorrowRequest | null>(null);
    const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
    const [printId, setPrintId] = useState<string | null>(null);

    // Filter & Pagination
    const [dateFilter, setDateFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 100;

    useEffect(() => {
        setCurrentPage(1);
    }, [dateFilter]);

    // Filtered Requests
    const filteredRequests = useMemo(() => {
        if (dateFilter === 'all') return borrowRequests;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return borrowRequests.filter((request: BorrowRequest) => {
            const requestDate = request.date 
                ? new Date(request.date) 
                : (request.createdAt?.toDate?.() || new Date(0));

            const requestDay = new Date(
                requestDate.getFullYear(),
                requestDate.getMonth(),
                requestDate.getDate()
            );

            switch (dateFilter) {
                case 'daily': return requestDay.getTime() === today.getTime();
                case 'weekly': {
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    return requestDay >= weekStart && requestDay <= weekEnd;
                }
                case 'monthly':
                    return requestDate.getMonth() === now.getMonth() &&
                           requestDate.getFullYear() === now.getFullYear();
                default: return true;
            }
        });
    }, [borrowRequests, dateFilter]);

    // Sorted Requests (newest first)
    const sortedRequests = useMemo(() => {
        return [...filteredRequests].sort((a, b) => {
            const getDate = (req: BorrowRequest): Date => {
                if (req.createdAt?.toDate) return req.createdAt.toDate();
                if (req.timestamp?.toDate) return req.timestamp.toDate();
                return req.date ? new Date(req.date) : new Date(0);
            };
            return getDate(b).getTime() - getDate(a).getTime();
        });
    }, [filteredRequests]);

    const totalPages = Math.ceil(sortedRequests.length / ITEMS_PER_PAGE);

    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedRequests, currentPage]);

    // ==================== HELPER FUNCTIONS ====================
    const formatShortDate = (dateStr?: string): string => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? dateStr : date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getIntendedPeriod = (request: BorrowRequest): string => {
        if (request.startDate && request.returnDate) {
            const start = new Date(request.startDate);
            const end = new Date(request.returnDate);

            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const startFormatted = start.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                });
                const endFormatted = end.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric' 
                });
                return `${startFormatted} - ${endFormatted}`;
            }
        }

        if (request.period?.toString().trim()) {
            return request.period.toString().trim();
        }

        return "—";
    };

    const combineItems = (items: Item[] = []) =>
        items.map(item => item.particulars || "—").join("\n") || "—";

    const combineQuantities = (items: Item[] = []) =>
        items.map(item => item.quantity || "—").join("\n") || "—";

    const combineRemarks = (items: Item[] = []) =>
        items.map(item => item.remarks?.trim() || "—").join("\n") || "—";

    // ==================== ACTION HANDLERS ====================
    const updateRequestStatus = async (requestId: string, newStatus: 'Approved' | 'Returned') => {
        if (!requestId) return;
        setUpdatingRequestId(requestId);

        try {
            const updateData: Record<string, any> = {
                status: newStatus,
            };

            if (newStatus === 'Returned') {
                updateData.returnedAt = Timestamp.now();        // ← Recommended
                // updateData.returnedAt = serverTimestamp();   // Alternative (more accurate)
            }

            await updateDoc(doc(db, 'borrowRequests', requestId), updateData);
            
            console.log(`✅ Request ${requestId} marked as ${newStatus}`);
        } catch (error) {
            console.error("Error updating status:", error);
            alert(`Failed to update status to ${newStatus}. Please try again.`);
        } finally {
            setUpdatingRequestId(null);
        }
    };

    const handleApprove = (request: BorrowRequest) => {
        if (!request.id || request.status === 'Approved') return;
        if (!confirm(`Approve borrow request #${request.requestNo || request.id}?`)) return;
        updateRequestStatus(request.id, 'Approved');
    };

    const handleReturn = (request: BorrowRequest) => {
        if (!request.id || request.status === 'Returned') return;
        if (!confirm(`Mark request #${request.requestNo || request.id} as RETURNED?`)) return;
        updateRequestStatus(request.id, 'Returned');
    };

    const handlePrint = (id: string) => {
        setPrintId(id);
    };

    const handleEditClick = (request: BorrowRequest) => {
        setRequestEditData({ ...request });
        setEditingRequestId(request.id || null);
    };

    const cancelEditing = () => {
        setEditingRequestId(null);
        setRequestEditData(null);
    };

    const saveEditedRequest = async (requestId: string) => {
        if (!requestEditData) return;
        setUpdatingRequestId(requestId);

        try {
            await updateDoc(doc(db, 'borrowRequests', requestId), {
                requestNo: requestEditData.requestNo,
                date: requestEditData.date,
                requestor: requestEditData.requestor,
                purpose: requestEditData.purpose,
                startDate: requestEditData.startDate,
                returnDate: requestEditData.returnDate,
                period: requestEditData.period,
                items: requestEditData.items,
                status: requestEditData.status || 'Pending',
            });
            cancelEditing();
        } catch (error) {
            console.error("Error updating borrow request:", error);
            alert("Failed to save changes.");
        } finally {
            setUpdatingRequestId(null);
        }
    };

    const handleDeleteClick = async (request: BorrowRequest) => {
        if (!request.id || !confirm("Delete this borrow request?")) return;
        setUpdatingRequestId(request.id); 
        try {
            await deleteDoc(doc(db, 'borrowRequests', request.id));
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Failed to delete request.");
        } finally {
            setUpdatingRequestId(null);
        }
    };

    return (
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 sm:p-6 rounded-lg shadow-inner mt-8`}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>
                        Equipment / Material Borrow Requests
                    </h2>

                    <div className="flex flex-wrap gap-2">
                        {(['all', 'daily', 'weekly', 'monthly'] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setDateFilter(filter)}
                                className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    dateFilter === filter
                                        ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                                        : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {filter === 'all' && 'All'}
                                {filter === 'daily' && 'Today'}
                                {filter === 'weekly' && 'This Week'}
                                {filter === 'monthly' && 'This Month'} 
                                ({filteredRequests.length})
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {sortedRequests.length} request{sortedRequests.length !== 1 ? 's' : ''}
                    </div>
                    <button
                        onClick={() => exportBorrowRequestsToCsv(borrowRequests)}
                        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {sortedRequests.length === 0 ? (
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-center py-12 text-lg`}>
                    {dateFilter === 'all' 
                        ? 'No borrow requests submitted yet.' 
                        : `No requests found for this ${dateFilter} period.`}
                </p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                <tr>
                                    <th className="px-4 py-3 text-left border">Request No & Date</th>
                                    <th className="px-4 py-3 text-left border">Requestor</th>
                                    <th className="px-4 py-3 text-left border">Purpose</th>
                                    <th className="px-4 py-3 text-left border">Intended Period of Use</th>
                                    <th className="px-4 py-3 text-left border">Item</th>
                                    <th className="px-4 py-3 text-left border">Qty</th>
                                    <th className="px-4 py-3 text-left border">Remarks</th>
                                    <th className="px-4 py-3 text-left border">Status</th>
                                    {isAdmin && <th className="px-4 py-3 text-left border w-72">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                                {paginatedRequests.map((request: BorrowRequest) => (
                                    <tr
                                        key={request.id}
                                        className={`border-b transition-colors ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}
                                    >
                                        <td className="px-4 py-4 border">
                                            <div className="font-medium">{request.requestNo || '—'}</div>
                                            <div className="text-xs text-gray-500 mt-1">{formatShortDate(request.date)}</div>
                                        </td>
                                        <td className="px-4 py-4 border font-medium">{request.requestor || '—'}</td>
                                        <td className="px-4 py-4 border">{request.purpose || '—'}</td>

                                        <td className="px-4 py-4 border text-sm font-medium">
                                            {getIntendedPeriod(request)}
                                        </td>

                                        <td className="px-4 py-4 border whitespace-pre-line">{combineItems(request.items)}</td>
                                        <td className="px-4 py-4 border whitespace-pre-line font-medium">{combineQuantities(request.items)}</td>
                                        <td className="px-4 py-4 border whitespace-pre-line text-xs text-blue-600 dark:text-blue-400">
                                            {combineRemarks(request.items)}
                                        </td>

                                        <td className="px-4 py-4 border">
                                            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                                                request.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                request.status === 'Returned' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {request.status || 'Pending'}
                                            </span>
                                        </td>

                                        {isAdmin && (
                                            <td className="px-4 py-4 border">
                                                <div className="flex flex-wrap gap-2">
                                                    {/* APPROVE BUTTON with Maintenance Checklist Requirement */}
{(request.status === 'Pending' || !request.status) && (
    <button
        onClick={() => handleApprove(request)}
        disabled={
            updatingRequestId === request.id || 
            !request.hasMaintenanceChecklist   // ← Ito ang bagong condition
        }
        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
            !request.hasMaintenanceChecklist 
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
    >
        {request.hasMaintenanceChecklist ? 'Approve' : 'Waiting for Maintenance'}
    </button>
)}

                                                    {(request.status === 'Approved' || request.status === 'Returned') && (
  <div className="flex gap-2">

    {/* RETURN BUTTON (only if NOT returned yet) */}
    {request.status !== 'Returned' && (
      <button
        onClick={() => handleReturn(request)}
        disabled={updatingRequestId === request.id}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-medium"
      >
        Return
      </button>
    )}

    {/* UNDO BUTTON (only if already returned) */}
    {request.status === 'Returned' && (
      <button
        onClick={() => updateRequestStatus(request.id!, 'Approved')}
        disabled={updatingRequestId === request.id}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium"
      >
        Undo Return
      </button>
    )}

  </div>
)}
                                                    <button
                                                        onClick={() => handlePrint(request.id!)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                                                    >
                                                        Print Form
                                                    </button>

                                                    <button
                                                        onClick={() => handleEditClick(request)}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteClick(request)}
                                                        disabled={updatingRequestId === request.id}
                                                        className="bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white px-3 py-1 rounded text-xs font-medium"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 px-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`px-5 py-2 text-sm font-medium rounded-md ${
                                    currentPage === 1 
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                        : darkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                            >
                                ← Previous
                            </button>

                            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Page <span className="font-semibold">{currentPage}</span> of {totalPages}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`px-5 py-2 text-sm font-medium rounded-md ${
                                    currentPage === totalPages 
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                        : darkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* PRINT MODAL */}
            {printId && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-4xl max-h-[95vh] overflow-auto rounded-xl shadow-2xl">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                            <h3 className="font-semibold text-lg">Borrower's Form Preview</h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.print()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
                                >
                                    🖨 Print
                                </button>
                                <button
                                    onClick={() => setPrintId(null)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                        <PrintBorrowersForm id={printId} />
                    </div>
                </div>
            )}
        </div>
    );
}