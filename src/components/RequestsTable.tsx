import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useMemo, useState } from "preact/hooks";
import { REQUEST_STATUSES } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import { firebaseFirestore } from "../firebase";
import { useConstants } from "../hooks/useConstants";
import useRequests from "../hooks/useRequests";
import type { Request } from "../types";
import { exportToCsv, getCurrentDate, getCurrentTime } from "../utils";
import TripTicketModal from "./TripTicketModal";

interface RequestsTableProps {
    darkMode: boolean;
    handleApproveClick: (request: Request) => void;
}

export default function RequestsTable({
    darkMode,
    handleApproveClick
}: RequestsTableProps) {
    const db = firebaseFirestore;

    // Editing states
    const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
    const [requestEditData, setRequestEditData] = useState<Request | null>(null);
    const [showTripTicket, setShowTripTicket] = useState(false);
    const [editableRequest, setEditableRequest] = useState<Request | null>(null);
    const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

    // Filter & Pagination
    const [dateFilter, setDateFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 100;

    const { isAdmin } = useAuth();
    const { requests } = useRequests();
    const { serviceVehicles, departments } = useConstants();

    const filteredRequests = useMemo(() => {
        if (dateFilter === 'all') return requests;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return requests.filter(request => {
            const requestDate = request.requestedDateTime ? new Date(request.requestedDateTime) : new Date(0);
            const requestDay = new Date(requestDate.getFullYear(), requestDate.getMonth(), requestDate.getDate());

            switch (dateFilter) {
                case 'daily':
                    return requestDay.getTime() === today.getTime();
                case 'weekly':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    return requestDay >= weekStart && requestDay <= weekEnd;
                case 'monthly':
                    return requestDate.getMonth() === now.getMonth() && requestDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    }, [requests, dateFilter]);

    const sortedRequests = useMemo(() => [...filteredRequests].sort((a, b) => {
        const dateA = a.timestamp ? a.timestamp.toDate() : new Date(0);
        const dateB = b.timestamp ? b.timestamp.toDate() : new Date(0);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime(); // Most recent first
        }
        const statusOrder: { [key in typeof REQUEST_STATUSES[number]]: number } = {
            'Pending': 1,
            'Approved': 2,
            'Rescheduled': 3,
            'Cancelled': 4
        };
        const statusA = statusOrder[a.status] || 99;
        const statusB = statusOrder[b.status] || 99;
        return statusA - statusB;
    }), [filteredRequests]);

    // Pagination calculations
    const totalPages = Math.ceil(sortedRequests.length / ITEMS_PER_PAGE);

    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [sortedRequests, currentPage]);

    // Reset to page 1 when filter changes
    useMemo(() => {
        setCurrentPage(1);
    }, [dateFilter]);

    const getFilterCount = (filter: typeof dateFilter) => {
        if (filter === 'all') return requests.length;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return requests.filter(request => {
            const requestDate = request.requestedDateTime ? new Date(request.requestedDateTime) : new Date(0);
            const requestDay = new Date(requestDate.getFullYear(), requestDate.getMonth(), requestDate.getDate());

            switch (filter) {
                case 'daily':
                    return requestDay.getTime() === today.getTime();
                case 'weekly':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    return requestDay >= weekStart && requestDay <= weekEnd;
                case 'monthly':
                    return requestDate.getMonth() === now.getMonth() && requestDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        }).length;
    };

    const pastelColors = [
        { bg: 'bg-blue-50', darkBg: 'bg-blue-900/20', border: 'border-blue-200', darkBorder: 'border-blue-700' },
        { bg: 'bg-green-50', darkBg: 'bg-green-900/20', border: 'border-green-200', darkBorder: 'border-green-700' },
        { bg: 'bg-purple-50', darkBg: 'bg-purple-900/20', border: 'border-purple-200', darkBorder: 'border-purple-700' },
        { bg: 'bg-yellow-50', darkBg: 'bg-yellow-900/20', border: 'border-yellow-200', darkBorder: 'border-yellow-700' },
        { bg: 'bg-pink-50', darkBg: 'bg-pink-900/20', border: 'border-pink-200', darkBorder: 'border-pink-700' },
        { bg: 'bg-indigo-50', darkBg: 'bg-indigo-900/20', border: 'border-indigo-200', darkBorder: 'border-indigo-700' }
    ];

    const handleUpdateClick = (request: Request) => {
        if (request?.id) {
            setRequestEditData(request);
            setEditingRequestId(request.id);
        }
    };

    const cancelRequestEditing = () => {
        setEditingRequestId(null);
        setRequestEditData(null);
    };

    const handleDeleteClick = async (request: Request) => {
        if (!request.id) return;
        setUpdatingRequestId(request.id);
        try {
            await deleteDoc(doc(db, 'requests', request.id));
        } catch (error) {
            console.error("Error deleting document:", error);
        } finally {
            setUpdatingRequestId(null);
        }
    };

    const handleRequestEditDataChange = (e: any) => {
        const { name, value } = e.target;
        setRequestEditData(prevData => {
            if (!prevData) return null;
            const newData: Request = { ...prevData };
            (newData as any)[name] = value;
            return newData;
        });
    };

    const saveEditedRequest = async (requestId: string) => {
        if (!db || !requestEditData) return;

        setUpdatingRequestId(requestId);
        try {
            const dataToUpdate = {
                requestedVehicle: requestEditData.requestedVehicle,
                requesterName: requestEditData.requesterName,
                department: requestEditData.department,
                passengers: requestEditData.passengers || [],
                isDriverRequested: requestEditData.isDriverRequested,
                delegatedDriverName: requestEditData.delegatedDriverName ?? null,
                purpose: requestEditData.purpose,
                destination: requestEditData.destination,
                requestedDateTime: requestEditData.requestedDateTime,
                estimatedArrival: requestEditData.estimatedArrival,
                status: requestEditData.status,
                remarks: requestEditData.remarks,
                completedDate: null,
            };

            await updateDoc(doc(db, `requests`, requestId), dataToUpdate);
            setEditingRequestId(null);
            setRequestEditData(null);
        } catch (error) {
            console.error("Error updating request:", error);
        } finally {
            setUpdatingRequestId(null);
        }
    };

    // Pagination handlers
    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    return (
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 sm:p-6 rounded-lg shadow-inner mt-8`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>All Requests</h2>

                    {/* Date Filter Buttons */}
                    <div className="flex flex-wrap gap-2">
                        {(['all', 'daily', 'weekly', 'monthly'] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setDateFilter(filter)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition duration-150 ease-in-out ${dateFilter === filter
                                    ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                                    : darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    } cursor-pointer`}
                            >
                                {filter === 'all' && 'All'}
                                {filter === 'daily' && 'Today'}
                                {filter === 'weekly' && 'This Week'}
                                {filter === 'monthly' && 'This Month'} ({getFilterCount(filter)})
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
                    </div>
                    <button
                        onClick={() => exportToCsv(requests)}
                        className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out cursor-pointer"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {filteredRequests.length === 0 ? (
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-center py-8`}>
                    {dateFilter === 'all' ? 'No requests submitted yet.' : `No requests found for ${dateFilter} view.`}
                </p>
            ) : (
                <>
                    <div className="h-[calc(100vh-375px)] overflow-y-scroll overflow-x-hidden">
                        <table className="min-w-full border-collapse">
                            <thead className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                <tr>
                                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 rounded-tl-md">Request Details</th>
                                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 hidden sm:table-cell">Personnel</th>
                                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 hidden md:table-cell">Department</th>
                                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 hidden md:table-cell">Passengers</th>
                                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Purpose</th>
                                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 hidden lg:table-cell">Destination</th>
                                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Status</th>
                                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 hidden xl:table-cell">Remarks</th>
                                    <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 hidden lg:table-cell">Timestamp</th>
                                    {isAdmin && (
                                        <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 rounded-tr-md">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRequests.map((request: Request, requestIndex) => {
                                    const colorScheme = pastelColors[requestIndex % pastelColors.length];

                                    return (
                                        <tr key={request.id} className={`${darkMode ? colorScheme.darkBg : colorScheme.bg} border-l-4 ${darkMode ? colorScheme.darkBorder : colorScheme.border} hover:opacity-80 transition-opacity duration-200`}>
                                            {/* Request Details */}
                                            <td className={`px-2 sm:px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                {editingRequestId === request.id ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="datetime-local"
                                                            name="requestedDateTime"
                                                            value={requestEditData?.requestedDateTime || ''}
                                                            onChange={handleRequestEditDataChange}
                                                            className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                        />
                                                        <input
                                                            type="time"
                                                            name="estimatedArrival"
                                                            value={requestEditData?.estimatedArrival ? new Date(requestEditData.estimatedArrival).toTimeString().slice(0, 5) : ''}
                                                            onChange={handleRequestEditDataChange}
                                                            className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                        />
                                                        <select
                                                            name="requestedVehicle"
                                                            value={requestEditData?.requestedVehicle ?? undefined}
                                                            onChange={handleRequestEditDataChange}
                                                            className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                        >
                                                            <option value="">-- Select SV --</option>
                                                            {serviceVehicles.map((serviceVehicle) => (
                                                                <option key={serviceVehicle.name} value={serviceVehicle.name}>{serviceVehicle.name}</option>
                                                            ))}
                                                        </select>
                                                        <div className="space-y-1">
                                                            <select
                                                                name="isDriverRequested"
                                                                value={requestEditData?.isDriverRequested}
                                                                onChange={handleRequestEditDataChange}
                                                                className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                            >
                                                                <option value="No">No driver</option>
                                                                <option value="Yes">Driver needed</option>
                                                            </select>
                                                            {requestEditData?.isDriverRequested === 'Yes' && (
                                                                <input
                                                                    type="text"
                                                                    name="delegatedDriverName"
                                                                    value={requestEditData?.delegatedDriverName || ''}
                                                                    onChange={handleRequestEditDataChange}
                                                                    className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                                    placeholder="Driver name"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="sm:hidden space-y-2">
                                                            <input
                                                                type="text"
                                                                name="requesterName"
                                                                value={requestEditData?.requesterName || ''}
                                                                onChange={handleRequestEditDataChange}
                                                                className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                                placeholder="Personnel"
                                                            />
                                                            <select
                                                                name="department"
                                                                value={requestEditData?.department || ''}
                                                                onChange={handleRequestEditDataChange}
                                                                className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                            >
                                                                <option value="">-- Select Department --</option>
                                                                {departments.map((department) => (
                                                                    <option key={department.name} value={department.name}>{department.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <div className="text-xs sm:text-sm font-medium">
                                                            🕐 {request.requestedDateTime ?
                                                                new Date(request.requestedDateTime).toLocaleString([], {
                                                                    month: '2-digit',
                                                                    day: '2-digit',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                }) :
                                                                `${getCurrentDate()} ${getCurrentTime()}`
                                                            }
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                            ETA: {request.estimatedArrival ? new Date(request.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(`${getCurrentDate()}T23:59:59`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <div className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                            🛻 {request.requestedVehicle}
                                                        </div>
                                                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                            👤 {request.isDriverRequested === 'Yes' ? (request.delegatedDriverName || 'Driver needed') : 'No driver'}
                                                        </div>
                                                        <div className="sm:hidden text-xs text-gray-600 dark:text-gray-400">
                                                            {request.requesterName} - {request.department}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Personnel */}
                                            <td className={`px-2 sm:px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'} hidden sm:table-cell`}>
                                                {editingRequestId === request.id ? (
                                                    <input
                                                        type="text"
                                                        name="requesterName"
                                                        value={requestEditData?.requesterName || ''}
                                                        onChange={handleRequestEditDataChange}
                                                        className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                    />
                                                ) : (
                                                    <div className="text-sm">{request.requesterName}</div>
                                                )}
                                            </td>

                                            {/* Department */}
                                            <td className={`px-2 sm:px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'} hidden md:table-cell`}>
                                                {editingRequestId === request.id ? (
                                                    <select
                                                        name="department"
                                                        value={requestEditData?.department || ''}
                                                        onChange={handleRequestEditDataChange}
                                                        className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                    >
                                                        <option value="">-- Select Department --</option>
                                                        {departments.map((department) => (
                                                            <option key={department.name} value={department.name}>{department.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="text-sm">{request.department}</div>
                                                )}
                                            </td>

                                            {/* Passengers */}
                                            <td className={`px-2 sm:px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'} hidden md:table-cell`}>
                                                {editingRequestId === request.id ? (
                                                    <div className="space-y-1">
                                                        {(requestEditData?.passengers || []).map((passenger, index) => (
                                                            <input
                                                                key={index}
                                                                type="text"
                                                                value={passenger}
                                                                onChange={(e) => {
                                                                    const updatedPassengers = [...(requestEditData?.passengers || [])];
                                                                    updatedPassengers[index] = (e.target as HTMLInputElement).value || '';
                                                                    setRequestEditData(prev => prev ? { ...prev, passengers: updatedPassengers } : null);
                                                                }}
                                                                className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                                placeholder={`Passenger ${index + 1}`}
                                                            />
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setRequestEditData(prev => prev ? { ...prev, passengers: [...(prev.passengers || []), ""] } : null);
                                                            }}
                                                            className="text-xs text-blue-500 hover:underline"
                                                        >
                                                            + Add Passenger
                                                        </button>
                                                    </div>
                                                ) : (
                                                    request.passengers && request.passengers.length > 0
                                                        ? request.passengers.join(', ')
                                                        : <span className="text-gray-400">-</span>
                                                )}
                                            </td>

                                            {/* Purpose */}
                                            <td className={`px-2 sm:px-3 py-1.5 text-sm max-w-xs break-words border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                {editingRequestId === request.id ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            name="purpose"
                                                            value={requestEditData?.purpose || ''}
                                                            onChange={handleRequestEditDataChange}
                                                            className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                        />
                                                        <div className="lg:hidden">
                                                            <input
                                                                type="text"
                                                                name="destination"
                                                                value={requestEditData?.destination || ''}
                                                                onChange={handleRequestEditDataChange}
                                                                className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                                placeholder="Destination"
                                                            />
                                                            <input
                                                                type="time"
                                                                name="estimatedArrival"
                                                                value={requestEditData?.estimatedArrival ? new Date(requestEditData.estimatedArrival).toTimeString().slice(0, 5) : ''}
                                                                onChange={handleRequestEditDataChange}
                                                                className={`w-full border rounded-md px-2 py-1 text-xs mt-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                                placeholder="ETA"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="break-words">
                                                            <div className="sm:whitespace-normal">{request.purpose}</div>
                                                            <div className="lg:hidden text-xs text-gray-600 dark:text-gray-400 mt-1 flex gap-x-0.5">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                {request.destination}
                                                                {request.estimatedArrival && (
                                                                    <>
                                                                        <span className="mx-1">•</span>
                                                                        <span>ETA: {new Date(request.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Destination */}
                                            <td className={`px-2 sm:px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'} hidden lg:table-cell`}>
                                                {editingRequestId === request.id ? (
                                                    <input
                                                        type="text"
                                                        name="destination"
                                                        value={requestEditData?.destination || ''}
                                                        onChange={handleRequestEditDataChange}
                                                        className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                    />
                                                ) : (
                                                    <div className="text-sm">{request.destination}</div>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className={`px-2 sm:px-3 py-1.5 text-sm font-semibold border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                {editingRequestId === request.id ? (
                                                    <div className="space-y-2">
                                                        <select
                                                            name="status"
                                                            value={requestEditData?.status || ''}
                                                            onChange={handleRequestEditDataChange}
                                                            className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                        >
                                                            {REQUEST_STATUSES.map((status) => (
                                                                <option key={status} value={status}>{status}</option>
                                                            ))}
                                                        </select>
                                                        <div className="xl:hidden">
                                                            <textarea
                                                                name="remarks"
                                                                rows={2}
                                                                value={requestEditData?.remarks || ''}
                                                                onChange={handleRequestEditDataChange}
                                                                className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                                placeholder="Remarks"
                                                            />
                                                            {(requestEditData?.remarks || '').toLowerCase().includes('completed') && (
                                                                <input
                                                                    type="date"
                                                                    name="completedDate"
                                                                    value={requestEditData?.completedDate || ''}
                                                                    onChange={handleRequestEditDataChange}
                                                                    className={`mt-1 block w-full px-2 py-1 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span className={`${request.status === 'Pending' ? 'text-red-500' : request.status === 'Approved' ? 'text-green-500' : request.status === 'Rescheduled' ? 'text-yellow-500' : 'text-gray-500'}`}>
                                                            {request.status}
                                                        </span>
                                                        <div className="xl:hidden text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                            {request.remarks && (
                                                                <div>
                                                                    {request.remarks}
                                                                    {(request.remarks || '').toLowerCase().includes('completed') && request.completedDate && (
                                                                        <span className="ml-1">({request.completedDate})</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Remarks */}
                                            <td className={`px-2 sm:px-3 py-1.5 text-sm border border-gray-200 max-w-48 ${darkMode ? 'text-gray-200' : 'text-gray-700'} hidden xl:table-cell`}>
                                                {editingRequestId === request.id ? (
                                                    <>
                                                        <textarea
                                                            name="remarks"
                                                            rows={2}
                                                            value={requestEditData?.remarks || ''}
                                                            onChange={handleRequestEditDataChange}
                                                            className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                        />
                                                        {(requestEditData?.remarks || '').toLowerCase().includes('completed') && (
                                                            <input
                                                                type="date"
                                                                name="completedDate"
                                                                value={requestEditData?.completedDate || ''}
                                                                onChange={handleRequestEditDataChange}
                                                                className={`mt-2 block w-full px-3 py-1.5 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                            />
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-sm">
                                                        {request.remarks}
                                                        {(request.remarks || '').toLowerCase().includes('completed') && request.completedDate && (
                                                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({request.completedDate})</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Timestamp */}
                                            <td className={`px-2 sm:px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'} hidden lg:table-cell`}>
                                                {!request.timestamp ? (
                                                    <div className="text-xs text-gray-500">N/A</div>
                                                ) : (
                                                    <div className="text-xs space-y-1">
                                                        <div className="font-medium">{new Date(request.timestamp.toDate()).toLocaleDateString()}</div>
                                                        <div className="text-gray-500">{new Date(request.timestamp.toDate()).toLocaleTimeString()}</div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-2 sm:px-3 py-1.5 text-right text-sm font-medium border border-gray-200">
                                                {isAdmin && (
                                                    editingRequestId === request.id ? (
                                                        <div className="flex flex-row gap-2 justify-end">
                                                            <button
                                                                onClick={() => request.id && saveEditedRequest(request.id)}
                                                                disabled={updatingRequestId === request.id}
                                                                className={`px-2 sm:px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out ${updatingRequestId === request.id
                                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                                                                }`}
                                                            >
                                                                {updatingRequestId === request.id ? 'Saving...' : 'Save'}
                                                            </button>
                                                            <button
                                                                onClick={cancelRequestEditing}
                                                                disabled={updatingRequestId === request.id}
                                                                className={`px-2 sm:px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out ${updatingRequestId === request.id
                                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-gray-500 text-white hover:bg-gray-600 cursor-pointer'
                                                                }`}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-row gap-2 justify-end">
                                                            <button
                                                                onClick={() => handleUpdateClick(request)}
                                                                disabled={!isAdmin || updatingRequestId === request.id}
                                                                className={`px-2 sm:px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out ${isAdmin && updatingRequestId !== request.id
                                                                    ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                                                                    : 'bg-blue-300 text-gray-200 cursor-not-allowed'
                                                                }`}
                                                            >
                                                                Update
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setEditableRequest(request);
                                                                    setShowTripTicket(true);
                                                                }}
                                                                className="px-2 sm:px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-md transition duration-150 ease-in-out cursor-pointer"
                                                            >
                                                                📋 Trip Ticket
                                                            </button>

                                                            {request.status === 'Pending' && (
                                                                <button
                                                                    onClick={() => handleApproveClick(request)}
                                                                    disabled={updatingRequestId === request.id}
                                                                    className={`px-2 sm:px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out ${updatingRequestId !== request.id
                                                                        ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                                                                        : 'bg-green-300 text-gray-200 cursor-not-allowed'
                                                                    }`}
                                                                >
                                                                    {updatingRequestId === request.id ? 'Processing...' : 'Approve'}
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => handleDeleteClick(request)}
                                                                disabled={!isAdmin || updatingRequestId === request.id}
                                                                className={`px-2 sm:px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out ${isAdmin && updatingRequestId !== request.id
                                                                    ? 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
                                                                    : 'bg-red-300 text-gray-200 cursor-not-allowed'
                                                                }`}
                                                            >
                                                                {updatingRequestId === request.id ? 'Deleting...' : 'Delete'}
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 px-2">
                            <button
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                                className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${currentPage === 1
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : darkMode
                                        ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                            >
                                ← Previous
                            </button>

                            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Page <span className="font-semibold">{currentPage}</span> of {totalPages}
                                <span className="ml-3 text-xs">({sortedRequests.length} total requests)</span>
                            </div>

                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages}
                                className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${currentPage === totalPages
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : darkMode
                                        ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                            >
                                Next →
                            </button>
                        </div>
                    )}

                    {showTripTicket && editableRequest?.id && (
                        <TripTicketModal
                            showTripTicket={showTripTicket}
                            setShowTripTicket={setShowTripTicket}
                            requestId={editableRequest.id}
                        />
                    )}
                </>
            )}
        </div>
    );
}