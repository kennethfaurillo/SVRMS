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
    const [isDriverRequested, setIsDriverRequested] = useState<boolean | undefined>(undefined);
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
        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-6 rounded-lg shadow-inner`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-700'}`}>Record New Request</h2>
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out ${darkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} cursor-pointer`}
                        title="Hide Request Form"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Hide Form
                    </button>
                )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Two-column grid for main fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Requester Name */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Requesting Personnel
                        </label>
                        <input
                            type="text"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={requesterName}
                            onChange={(e) => setRequesterName((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>

                    {/* Department */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Department
                        </label>
                        <select
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={department}
                            onChange={(e) => setDepartment((e.target as HTMLSelectElement).value as Department | '')}
                            required
                        >
                            <option value="">-- Select Department --</option>
                            {DEPARTMENTS.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    {/* SV Request */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Service Vehicle
                        </label>
                        <select
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={requestedVehicle}
                            onChange={(e) => setRequestedVehicle((e.target as HTMLSelectElement).value as ServiceVehicle | '')}
                            required
                        >
                            <option value="">-- Select Vehicle --</option>
                            {SERVICE_VEHICLES.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    {/* Driver Request */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Driver Required
                        </label>
                        <select
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={isDriverRequested === undefined ? '' : isDriverRequested.toString()}
                            onChange={(e) => setIsDriverRequested((e.target as HTMLSelectElement).value === 'true')}
                            required
                        >
                            <option value="">-- Select --</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>

                    {/* Purpose */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Purpose
                        </label>
                        <input
                            type="text"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={purpose}
                            onChange={(e) => setPurpose((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>

                    {/* Destination */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Destination
                        </label>
                        <input
                            type="text"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={destination}
                            onChange={(e) => setDestination((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Date
                        </label>
                        <input
                            type="date"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={dateOfRequest}
                            onChange={(e) => setDateOfRequest((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>

                    {/* Time */}
                    <div>
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Time
                        </label>
                        <input
                            type="time"
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                            value={timeOfRequest}
                            onChange={(e) => setTimeOfRequest((e.target as HTMLInputElement).value)}
                            required
                        />
                    </div>
                </div>

                {/* Remarks - Full width */}
                <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Remarks (Optional)
                    </label>
                    <textarea
                        rows={2}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-600 text-white border-gray-500' : 'border-gray-300'}`}
                        value={remarks}
                        onChange={(e) => setRemarks((e.target as HTMLTextAreaElement).value)}
                        placeholder="Enter any additional remarks..."
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                >
                    Submit Request
                </button>
            </form>
        </div>
    )
}
