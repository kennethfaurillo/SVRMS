import { doc, updateDoc } from "firebase/firestore";
import { useState } from "preact/hooks";
import { useAuth } from "../contexts/AuthContext";
import { firebaseFirestore } from "../firebase";
import type { Trip } from "../types";
import { getCurrentDate, getCurrentTime } from "../utils";

interface TripsTableProps {
    trips: Trip[];
    darkMode: boolean;
}

export default function TripsTable({
    trips,
    darkMode
}: TripsTableProps) {
    const { isAdmin } = useAuth();
    const [updatingTripId, setUpdatingTripId] = useState<string | null>(null);

    // Function to mark trip as fulfilled
    const handleMarkAsFulfilled = async (trip: Trip) => {
        if (!isAdmin || !firebaseFirestore) return;
        
        setUpdatingTripId(trip.id);
        try {
            await updateDoc(doc(firebaseFirestore, 'trips', trip.id), {
                status: 'Fulfilled'
            });
        } catch (error) {
            console.error('Error updating trip status:', error);
        } finally {
            setUpdatingTripId(null);
        }
    };

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
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-6 rounded-lg shadow-inner mt-8`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>Approved Trips</h2>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {trips.length} trip{trips.length !== 1 ? 's' : ''}
                </div>
            </div>

            {trips.length === 0 ? (
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-center py-8`}>No approved trips yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                            <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 rounded-tl-md">Trip Details</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Personnel</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Purpose</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Destination</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Status</th>
                                {isAdmin && <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 rounded-tr-md">Actions</th>}
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
                                        {/* Trip Details: Trip Code, Date/Time, Service Vehicle, Driver */}
                                        <td className={`px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            <div className="space-y-1">
                                                {/* Trip Code - Bold and Bigger */}
                                                <div className="text-lg font-bold">{trip.tripCode}</div>
                                                {/* Date/Time - Combined in one line */}
                                                <div className="text-sm font-medium">
                                                    {trip.dateTime ? 
                                                        new Date(trip.dateTime).toLocaleString() : 
                                                        `${getCurrentDate()} ${getCurrentTime()}`
                                                    }
                                                </div>
                                                {/* Service Vehicle */}
                                                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                    {trip.vehicleAssigned}
                                                </div>
                                                {/* Driver */}
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {trip.driverName || 'No driver'}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Personnel */}
                                        <td className={`px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            <div className="text-sm">
                                                {trip.personnel?.join(', ') || 'N/A'}
                                            </div>
                                        </td>

                                        {/* Purpose */}
                                        <td className={`px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            <div className="text-sm max-w-xs break-words">
                                                {trip.purpose?.join(', ') || 'N/A'}
                                            </div>
                                        </td>

                                        {/* Destination */}
                                        <td className={`px-3 py-1.5 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            <div className="text-sm">
                                                {trip.destination || 'N/A'}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className={`px-3 py-1.5 text-sm font-semibold border border-gray-200`}>
                                            <span className={`${trip.status === 'Fulfilled' ? 'text-green-500' : 'text-orange-500'}`}>
                                                {trip.status}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        {isAdmin && (
                                            <td className="px-3 py-1.5 text-right text-sm font-medium border border-gray-200">
                                                {trip.status === 'Not Fulfilled' ? (
                                                    <button
                                                        onClick={() => handleMarkAsFulfilled(trip)}
                                                        disabled={updatingTripId === trip.id}
                                                        className={`px-3 py-1 rounded-md text-xs transition duration-150 ease-in-out
                                                            ${updatingTripId === trip.id
                                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                : 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                                                            }`}
                                                    >
                                                        {updatingTripId === trip.id ? 'Updating...' : 'Mark as Fulfilled'}
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-500">Completed</span>
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
