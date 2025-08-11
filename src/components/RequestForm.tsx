import { useState } from "preact/hooks";
import { DEPARTMENTS, SERVICE_VEHICLES } from "../constants";
import type { Department, Request, ServiceVehicle } from "../types";
import { getCurrentDate, getCurrentTime } from "../utils";
import { Timestamp } from "firebase/firestore";

interface RequestFormProps {
    darkMode: boolean
    onSubmit: (requestData: Request) => Promise<void>;
    onToggle?: () => void;
}

export default function RequestForm({ darkMode, onSubmit, onToggle }: RequestFormProps) {
    const [requestedVehicle, setRequestedVehicle] = useState<ServiceVehicle | ''>('');
    const [purpose, setPurpose] = useState('');
    const [destination, setDestination] = useState('');
    const [requesterName, setRequesterName] = useState('');
    const [isDriverRequested, setIsDriverRequested] = useState<'Yes' | 'No' | undefined>(undefined);
    const [department, setDepartment] = useState<Department | ''>('');
    const [remarks, setRemarks] = useState('');
    const [dateOfRequest, setDateOfRequest] = useState(getCurrentDate());
    const [timeOfRequest, setTimeOfRequest] = useState(getCurrentTime());

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        // Validate required fields
        if (!requesterName || !requestedVehicle || !department || !purpose || !destination || !dateOfRequest || !timeOfRequest ||
            isDriverRequested === undefined) {
            alert("Please fill in all required fields.");
            return;
        }
        const requestData: Request = {
            requesterName,
            requestedVehicle,
            department,
            isDriverRequested,
            purpose,
            destination,
            requestedDateTime: new Date(`${dateOfRequest}T${timeOfRequest}`).toISOString(),
            timestamp: Timestamp.fromDate(new Date()),
            remarks,
            status: 'Pending' as const
        }
        await onSubmit(requestData); // Call the onSubmit prop with the request data
    }

    return (
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-3 rounded-lg shadow-inner`}>
            <div className="flex justify-between items-center mb-2">
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>Record New Request</h2>
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ease-in-out ${darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} cursor-pointer`}
                        title="Hide Request Form"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Hide
                    </button>
                )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-2">
                {/* Four-column grid for main fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    {/* Requester Name */}
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Requesting Personnel"
                            className={`flex-1 px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={requesterName}
                            onChange={(e) => setRequesterName((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>

                    {/* Department */}
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <select
                            className={`flex-1 px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={department}
                            onChange={(e) => setDepartment((e.target as HTMLSelectElement).value as Department | '')}
                            required
                        >
                            <option value="">Department</option>
                            {DEPARTMENTS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    {/* SV Request */}
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <select
                            className={`flex-1 px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={requestedVehicle}
                            onChange={(e) => setRequestedVehicle((e.target as HTMLSelectElement).value as ServiceVehicle | '')}
                            required
                        >
                            <option value="">Service Vehicle</option>
                            {SERVICE_VEHICLES.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    {/* Driver Request */}
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <select
                            className={`flex-1 px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={isDriverRequested === undefined ? '' : isDriverRequested.toString()}
                            onChange={(e) => setIsDriverRequested((e.target as HTMLSelectElement).value === 'true')}
                            required
                        >
                            <option value="">Driver Required?</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                </div>

                {/* Second row with Purpose, Destination, Date, Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    {/* Purpose */}
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Purpose"
                            className={`flex-1 px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={purpose}
                            onChange={(e) => setPurpose((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>

                    {/* Destination */}
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Destination"
                            className={`flex-1 px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={destination}
                            onChange={(e) => setDestination((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>

                    {/* Date */}
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <input
                            type="date"
                            className={`flex-1 px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={dateOfRequest}
                            onChange={(e) => setDateOfRequest((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>

                    {/* Time */}
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <input
                            type="time"
                            className={`flex-1 px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={timeOfRequest}
                            onChange={(e) => setTimeOfRequest((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>
                </div>

                {/* Remarks row */}
                <div className="flex items-start space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                    </svg>
                    <textarea
                        rows={1}
                        placeholder="Remarks (Optional)"
                        className={`flex-1 px-2 py-1.5 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                        value={remarks}
                        onChange={(e) => setRemarks((e.target as HTMLTextAreaElement).value)}
                    />
                    {/* Submit Button - Right aligned */}
                    <button
                        type="submit"
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer whitespace-nowrap"
                    >
                        Submit Request
                    </button>
                </div>
            </form>
        </div>
    )
}
