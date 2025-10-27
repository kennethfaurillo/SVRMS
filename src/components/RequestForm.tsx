import { useState } from "preact/hooks";
import type { Department, Request, ServiceVehicle } from "../types";
import { getCurrentDate, getCurrentTime } from "../utils";
import { Timestamp } from "firebase/firestore";
import { useConstants } from "../hooks/useConstants";
import useRequests from "../hooks/useRequests";
import useTrips from "../hooks/useTrips";

interface RequestFormProps {
    darkMode: boolean
    onSubmit: (requestData: Request) => Promise<void>;
}

export default function RequestForm({ darkMode, onSubmit }: RequestFormProps) {
    const [requestedVehicle, setRequestedVehicle] = useState<ServiceVehicle | null>(null);
    const [purpose, setPurpose] = useState('');
    const [destination, setDestination] = useState('');
    const [requesterName, setRequesterName] = useState('');
    const [isDriverRequested, setIsDriverRequested] = useState<'Yes' | 'No' | undefined>(undefined);
    const [department, setDepartment] = useState<Department | null>(null);
    const [remarks, setRemarks] = useState('');
    const [dateOfRequest, setDateOfRequest] = useState(getCurrentDate());
    const [timeOfRequest, setTimeOfRequest] = useState(getCurrentTime());
    const [estimatedArrival, setEstimatedArrival] = useState(() => {
        const now = new Date();
        now.setHours(now.getHours() + 1, 30, 0, 0);
        return now.toTimeString().slice(0, 5);
    });
    const [isLoading, setIsLoading] = useState(false);
    const { serviceVehicles, departments } = useConstants();
    const { todayRequests } = useRequests();
    const { todayTrips } = useTrips();

    const unavailableVehicles = todayTrips.map(trip => [trip.vehicleAssigned, trip.estimatedArrival || new Date(`${getCurrentDate()}T23:59:59`).toISOString()]).filter(req => req[0] !== null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        // Validate required fields
        if (!requesterName || !department || !purpose || !destination || !dateOfRequest || !timeOfRequest ||
            isDriverRequested === undefined) {
            alert("Please fill in all required fields.");
            return;
        }

        setIsLoading(true);

        try {
            const requestData: Request = {
                requesterName,
                requestedVehicle: requestedVehicle ? requestedVehicle.name : null,
                department: department.name,
                isDriverRequested,
                purpose,
                destination,
                requestedDateTime: new Date(`${dateOfRequest}T${timeOfRequest}`).toISOString(),
                estimatedArrival: estimatedArrival ? new Date(`${dateOfRequest}T${estimatedArrival}`).toISOString() : undefined,
                timestamp: Timestamp.fromDate(new Date()),
                remarks,
                status: 'Pending' as const
            }
            console.log(requestData)

            await onSubmit(requestData); // Call the onSubmit prop with the request data

            // Clear form after successful submission
            setRequesterName('');
            setRequestedVehicle(null);
            setDepartment(null);
            setIsDriverRequested(undefined);
            setPurpose('');
            setDestination('');
            setRemarks('');
            setDateOfRequest(getCurrentDate());
            setTimeOfRequest(getCurrentTime());
        } catch (error) {
            console.error('Error submitting request:', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg shadow-inner`}>
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>Record New Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* First row - Personnel, Department, Service Vehicle */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Requester Name */}
                    <div className="flex flex-col space-y-2">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Requesting Personnel *
                        </label>
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Requesting Personnel"
                                className={`flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={requesterName}
                                onChange={(e) => setRequesterName((e.target as HTMLInputElement).value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    {/* Department */}
                    <div className="flex flex-col space-y-2">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Department *
                        </label>
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <select
                                className={`flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={department?.name || ''}
                                onChange={(e) => setDepartment(departments.find(dept => dept.name === (e.target as HTMLSelectElement).value) || null)}
                                disabled={isLoading}
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map((department) => (
                                    <option key={department.name} value={department.name}>{department.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Service Vehicle */}
                    <div className="flex flex-col space-y-2">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Service Vehicle *
                        </label>
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 7h9v10H3V7zm9 0h5l4 4v6h-9V7zm-5 10a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <select
                                className={`flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={requestedVehicle?.name || ''}
                                onChange={(e) => setRequestedVehicle(serviceVehicles.find(sv => sv.name == (e.target as HTMLSelectElement).value) || null)}
                                disabled={isLoading}
                                required
                            >
                                <option value="">Select Service Vehicle</option>
                                {serviceVehicles.map((serviceVehicle) => {
                                    const vehicleUnavailable = unavailableVehicles.find(uv => uv[0] === serviceVehicle.name);
                                    const isVehicleUnavailable = vehicleUnavailable !== undefined;
                                    return (
                                        // temporarily allow selection of unavailable vehicles
                                        <option key={serviceVehicle.name} value={serviceVehicle.name}
                                            className={isVehicleUnavailable ? 'text-red-500/80 font-semibold' : ''}>
                                            {serviceVehicle.name} {isVehicleUnavailable ? `(Until ${new Date(vehicleUnavailable?.[1] as string).toLocaleTimeString()})` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Second row - Driver Required, Purpose, Destination */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Driver Request */}
                    <div className="flex flex-col space-y-2">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Driver Required? *
                        </label>
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <select
                                className={`flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={isDriverRequested === undefined ? '' : isDriverRequested.toString()}
                                onChange={(e) => setIsDriverRequested((e.target as HTMLSelectElement).value as 'Yes' | 'No')}
                                disabled={isLoading}
                                required
                            >
                                <option value="">Select Option</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                    </div>

                    {/* Purpose */}
                    <div className="flex flex-col space-y-2">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Purpose *
                        </label>
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Purpose"
                                className={`flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={purpose}
                                onChange={(e) => setPurpose((e.target as HTMLInputElement).value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    {/* Destination */}
                    <div className="flex flex-col space-y-2">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Destination *
                        </label>
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Destination"
                                className={`flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={destination}
                                onChange={(e) => setDestination((e.target as HTMLInputElement).value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Third row - Request Date, Time, ETA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date */}
                    <div className="flex flex-col space-y-2">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Request Date *
                        </label>
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <input
                                type="date"
                                className={`flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={dateOfRequest}
                                onChange={(e) => setDateOfRequest((e.target as HTMLInputElement).value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    {/* Time */}
                    <div className="flex flex-col space-y-2">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Time of Departure *
                        </label>
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <input
                                type="time"
                                className={`flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={timeOfRequest}
                                onChange={(e) => setTimeOfRequest((e.target as HTMLInputElement).value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    {/* ETA */}
                    <div className="flex flex-col space-y-2">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Estimated Time of Arrival *
                        </label>
                        <div className="flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <input
                                type="time"
                                className={`flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={estimatedArrival}
                                onChange={(e) => setEstimatedArrival((e.target as HTMLInputElement).value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>
                </div>
                {/* Fourth row - Remarks and Submit */}
                <div className="flex flex-col space-y-4">
                    {/* Remarks */}
                    <div className="flex flex-col space-y-2">
                        <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Remarks (Optional)
                        </label>
                        <div className="flex items-start space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mt-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                            </svg>
                            <textarea
                                rows={3}
                                placeholder="Add any additional remarks or notes..."
                                className={`flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={remarks}
                                onChange={(e) => setRemarks((e.target as HTMLTextAreaElement).value)}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-6 py-2 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap flex items-center gap-2 ${isLoading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                }`}
                        >
                            {isLoading && (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isLoading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
