import { DEPARTMENTS, REQUEST_STATUSES, SERVICE_VEHICLES } from "../constants";
import { useAuth } from "../contexts/AuthContext";
import type { Request } from "../types";
import { getCurrentDate, getCurrentTime } from "../utils";

interface RequestsTableProps {
    requests: Request[];
    darkMode: boolean;
    editingRequestId: string | null;
    currentEditData: Request | null;
    handleEditChange: (e: any) => void;
    saveEditedRequest: (requestId: string) => Promise<void>;
    cancelEditing: () => void;
    handleUpdateClick: (request: Request) => void;
    handleDeleteClick: (request: Request) => void;
    handleExportClick: () => void;
    handleApproveClick: (request: Request) => void;
}

export default function RequestsTable({
    requests,
    darkMode,
    editingRequestId,
    currentEditData,
    handleEditChange,
    saveEditedRequest,
    cancelEditing,
    handleUpdateClick,
    handleDeleteClick,
    handleExportClick,
    handleApproveClick
}: RequestsTableProps) {
    const { isAdmin } = useAuth();
    return (
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-6 rounded-lg shadow-inner mt-8`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>All Requests</h2>
                <button
                    onClick={handleExportClick}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out cursor-pointer"
                >
                    Export to CSV
                </button>
            </div>
            {requests.length === 0 ? (
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-center`}>No requests submitted yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                            <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 rounded-tl-md">Timestamp</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">SV Request</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Requesting Personnel</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Department</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Driver Request</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Purpose of Request</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Location</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Date of Request</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Time of Request</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Status</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Remarks</th>
                                {isAdmin &&
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 rounded-tr-md">Actions</th>
                                }
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map((request: Request, index) => (
                                <tr key={request.id} className={`${index % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-700' : 'bg-gray-50')} ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}>
                                    {/* Timestamp */}
                                    <td className="px-3 py-1.5 text-sm border border-gray-200">
                                        {request.timestamp ? new Date(request.timestamp.toDate()).toLocaleString() : 'N/A'}
                                    </td>
                                    {/* Requested SV */}
                                    <td className="px-3 py-1.5 text-sm font-medium border border-gray-200">
                                        {editingRequestId === request.id ? (
                                            <select
                                                name="requestType"
                                                value={currentEditData?.requestedVehicle || ''}
                                                onChange={handleEditChange}
                                                className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                            >
                                                <option value="">-- Select SV Request --</option>
                                                {SERVICE_VEHICLES.map((option) => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            request.requestedVehicle
                                        )}
                                    </td>
                                    {/* Requesting Personnel */}
                                    <td className="px-3 py-1.5 text-sm border border-gray-200">
                                        {editingRequestId === request.id ? (
                                            <input
                                                type="text"
                                                name="requesterName"
                                                value={currentEditData?.requesterName || ''}
                                                onChange={handleEditChange}
                                                className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                            />
                                        ) : (
                                            request.requesterName
                                        )}
                                    </td>
                                    {/* Department */}
                                    <td className="px-3 py-1.5 text-sm border border-gray-200">
                                        {editingRequestId === request.id ? (
                                            <select
                                                name="department"
                                                value={currentEditData?.department || ''}
                                                onChange={handleEditChange}
                                                className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                            >
                                                <option value="">-- Select Department --</option>
                                                {DEPARTMENTS.map((option) => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            request.department
                                        )}
                                    </td>
                                    {/* Driver Requested */}
                                    <td className="px-3 py-1.5 text-sm border border-gray-200">
                                        {editingRequestId === request.id ? (
                                            <>
                                                <select
                                                    name="driverRequested"
                                                    value={currentEditData?.isDriverRequested === true ? 'Yes' : 'No'}
                                                    onChange={handleEditChange}
                                                    className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                >
                                                    <option value="No">No</option>
                                                    <option value="Yes">Yes</option>
                                                </select>
                                                {currentEditData?.isDriverRequested === true && (
                                                    <input
                                                        type="text"
                                                        name="delegatedDriverName"
                                                        value={currentEditData?.delegatedDriverName || ''}
                                                        onChange={handleEditChange}
                                                        className={`mt-1 w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                        placeholder="Enter driver name"
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            request.isDriverRequested === true ? (request.delegatedDriverName || 'Yes') : 'No'
                                        )}
                                    </td>
                                    {/* Purpose of Request */}
                                    <td className="px-3 py-1.5 text-sm max-w-xs break-words border border-gray-200">
                                        {editingRequestId === request.id ? (
                                            <input
                                                type="text"
                                                name="purpose"
                                                value={currentEditData?.purpose || ''}
                                                onChange={handleEditChange}
                                                className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                            />
                                        ) : (
                                            request.purpose
                                        )}
                                    </td>
                                    {/* Destination */}
                                    <td className="px-3 py-1.5 text-sm border border-gray-200">
                                        {editingRequestId === request.id ? (
                                            <input
                                                type="text"
                                                name="destination"
                                                value={currentEditData?.destination || ''}
                                                onChange={handleEditChange}
                                                className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                            />
                                        ) : (
                                            request.destination
                                        )}
                                    </td>
                                    {/* Date of Request */}
                                    <td className="px-3 py-1.5 text-sm border border-gray-200">
                                        {editingRequestId === request.id ? (
                                            <input
                                                type="date"
                                                name="dateOfRequest"
                                                value={(currentEditData?.requestedDateTime)?.split('T')[0] || ''}
                                                onChange={handleEditChange}
                                                className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                            />
                                        ) : (
                                            request.requestedDateTime?.split('T')[0] || getCurrentDate()
                                        )}
                                    </td>
                                    {/* Time of Request */}
                                    <td className="px-3 py-1.5 text-sm border border-gray-200">
                                        {editingRequestId === request.id ? (
                                            <input
                                                type="time"
                                                name="timeOfRequest"
                                                value={currentEditData?.requestedDateTime?.split('T')[1]?.slice(0, 5) || ''}
                                                onChange={handleEditChange}
                                                className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                            />
                                        ) : (
                                            request.requestedDateTime?.split('T')[1]?.slice(0, 5) || getCurrentTime()
                                        )}
                                    </td>
                                    {/* Status */}
                                    <td className={`px-3 py-1.5 text-sm font-semibold border border-gray-200 ${request.status === 'Pending' ? 'text-red-500' : request.status === 'Approved' ? 'text-green-500' : request.status === 'Rescheduled' ? 'text-yellow-500' : 'text-gray-500'}`}>
                                        {editingRequestId === request.id ? (
                                            <select
                                                name="status"
                                                value={currentEditData?.status || ''}
                                                onChange={handleEditChange}
                                                className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                            >
                                                {REQUEST_STATUSES.map((status) => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            request.status
                                        )}
                                    </td>
                                    {/* Remarks */}
                                    <td className="px-3 py-1.5 text-sm border border-gray-200">
                                        {editingRequestId === request.id ? (
                                            <>
                                                <textarea
                                                    name="remarks"
                                                    rows={2}
                                                    value={currentEditData?.remarks || ''}
                                                    onChange={handleEditChange}
                                                    className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                />
                                                {(currentEditData?.remarks || '').toLowerCase().includes('completed') && (
                                                    <input
                                                        type="date"
                                                        name="completedDate"
                                                        className={`mt-2 block w-full px-3 py-1.5 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                        value={currentEditData?.completedDate || ''}
                                                        onChange={handleEditChange}
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {request.remarks}
                                                {(request.remarks || '').toLowerCase().includes('completed') && request.completedDate && (
                                                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({request.completedDate})</span>
                                                )}
                                            </>
                                        )}
                                    </td>
                                    {/* Actions (Update/Save/Cancel and Delete) */}
                                    {isAdmin &&
                                        <td className="px-3 py-1.5 text-right text-sm font-medium border border-gray-200">
                                            {editingRequestId === request.id ? (
                                                <div className="flex space-x-1">
                                                    <button
                                                        onClick={() => saveEditedRequest(request.id)}
                                                        className="px-3 py-1 bg-green-500 text-white rounded-md text-xs hover:bg-green-600 transition duration-150 ease-in-out cursor-pointer"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="px-3 py-1 bg-gray-500 text-white rounded-md text-xs hover:bg-gray-600 transition duration-150 ease-in-out cursor-pointer"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex space-x-1">
                                                    <button
                                                        onClick={() => handleUpdateClick(request)}
                                                        // onClick={() => console.log(request)}
                                                        disabled={!isAdmin}
                                                        className={`px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out
                                                        ${isAdmin
                                                                ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                                                                : 'bg-blue-300 text-gray-200 cursor-not-allowed'
                                                            }`
                                                        }
                                                    >
                                                        Update
                                                    </button>
                                                    <button
                                                        onClick={() => handleApproveClick(request)}
                                                        disabled={!isAdmin || request.status !== 'Pending'}
                                                        className={`px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out
                                                        ${isAdmin && request.status === 'Pending'
                                                                ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                                                                : 'bg-green-300 text-gray-200 cursor-not-allowed'
                                                            }`
                                                        }
                                                        title={request.status === 'Pending' ? 'Approve and assign to trip' : 'Only pending requests can be approved'}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(request)}
                                                        disabled={!isAdmin}
                                                        className={`px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out
                                                        ${isAdmin
                                                                ? 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
                                                                : 'bg-red-300 text-gray-200 cursor-not-allowed'
                                                            }`
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    }
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
