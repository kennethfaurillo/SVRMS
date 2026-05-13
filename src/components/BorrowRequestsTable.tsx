import { deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "preact/hooks";
import { useAuth } from "../contexts/AuthContext";
import { firebaseFirestore } from "../firebase";
import useBorrowRequests from "../hooks/useBorrowRequest";
import type { BorrowRequest, Item } from "../types";
import { exportBorrowRequestsToCsv } from "../utils";
import PrintBorrowersForm from "./PrintBorrowersForm";
import GatePass from "./GatePass";   // ← Siguraduhing may file ito
import EquipApproveModal from "./EquipApproveModal";

interface BorrowRequestsTableProps {
    darkMode: boolean;
}

const EQUIPMENT_OPTIONS = [
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
  "Butt Fusion Machine",
  "Cement Mixer 1",
  "Cement Mixer 2",
  "Chainsaw",
  "Fusion Machine",
  "Grease Pump",
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

export default function BorrowRequestsTable({ darkMode }: BorrowRequestsTableProps) {
    const db = firebaseFirestore;
    const { isAdmin } = useAuth();
    const { borrowRequests } = useBorrowRequests();

    // States
    const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
    const [requestEditData, setRequestEditData] = useState<BorrowRequest | null>(null);
    const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
    const [printId, setPrintId] = useState<string | null>(null);
    const [selectedGatePass, setSelectedGatePass] = useState<BorrowRequest | null>(null);

    const [showApproveModal, setShowApproveModal] = useState(false);
const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
    // Filter & Pagination
    const [dateFilter, setDateFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 100;

    const pastelColors = [
    { bg: 'bg-blue-50', darkBg: 'bg-blue-900/20', border: 'border-blue-200', darkBorder: 'border-blue-700' },
    { bg: 'bg-green-50', darkBg: 'bg-green-900/20', border: 'border-green-200', darkBorder: 'border-green-700' },
    { bg: 'bg-purple-50', darkBg: 'bg-purple-900/20', border: 'border-purple-200', darkBorder: 'border-purple-700' },
    { bg: 'bg-yellow-50', darkBg: 'bg-yellow-900/20', border: 'border-yellow-200', darkBorder: 'border-yellow-700' },
    { bg: 'bg-pink-50', darkBg: 'bg-pink-900/20', border: 'border-pink-200', darkBorder: 'border-pink-700' },
    { bg: 'bg-indigo-50', darkBg: 'bg-indigo-900/20', border: 'border-indigo-200', darkBorder: 'border-indigo-700' }
];

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
                case 'daily': 
                    return requestDay.getTime() === today.getTime();
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
                default: 
                    return true;
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

    // ==================== HELPER FUNCTIONS (Hindi ko ginagalaw) ====================
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
                const startFormatted = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                const endFormatted = end.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
                return `${startFormatted} - ${endFormatted}`;
            }
        }
        if (request.period?.toString().trim()) return request.period.toString().trim();
        return "—";
    };

    const combineItems = (items: Item[] = []) =>
    items.map(item => item.particulars || "—").join("\n") || "—";

    const combineQuantities = (items: Item[] = []) =>
    items.map(item => item.quantity || "—").join("\n") || "—";

    const combineUnits = (items: Item[] = []) =>
    items.map(item => item.unit || "—").join("\n") || "—";

    const combineLocations = (items: Item[] = []) =>
    items.map(item => item.location || "—").join("\n") || "—";

    const combineRemarks = (items: Item[] = []) =>
    items.map(item => item.remarks?.trim() || "—").join("\n") || "—";

    // ==================== ACTION HANDLERS ====================
    const updateRequestStatus = async (requestId: string, newStatus: 'Approved'  | 'Cancelled' | 'Rescheduled') => {
        if (!requestId) return;
        setUpdatingRequestId(requestId);

        try {
            const updateData: Record<string, any> = { status: newStatus };
            await updateDoc(doc(db, 'borrowRequests', requestId), updateData);
        } catch (error) {
            console.error("Error updating status:", error);
            alert(`Failed to update status to ${newStatus}. Please try again.`);
        } finally {
            setUpdatingRequestId(null);
        }
    };

   const handleApproveClick = (request: BorrowRequest) => {
    if (!request.id || request.status === 'Approved') return;

    setSelectedRequest(request);
    setShowApproveModal(true);
};

    const handlePrintForm = (id: string) => setPrintId(id);
    const handlePrintGatePass = (request: BorrowRequest) => setSelectedGatePass(request);

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

        const handleBorrowEditChange=(e:any)=>{
        const {name,value}=e.target;

        setRequestEditData(prev=>{
        if(!prev) return null;

        return{
        ...prev,
        [name]:value
        };
        });
        };

    const handleSaveEdit = async () => {
    if (!editingRequestId || !requestEditData) return;

    try {
      await updateDoc(doc(db, "borrowRequests", editingRequestId), {
    requestor: requestEditData.requestor ?? "",
    purpose: requestEditData.purpose ?? "",
    date: requestEditData.date ?? "",
    period: requestEditData.period ?? "",
    items: (requestEditData.items || []).map(item => ({
        particulars: item.particulars ?? "",
        quantity: item.quantity ?? "",
           unit: item.unit ?? "",
         location: item.location ?? "",
        remarks: item.remarks ?? ""
    })),
    status: requestEditData.status ?? "Pending",
    updatedAt: Timestamp.now(),
});

        setEditingRequestId(null);
        setRequestEditData(null);
    } catch (error) {
        console.error("Error updating request:", error);
        alert("Failed to update request.");
    }
};

    return (
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 sm:p-6 rounded-lg shadow-inner mt-8`}>
            {/* Header*/}
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
                                    <th className="px-4 py-3 text-left border">Unit</th>
                                    <th className="px-4 py-3 text-left border">Location</th>
                                    <th className="px-4 py-3 text-left border">Remarks</th>
                                    <th className="px-4 py-3 text-left border">Status</th>
                                    {isAdmin && <th className="px-4 py-3 text-left border w-80">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                               {paginatedRequests.map((request: BorrowRequest, index) => (
                                   <tr
                                    key={request.id}
                                    className={`
                                        ${darkMode ? pastelColors[index % pastelColors.length].darkBg : pastelColors[index % pastelColors.length].bg}
                                        border-l-4
                                        ${darkMode ? pastelColors[index % pastelColors.length].darkBorder : pastelColors[index % pastelColors.length].border}
                                        transition-colors
                                        ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}
                                    `}
                                >
                                        <td className="px-4 py-4 border">
                                            <div className="font-medium">{request.requestNo || '—'}</div>
                                            <div className="text-xs text-gray-500 mt-1">{formatShortDate(request.date)}</div>
                                        </td>
                                        <td className="px-4 py-4 border font-medium">
                                            {editingRequestId===request.id ? (
                                            <input
                                            name="requestor"
                                            value={requestEditData?.requestor || ""}
                                            onChange={handleBorrowEditChange}
                                            className="border px-2 py-1 w-full"
                                            />
                                            ):(
                                            request.requestor || "—"
                                            )}
                                            </td>
                                        <td className="px-4 py-4 border">
                                                {editingRequestId===request.id ?(
                                                <input
                                                name="purpose"
                                                value={requestEditData?.purpose || ""}
                                                onChange={handleBorrowEditChange}
                                                className="border px-2 py-1 w-full"
                                                />
                                                ):(
                                                request.purpose || "—"
                                                )}
                                                </td>
                                       <td className="px-4 py-4 border text-sm font-medium">
                                            {editingRequestId===request.id ?(
                                            <input
                                            name="period"
                                            value={requestEditData?.period || ""}
                                            onChange={handleBorrowEditChange}
                                            className="border px-2 py-1 w-full"
                                            />
                                            ):(
                                            getIntendedPeriod(request)
                                            )}
                                            </td>
                                      <td className="px-4 py-4 border">
                                                {editingRequestId===request.id ? (
                                                <div className="space-y-2">
                                                {requestEditData?.items?.map((item,index)=>(
                                                <select
                                                value={item.particulars || ""}
                                                onChange={(e) => {
                                                    const updated = [...(requestEditData?.items || [])];

                                                    updated[index] = {
                                                    ...updated[index],
                                                    particulars: e.currentTarget.value
                                                    };

                                                    setRequestEditData({
                                                    ...requestEditData!,
                                                    items: updated
                                                    });
                                                }}
                                                className="border px-2 py-1 w-full text-xs"
                                                >
                                                <option value="">-- Select Item --</option>

                                                {EQUIPMENT_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>
                                                    {opt}
                                                    </option>
                                                ))}
                                                </select>
                                                ))}
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                    setRequestEditData(prev => {
                                                        if (!prev) return null;

                                                        return {
                                                        ...prev,
                                                        items: [
                                                            ...(prev.items || []),
                                                            { particulars: "", quantity: "", unit: "", location: "", remarks: "" }
                                                        ]
                                                        };
                                                    });
                                                    }}
                                                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded mt-2"
                                                >
                                                    + Add Item
                                                </button>
                                                                                                </div>
                                                ):(
                                                <div className="whitespace-pre-line">
                                                {combineItems(request.items)}
                                                </div>
                                                )}
                                                </td>
                                        <td className="px-4 py-4 border">
                                                {editingRequestId===request.id ?(
                                                <div className="space-y-2">
                                                {requestEditData?.items?.map((item,index)=>(
                                                <input
                                                key={index}
                                                type="number"
                                                value={item.quantity || ""}
                                                onChange={(e)=>{
                                                const updated=[...(requestEditData?.items||[])];

                                                updated[index]={
                                                ...updated[index],
                                               quantity:e.currentTarget.value
                                                };

                                                setRequestEditData({
                                                ...requestEditData!,
                                                items:updated
                                                });
                                                }}
                                                className="border px-2 py-1 w-full text-xs"
                                                />
                                                ))}
                                                </div>
                                                ):(
                                                <div className="whitespace-pre-line font-medium">
                                                {combineQuantities(request.items)}
                                                </div>
                                                )}
                                                </td>
                                                <td className="px-4 py-4 border">
                                                {editingRequestId===request.id ?(
                                                    <div className="space-y-2">
                                                    {requestEditData?.items?.map((item,index)=>(
                                                        <select
                                                        key={index}
                                                        value={item.unit || ""}
                                                        onChange={(e)=>{
                                                            const updated=[...(requestEditData?.items||[])];

                                                            updated[index]={
                                                            ...updated[index],
                                                            unit:e.currentTarget.value
                                                            };

                                                            setRequestEditData({
                                                            ...requestEditData!,
                                                            items:updated
                                                            });
                                                        }}
                                                        className="border px-2 py-1 w-full text-xs"
                                                        >
                                                      <option value="">-- Select Unit --</option>
                                                        <option value="Set">Set</option>
                                                        <option value="Pc">Pc</option>
                                                        <option value="Lot">Lot</option>
                                                        </select>
                                                    ))}
                                                    </div>
                                                ):(
                                                    <div className="whitespace-pre-line font-medium">
                                                    {combineUnits(request.items)}
                                                    </div>
                                                )}
                                                </td>
                                                <td className="px-4 py-4 border">
                                                {editingRequestId===request.id ?(
                                                    <div className="space-y-2">
                                                    {requestEditData?.items?.map((item,index)=>(
                                                        <input
                                                        key={index}
                                                        type="text"
                                                        value={item.location || ""}
                                                        onChange={(e)=>{
                                                            const updated=[...(requestEditData?.items||[])];

                                                            updated[index]={
                                                            ...updated[index],
                                                            location:e.currentTarget.value
                                                            };

                                                            setRequestEditData({
                                                            ...requestEditData!,
                                                            items:updated
                                                            });
                                                        }}
                                                        className="border px-2 py-1 w-full text-xs"
                                                        />
                                                    ))}
                                                    </div>
                                                ):(
                                                    <div className="whitespace-pre-line text-xs">
                                                    {combineLocations(request.items)}
                                                    </div>
                                                )}
                                                </td>
                                        <td className="px-4 py-4 border">
                                                {editingRequestId===request.id ?(
                                                <div className="space-y-2">
                                                {requestEditData?.items?.map((item,index)=>(
                                                <input
                                                key={index}
                                                type="text"
                                                value={item.remarks || ""}
                                                onChange={(e)=>{
                                                const updated=[...(requestEditData?.items||[])];

                                                updated[index]={
                                                ...updated[index],
                                                remarks:e.currentTarget.value
                                                };

                                                setRequestEditData({
                                                ...requestEditData!,
                                                items:updated
                                                });
                                                }}
                                                className="border px-2 py-1 w-full text-xs"
                                                />
                                                ))}
                                                </div>
                                                ):(
                                                <div className="whitespace-pre-line text-xs text-blue-600 dark:text-blue-400">
                                                {combineRemarks(request.items)}
                                                </div>
                                                )}
                                                </td>

                                       <td className="px-4 py-4 border">
                                                {editingRequestId === request.id ? (
                                                    <select
                                                    name="status"
                                                    value={requestEditData?.status || "Pending"}
                                                    onChange={handleBorrowEditChange}
                                                    className="border px-2 py-1 w-full"
                                                    >
                                                   <option value="Pending">Pending</option>
                                                  <option value="Approved">Approved</option>
                                                  <option value="Cancelled">Cancelled</option>
                                                  <option value="Rescheduled">Rescheduled</option>
                                                    </select>
                                                ) : (
                                                   <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                                                        request.status === 'Approved'
                                                        ? 'bg-green-100 text-green-700'
                                                        : request.status === 'Cancelled'
                                                        ? 'bg-red-100 text-red-700'
                                                        : request.status === 'Rescheduled'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                    {request.status || 'Pending'}
                                                    </span>
                                                )}
                                                </td>

                                        {isAdmin && (
                                            <td className="px-4 py-4 border">
                                                <div className="flex flex-wrap gap-2">
                                                   {editingRequestId===request.id ? (
                                                        <>
                                                        <button
                                                        onClick={handleSaveEdit}
                                                       className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 hover:shadow-md"
                                                        >
                                                        Save
                                                        </button>

                                                        <button
                                                        onClick={()=>{
                                                        setEditingRequestId(null);
                                                        setRequestEditData(null);
                                                        }}
                                                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 hover:shadow-md"
                                                        >
                                                        Cancel
                                                        </button>
                                                        </>
                                                        ):(
                                                        <button
                                                        onClick={()=>{
                                                        setEditingRequestId(request.id!);
                                                        setRequestEditData(request);
                                                        }}
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 hover:shadow-md"
                                                        >
                                                        Update
                                                        </button>
                                                        )}
                                                    {/* APPROVE BUTTON */}
                                                    {(request.status === 'Pending' || !request.status) && (
                                                        <button
                                                           onClick={() => handleApproveClick(request)}
                                                            disabled={updatingRequestId === request.id}
                                                           className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 hover:shadow-md"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}

                                                    {/* GATE PASS*/}
                                                    {request.status === 'Approved' && (
                                                        <button
                                                            onClick={() => handlePrintGatePass(request)}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 hover:shadow-md"
                                                        >
                                                            Gate Pass
                                                        </button>
                                                    )}
                                                    {/* Print Form + Delete - Sa ibaba */}
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => handlePrintForm(request.id!)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 hover:shadow-md"
                                                        >
                                                            Print Form
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteClick(request)}
                                                            disabled={updatingRequestId === request.id}
                                                            className="bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white px-3 py-1 rounded text-xs font-medium cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 hover:shadow-md"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Hindi ko ginagalaw */}
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

            {/* PRINT FORM MODAL */}
            {printId && (
                <div
  className="fixed inset-0 flex items-center justify-center z-50 p-4"
  style={{ background: "rgba(0,0,0,0.6)" }}
>
                    <div className="bg-white w-full max-w-4xl max-h-[95vh] overflow-auto rounded-xl shadow-2xl">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                            <h3 className="font-semibold text-lg">Borrower's Form Preview</h3>
                            <div className="flex gap-3">
                                <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium">
                                    🖨 Print
                                </button>
                                <button onClick={() => setPrintId(null)} className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium">
                                    Close
                                </button>
                            </div>
                        </div>
                        <PrintBorrowersForm id={printId} />
                    </div>
                </div>
            )}

            {/* GATE PASS MODAL */}
            {selectedGatePass && (
                <GatePass 
                    request={selectedGatePass} 
                    onClose={() => setSelectedGatePass(null)} 
                />
            )}

           <EquipApproveModal
                    isOpen={showApproveModal}
                    title="Approve Borrow Request"
                    description="Review request details before approving."
                    confirmText="Approve"
                    cancelText="Cancel"
                    onCancel={() => {
                        setShowApproveModal(false);
                        setSelectedRequest(null);
                    }}
                    onConfirm={() => {
                        if (selectedRequest?.id) {
                            updateRequestStatus(selectedRequest.id, "Approved");
                        }
                        setShowApproveModal(false);
                        setSelectedRequest(null);
                    }}
                >
                    {selectedRequest && (
                        <div className="space-y-4 text-sm">

                            {/* BASIC INFO */}
                            <div className="border-b pb-2">
                                <p><b>Request No:</b> {selectedRequest.requestNo || "—"}</p>
                                <p><b>Requestor:</b> {selectedRequest.requestor}</p>
                                <p><b>Purpose:</b> {selectedRequest.purpose}</p>
                                <p><b>Status:</b> {selectedRequest.status || "Pending"}</p>
                            </div>

                            {/* INTENDED PERIOD */}
                            <div>
                                <p className="font-semibold mb-1">Intended Period</p>
                                <p className="text-gray-700">
                                   {getIntendedPeriod(selectedRequest)}
                                </p>
                            </div>

                            {/* ITEMS TABLE */}
                            <div>
                                <p className="font-semibold mb-1">Items</p>

                                <div className="overflow-x-auto border rounded-md">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="p-2 text-left">Item</th>
                                                <th className="p-2 text-left">Qty</th>
                                                <th className="p-2 text-left">Unit</th>
                                                <th className="p-2 text-left">Location</th>
                                                <th className="p-2 text-left">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(selectedRequest.items || []).map((item, idx) => (
                                                <tr key={idx} className="border-t">
                                                    <td className="p-2">{item.particulars || "—"}</td>
                                                 <td className="p-2">{item.quantity || "—"}</td>
                                                <td className="p-2">{item.unit || "—"}</td>
                                                <td className="p-2">{item.location || "—"}</td>
                                                <td className="p-2 text-gray-600">{item.remarks || "—"}</td>
                                                </tr>
                                            ))}

                                            {(!selectedRequest.items || selectedRequest.items.length === 0) && (
                                                <tr>
                                                    <td colSpan={3} className="p-2 text-center text-gray-400">
                                                        No items found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}
                </EquipApproveModal>
                            
        </div>
    );
}