import type { Trip } from "../types";
import { getCurrentDate, getCurrentTime } from "../utils";
import { SERVICE_VEHICLES } from "../constants";
import { useAuth } from "../contexts/AuthContext";

interface TripsTableProps {
    trips: Trip[];
    darkMode: boolean;
    editingTripId: string | null;
    currentEditTripData: Trip | null;
    updatingTripId: string | null;
    handleEditTrip: (trip: Trip) => void;
    handleDeleteTrip: (trip: Trip) => void;
    cancelTripEditing: () => void;
    handleTripEditChange: (e: any) => void;
    saveEditedTrip: (tripId: string) => void;
    handleMarkTripAsFulfilled: (trip: Trip) => void;
}

export default function TripsTable({
    trips,
    darkMode,
    editingTripId,
    currentEditTripData,
    updatingTripId,
    handleEditTrip,
    handleDeleteTrip,
    cancelTripEditing,
    handleTripEditChange,
    saveEditedTrip,
    handleMarkTripAsFulfilled
}: TripsTableProps) {
    const { isAdmin } = useAuth();

    // Define pastel colors for alternating trips
    const pastelColors = [
        { bg: 'bg-blue-50', darkBg: 'bg-blue-900/20', border: 'border-blue-200', darkBorder: 'border-blue-700' },
        { bg: 'bg-green-50', darkBg: 'bg-green-900/20', border: 'border-green-200', darkBorder: 'border-green-700' },
        { bg: 'bg-purple-50', darkBg: 'bg-purple-900/20', border: 'border-purple-200', darkBorder: 'border-purple-700' },
        { bg: 'bg-yellow-50', darkBg: 'bg-yellow-900/20', border: 'border-yellow-200', darkBorder: 'border-yellow-700' },
        { bg: 'bg-pink-50', darkBg: 'bg-pink-900/20', border: 'border-pink-200', darkBorder: 'border-pink-700' },
        { bg: 'bg-indigo-50', darkBg: 'bg-indigo-900/20', border: 'border-indigo-200', darkBorder: 'border-indigo-700' }
    ];

    return (
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 sm:p-6 rounded-lg shadow-inner mt-8`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
                <h2 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>Approved Trips</h2>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {trips.length} trip{trips.length !== 1 ? 's' : ''}
                </div>
            </div>

            {trips.length === 0 ? (
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-center py-8`}>No approved trips yet.</p>
            ) : (
                <div className="overflow-x-auto max-h-64">
                    <table className="min-w-full border-collapse">
                        <thead className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                            <tr>
                                <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 rounded-tl-md">Trip Details</th>
                                <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 hidden sm:table-cell">Personnel</th>
                                <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Purpose</th>
                                <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 hidden lg:table-cell">Destination</th>
                                <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Status</th>
                                {isAdmin && <th scope="col" className="px-2 sm:px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 rounded-tr-md">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {trips.map((trip, tripIndex) => {
                                const colorScheme = pastelColors[tripIndex % pastelColors.length];

                                return (
                                    <tr
                                        key={trip.id}
                                        className={`${darkMode ? colorScheme.darkBg : colorScheme.bg} border-l-4 ${darkMode ? colorScheme.darkBorder : colorScheme.border} hover:opacity-80 transition-opacity duration-200`}
                                    >
                                        {/* Trip Details: Trip Code, Date/Time, Service Vehicle, Driver - Always visible */}
                                        <td className={`px-2 sm:px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {editingTripId === trip.id ? (
                                                <div className="space-y-2">
                                                    {/* Trip Code - Not editable */}
                                                    <div className="text-sm font-bold text-gray-500">{trip.tripCode}</div>
                                                    {/* Date/Time - Combined */}
                                                    <input
                                                        type="datetime-local"
                                                        name="dateTime"
                                                        value={currentEditTripData?.dateTime || ''}
                                                        onChange={handleTripEditChange}
                                                        className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                    />
                                                    {/* Service Vehicle */}
                                                    <select
                                                        name="vehicleAssigned"
                                                        value={currentEditTripData?.vehicleAssigned || ''}
                                                        onChange={handleTripEditChange}
                                                        className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                    >
                                                        <option value="">-- Select Vehicle --</option>
                                                        {SERVICE_VEHICLES.map((option) => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                    {/* Driver */}
                                                    <input
                                                        type="text"
                                                        name="driverName"
                                                        value={currentEditTripData?.driverName || ''}
                                                        onChange={handleTripEditChange}
                                                        className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                        placeholder="Driver name (optional)"
                                                    />
                                                    {/* Mobile: Show personnel inline on mobile when editing */}
                                                    <div className="sm:hidden">
                                                        <input
                                                            type="text"
                                                            name="personnel"
                                                            value={currentEditTripData?.personnel?.join(', ') || ''}
                                                            onChange={handleTripEditChange}
                                                            className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                            placeholder="Personnel (comma-separated)"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {/* Trip Code - Bold and Bigger */}
                                                    <div className="text-base font-bold">{trip.tripCode}</div>
                                                    {/* Date/Time - Combined in one line, shorter on mobile */}
                                                    <div className="text-xs font-medium">
                                                        {trip.dateTime ?
                                                            new Date(trip.dateTime).toLocaleString([], {
                                                                month: '2-digit',
                                                                day: '2-digit',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }) :
                                                            `${getCurrentDate()} ${getCurrentTime()}`
                                                        }
                                                    </div>
                                                    {/* Service Vehicle */}
                                                    <div className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                        {trip.vehicleAssigned}
                                                    </div>
                                                    {/* Driver */}
                                                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                        {trip.driverName || 'No driver'}
                                                    </div>
                                                    {/* Mobile: Show personnel inline on mobile */}
                                                    <div className="sm:hidden text-xs text-gray-600 dark:text-gray-400">
                                                        👥 {trip.personnel?.join(', ') || 'N/A'}
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                        {/* Personnel - Hidden on mobile */}
                                        <td className={`px-2 sm:px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'} hidden sm:table-cell`}>
                                            {editingTripId === trip.id ? (
                                                <input
                                                    type="text"
                                                    name="personnel"
                                                    value={currentEditTripData?.personnel?.join(', ') || ''}
                                                    onChange={handleTripEditChange}
                                                    className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                    placeholder="Personnel (comma-separated)"
                                                />
                                            ) : (
                                                <div className="text-sm">
                                                    {trip.personnel?.join(', ') || 'N/A'}
                                                </div>
                                            )}
                                        </td>

                                        {/* Purpose - Always visible but condensed on mobile */}
                                        <td className={`px-2 sm:px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            {editingTripId === trip.id ? (
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        name="purpose"
                                                        value={currentEditTripData?.purpose?.join(', ') || ''}
                                                        onChange={handleTripEditChange}
                                                        className={`w-full border rounded-md px-2 py-1 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                        placeholder="Purpose (comma-separated)"
                                                    />
                                                    {/* Mobile: Show destination inline when editing */}
                                                    <div className="lg:hidden">
                                                        <input
                                                            type="text"
                                                            name="destination"
                                                            value={currentEditTripData?.destination || ''}
                                                            onChange={handleTripEditChange}
                                                            className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                            placeholder="Destination"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="break-words">
                                                    <div className="sm:whitespace-normal">
                                                        {trip.purpose?.join(', ') || 'N/A'}
                                                    </div>
                                                    {/* Mobile: Show destination inline */}
                                                    <div className="lg:hidden text-xs text-gray-600 dark:text-gray-400 mt-1 flex gap-x-0.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        {trip.destination || 'N/A'}
                                                    </div>
                                                </div>
                                            )}
                                        </td>

                                        {/* Destination - Hidden on mobile/tablet */}
                                        <td className={`px-2 sm:px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'} hidden lg:table-cell`}>
                                            {editingTripId === trip.id ? (
                                                <input
                                                    type="text"
                                                    name="destination"
                                                    value={currentEditTripData?.destination || ''}
                                                    onChange={handleTripEditChange}
                                                    className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                    placeholder="Destination"
                                                />
                                            ) : (
                                                <div className="text-sm">
                                                    {trip.destination || 'N/A'}
                                                </div>
                                            )}
                                        </td>

                                        {/* Status - Always visible */}
                                        <td className={`px-2 sm:px-3 py-1.5 text-sm font-semibold border border-gray-200`}>
                                            {editingTripId === trip.id ? (
                                                <select
                                                    name="status"
                                                    value={currentEditTripData?.status || ''}
                                                    onChange={handleTripEditChange}
                                                    className={`w-full border rounded-md px-2 py-1 text-xs ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                                                >
                                                    <option value="Not Fulfilled">Not Fulfilled</option>
                                                    <option value="Fulfilled">Fulfilled</option>
                                                </select>
                                            ) : (
                                                <span className={`${trip.status === 'Fulfilled' ? 'text-green-500' : 'text-orange-500'}`}>
                                                    {trip.status}
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions - Always visible for admin */}
                                        {isAdmin && (
                                            <td className="px-2 sm:px-3 py-1.5 text-right text-sm font-medium border border-gray-200">
                                                {editingTripId === trip.id ? (
                                                    // Editing mode: Show Save and Cancel buttons
                                                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                                        <button
                                                            onClick={() => saveEditedTrip(trip.id)}
                                                            disabled={updatingTripId === trip.id}
                                                            className={`px-2 sm:px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out
                                                                ${updatingTripId === trip.id
                                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                                                                }`}
                                                        >
                                                            <span className="hidden sm:inline">
                                                                {updatingTripId === trip.id ? 'Saving...' : 'Save'}
                                                            </span>
                                                            <span className="sm:hidden">
                                                                {updatingTripId === trip.id ? '⏳' : '💾'}
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={cancelTripEditing}
                                                            disabled={updatingTripId === trip.id}
                                                            className={`px-2 sm:px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out
                                                                ${updatingTripId === trip.id
                                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-gray-500 text-white hover:bg-gray-600 cursor-pointer'
                                                                }`}
                                                        >
                                                            <span className="hidden sm:inline">Cancel</span>
                                                            <span className="sm:hidden">❌</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    // Normal mode: Show Edit button and Mark as Fulfilled button
                                                    <div className="flex flex-col sm:flex-row w-fit gap-1 sm:gap-2">
                                                        <button
                                                            onClick={() => handleEditTrip(trip)}
                                                            disabled={updatingTripId === trip.id}
                                                            className={`px-2 sm:px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out
                                                                ${updatingTripId === trip.id
                                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                                                                }`}
                                                        >
                                                            <span className="hidden sm:inline">Edit</span>
                                                            <span className="sm:hidden">Edit</span>
                                                        </button>
                                                        {trip.status === 'Not Fulfilled' && (
                                                            <button
                                                                onClick={() => handleMarkTripAsFulfilled(trip)}
                                                                disabled={updatingTripId === trip.id}
                                                                className={`px-2 sm:px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out
                                                                    ${updatingTripId === trip.id
                                                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                        : 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                                                                    }`}
                                                            >
                                                                <span className="hidden sm:inline">
                                                                    {updatingTripId === trip.id ? 'Updating...' : 'Mark as Fulfilled'}
                                                                </span>
                                                                <span className="sm:hidden">
                                                                    {updatingTripId === trip.id ? '⏳' : 'Mark as Fulfilled'}
                                                                </span>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteTrip(trip)}
                                                            disabled={updatingTripId === trip.id}
                                                            className={`px-2 sm:px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out
                                                                ${updatingTripId === trip.id
                                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
                                                                }`}
                                                        >
                                                            <span className="hidden sm:inline">Delete</span>
                                                            <span className="sm:hidden">Delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
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
