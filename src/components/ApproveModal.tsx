import { useState, useEffect } from "preact/hooks";
import type { Request, Trip, ServiceVehicle } from "../types";
import { SERVICE_VEHICLES } from "../constants";
import useTrips from "../hooks/useTrips";

interface ApproveModalProps {
    darkMode: boolean;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (tripCode: string, isNewTrip: boolean, tripData?: Partial<Trip>) => Promise<void>;
    request: Request | null;
    existingTrips: Trip[];
}

export default function ApproveModal({ darkMode, isOpen, onClose, onSubmit, request, existingTrips }: ApproveModalProps) {
    const [tripMode, setTripMode] = useState<'new' | 'existing'>('new');
    const [selectedTripCode, setSelectedTripCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Editable trip data for new trips
    const [editableTripData, setEditableTripData] = useState({
        dateTime: '',
        vehicleAssigned: '' as ServiceVehicle | '',
        driverName: ''
    });

    // Generate new trip code based on existing trips
    const { newTripCode } = useTrips();

    // Reset editable data when request changes
    useEffect(() => {
        if (request) {
            setEditableTripData({
                dateTime: request.requestedDateTime,
                vehicleAssigned: request.requestedVehicle,
                driverName: request.delegatedDriverName || ''
            });
        }
    }, [request]);

    // Get selected trip for comparison
    const selectedTrip = existingTrips.find(trip => trip.tripCode === selectedTripCode);

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        const tripCode = tripMode === 'new' ? newTripCode : selectedTripCode;

        if (!tripCode.trim()) {
            alert('Please enter or select a trip code');
            return;
        }

        if (tripMode === 'new' && (!editableTripData.dateTime || !editableTripData.vehicleAssigned)) {
            alert('Please fill in all required trip details');
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit(tripCode, tripMode === 'new', tripMode === 'new' ? {
                dateTime: editableTripData.dateTime,
                vehicleAssigned: editableTripData.vehicleAssigned as ServiceVehicle,
                driverName: editableTripData.driverName || undefined
            } : undefined);
            onClose();
            // Reset for next use
            setSelectedTripCode('');
            setTripMode('new');
        } catch (error) {
            console.error('Approve error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedTripCode('');
        setTripMode('new');
        onClose();
    };

    if (!isOpen || !request) return null;

    return (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${darkMode ? 'bg-gray-900 bg-opacity-50' : 'bg-gray-600 bg-opacity-50'}`}>
            <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} p-6 rounded-lg shadow-xl w-full max-w-md mx-4`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Approve Request</h2>
                    <button
                        onClick={handleClose}
                        className={`text-gray-500 hover:text-gray-700 ${darkMode ? 'hover:text-gray-300' : ''}`}
                        disabled={isLoading}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Request Details */}
                <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className="font-semibold mb-2">Request Details:</h3>
                    <p className="text-sm"><strong>Vehicle:</strong> {request.requestedVehicle}</p>
                    <p className="text-sm"><strong>Date & Time:</strong> {new Date(request.requestedDateTime).toLocaleString()}</p>
                    <p className="text-sm"><strong>Requester:</strong> {request.requesterName}</p>
                    <p className="text-sm"><strong>Department:</strong> {request.department}</p>
                    <p className="text-sm"><strong>Purpose:</strong> {request.purpose}</p>
                    <p className="text-sm"><strong>Destination:</strong> {request.destination}</p>
                    {request.delegatedDriverName && (
                        <p className="text-sm"><strong>Requested Driver:</strong> {request.delegatedDriverName}</p>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Trip Mode Selection */}
                    <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Trip Assignment
                        </label>
                        <div className="flex space-x-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="tripMode"
                                    value="new"
                                    checked={tripMode === 'new'}
                                    onChange={() => setTripMode('new')}
                                    className="mr-2"
                                    disabled={isLoading}
                                />
                                <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Create New Trip</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="tripMode"
                                    value="existing"
                                    checked={tripMode === 'existing'}
                                    onChange={() => setTripMode('existing')}
                                    className="mr-2"
                                    disabled={isLoading || existingTrips.length === 0}
                                />
                                <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'} ${existingTrips.length === 0 ? 'opacity-50' : ''}`}>
                                    Assign to Existing Trip
                                </span>
                            </label>
                        </div>
                    </div>

                    {tripMode === 'new' ? (
                        <div className="mb-6">
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                Trip Code
                            </label>
                            <input
                                type="text"
                                value={newTripCode}
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-300'}`}
                                disabled
                                required
                            />
                            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Auto-generated based on today's date and sequence
                            </p>

                            {/* Editable Trip Details for New Trip */}
                            <div className="mt-4 space-y-4">
                                <h4 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Edit Trip Details
                                </h4>

                                {/* Date & Time Row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={editableTripData.dateTime ? new Date(editableTripData.dateTime).toISOString().slice(0, 10) : ''}
                                            onChange={(e) => {
                                                const dateValue = (e.target as HTMLInputElement).value;
                                                const existingTime = editableTripData.dateTime ?
                                                    new Date(editableTripData.dateTime).toTimeString().slice(0, 5) : '00:00';
                                                setEditableTripData(prev => ({
                                                    ...prev,
                                                    dateTime: dateValue ? new Date(`${dateValue}T${existingTime}`).toISOString() : ''
                                                }));
                                            }}
                                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-300'}`}
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            Time *
                                        </label>
                                        <input
                                            type="time"
                                            value={editableTripData.dateTime ?
                                                new Date(editableTripData.dateTime).toTimeString().slice(0, 5) : ''}
                                            onChange={(e) => {
                                                const timeValue = (e.target as HTMLInputElement).value;
                                                const existingDate = editableTripData.dateTime ?
                                                    new Date(editableTripData.dateTime).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
                                                setEditableTripData(prev => ({
                                                    ...prev,
                                                    dateTime: timeValue ? new Date(`${existingDate}T${timeValue}`).toISOString() : ''
                                                }));
                                            }}
                                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-300'}`}
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Vehicle Assignment & Driver Name Row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            Assigned Vehicle *
                                        </label>
                                        <select
                                            value={editableTripData.vehicleAssigned}
                                            onChange={(e) => setEditableTripData(prev => ({
                                                ...prev,
                                                vehicleAssigned: (e.target as HTMLSelectElement).value as ServiceVehicle
                                            }))}
                                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-300'}`}
                                            disabled={isLoading}
                                            required
                                        >
                                            <option value="">-- Select Vehicle --</option>
                                            {SERVICE_VEHICLES.map((vehicle) => (
                                                <option key={vehicle} value={vehicle}>
                                                    {vehicle}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                            Driver Name (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={editableTripData.driverName}
                                            onChange={(e) => setEditableTripData(prev => ({
                                                ...prev,
                                                driverName: (e.target as HTMLInputElement).value
                                            }))}
                                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-300'}`}
                                            disabled={isLoading}
                                            placeholder="Enter driver name if assigned"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6">
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                Select Existing Trip
                            </label>
                            <select
                                value={selectedTripCode}
                                onChange={(e) => setSelectedTripCode((e.target as HTMLSelectElement).value)}
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-300'}`}
                                disabled={isLoading}
                                required
                            >
                                <option value="">-- Select a trip --</option>
                                {existingTrips.map((trip) => (
                                    <option key={trip.id} value={trip.tripCode}>
                                        {trip.tripCode} ({trip.requestIds.length} request{trip.requestIds.length !== 1 ? 's' : ''})
                                    </option>
                                ))}
                            </select>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Choose an existing trip to add this request to
                            </p>

                            {/* Show what will be changed in the request to match existing trip */}
                            {selectedTrip && (
                                <div className={`mt-4 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                                    <h4 className={`font-medium mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                                        Request Changes to Match Trip {selectedTripCode}:
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                        {/* Vehicle mismatch warning */}
                                        {selectedTrip.vehicleAssigned !== request.requestedVehicle && (
                                            <div className={`p-2 rounded-md border ${darkMode ? 'bg-red-900 border-red-600 text-red-200' : 'bg-red-50 border-red-300 text-red-700'}`}>
                                                <div className="flex items-center">
                                                    <span className="text-lg mr-2">⚠️</span>
                                                    <div>
                                                        <div className="font-semibold">Vehicle Mismatch Warning!</div>
                                                        <div><strong>Requested:</strong> {request.requestedVehicle}</div>
                                                        <div><strong>Trip Vehicle:</strong> {selectedTrip.vehicleAssigned}</div>
                                                        <div className="text-xs mt-1">Request will use trip's vehicle</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Date & Time changes */}
                                        {selectedTrip.dateTime !== request.requestedDateTime && (
                                            <div className={`${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                                <strong>Date/Time will change:</strong>
                                                <div className="ml-4">
                                                    <div>From: {new Date(request.requestedDateTime).toLocaleString()}</div>
                                                    <div>To: {new Date(selectedTrip.dateTime).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        )}

                                        {selectedTrip.destination !== request.destination && (
                                            <div className={`${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                                <strong>Destination will be updated:</strong>
                                                <div className="ml-4">
                                                    <div>Current: {selectedTrip.destination}</div>
                                                    <div>Updated: {selectedTrip.destination}, {request.destination}</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* No changes */}
                                        {selectedTrip.dateTime === request.requestedDateTime &&
                                            selectedTrip.destination === request.destination &&
                                            selectedTrip.vehicleAssigned === request.requestedVehicle && (
                                                <div className={`${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                                                    ✓ No changes needed - request matches trip details
                                                </div>
                                            )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isLoading ? 'Approving...' : 'Approve & Assign'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className={`flex-1 py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
