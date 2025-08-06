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

    // Filter trips that have approved requests
    // const approvedTrips = trips.filter(trip => 
    //     trip.requests && trip.requests.length > 0 && 
    //     trip.requests.some(request => request.status === 'Approved')
    // );
    const approvedTrips = trips
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
                    {approvedTrips.length} trip{approvedTrips.length !== 1 ? 's' : ''} with approved requests
                </div>
            </div>

            {approvedTrips.length === 0 ? (
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-center py-8`}>No approved trips yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead className={`${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                            <tr>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 rounded-tl-md">Trip Code</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Service Vehicle</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Requesting Personnel</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Department</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Driver Request</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Purpose</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Destination</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Date/Time</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200">Trip Status</th>
                                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider border border-gray-200 rounded-tr-md">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvedTrips.map((trip, tripIndex) => {
                                const colorScheme = pastelColors[tripIndex % pastelColors.length];
                                // const approvedRequests = trip.requests.filter(request => request.status === 'Approved');
                                console.log(trip)
                                const approvedRequests = trip.requests;

                                return approvedRequests.map((request, requestIndex) => (
                                    <tr
                                        key={`${trip.tripCode}-${request.id}`}
                                        className={`${darkMode ? colorScheme.darkBg : colorScheme.bg} border-l-4 ${darkMode ? colorScheme.darkBorder : colorScheme.border} hover:opacity-80 transition-opacity duration-200`}
                                    >
                                        {/* Trip Code - only show for first request of each trip */}
                                        <td className={`px-3 py-2 text-sm font-medium border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {requestIndex === 0 ? (
                                                <div className="flex items-center">
                                                    <div className={`w-3 h-3 rounded-full mr-2 ${darkMode ? colorScheme.darkBorder : colorScheme.border.replace('border-', 'bg-')}`}></div>
                                                    <span className="font-semibold">{trip.tripCode}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <div className={`w-3 h-3 rounded-full mr-2 ${darkMode ? colorScheme.darkBorder : colorScheme.border.replace('border-', 'bg-')}`}></div>
                                                    <span className="text-xs text-gray-500">↳ continued</span>
                                                </div>
                                            )}
                                        </td>

                                        {/* Service Vehicle */}
                                        <td className={`px-3 py-2 text-sm font-medium border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {request.requestedVehicle}
                                        </td>

                                        {/* Requesting Personnel */}
                                        <td className={`px-3 py-2 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            {request.requesterName}
                                        </td>

                                        {/* Department */}
                                        <td className={`px-3 py-2 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            {request.department}
                                        </td>

                                        {/* Driver Request */}
                                        <td className={`px-3 py-2 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            {request.isDriverRequested === true ? (request.delegatedDriverName || 'Yes') : 'No'}
                                        </td>

                                        {/* Purpose */}
                                        <td className={`px-3 py-2 text-sm max-w-xs break-words border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            {request.purpose}
                                        </td>

                                        {/* Destination */}
                                        <td className={`px-3 py-2 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            {request.destination}
                                        </td>

                                        {/* Date/Time */}
                                        <td className={`px-3 py-2 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            <div className="text-xs">
                                                <div>{request.requestedDateTime?.split('T')[0] || getCurrentDate()}</div>
                                                <div className="text-gray-500">{request.requestedDateTime?.split('T')[1]?.slice(0, 5) || getCurrentTime()}</div>
                                            </div>
                                        </td>

                                        {/* Trip Status - only show for first request of each trip */}
                                        <td className={`px-3 py-2 text-sm font-semibold border border-gray-200`}>
                                            {requestIndex === 0 ? (
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${trip.status === 'Fulfilled'
                                                        ? `bg-green-100 text-green-600 ${darkMode && 'bg-green-900 text-green-200'}`
                                                        : `bg-orange-100 text-orange-600 ${darkMode && 'bg-orange-800 text-orange-300'}`
                                                    }`}>
                                                    {trip.status}
                                                </span>
                                            ) : (
                                                ''
                                            )}
                                        </td>

                                        {/* Remarks */}
                                        <td className={`px-3 py-2 text-sm border border-gray-200 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            <div className="max-w-xs">
                                                {request.remarks && (
                                                    <div className="text-xs">{request.remarks}</div>
                                                )}
                                                {request.completedDate && (
                                                    <div className="text-xs text-gray-500 mt-1">Completed: {request.completedDate}</div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ));
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
