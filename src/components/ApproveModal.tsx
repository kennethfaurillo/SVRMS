import { useState } from "preact/hooks";
import type { Request } from "../types";

interface ApproveModalProps {
    darkMode: boolean;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (tripId: string) => Promise<void>;
    request: Request | null;
}

// Function to generate auto-filled trip ID in format YYMMDD-XXXX
const generateTripId = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const sequence = '0001'; // Default sequence, could be auto-incremented in real implementation
    return `${year}${month}${day}-${sequence}`;
};

export default function ApproveModal({ darkMode, isOpen, onClose, onSubmit, request }: ApproveModalProps) {
    const [tripId, setTripId] = useState(() => generateTripId());
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!tripId.trim()) {
            alert('Please enter a trip ID');
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit(tripId);
            onClose();
            // Reset trip ID for next use
            setTripId(generateTripId());
        } catch (error) {
            console.error('Approve error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setTripId(generateTripId());
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
                    <p className="text-sm"><strong>Requester:</strong> {request.requesterName}</p>
                    <p className="text-sm"><strong>Department:</strong> {request.department}</p>
                    <p className="text-sm"><strong>Purpose:</strong> {request.purpose}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Trip ID
                        </label>
                        <input
                            type="text"
                            value={tripId}
                            onChange={(e) => setTripId((e.target as HTMLInputElement).value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-300'}`}
                            placeholder="YYMMDD-XXXX"
                            pattern="\d{6}-\d{4}"
                            title="Format: YYMMDD-XXXX (e.g., 250806-0001)"
                            disabled={isLoading}
                            required
                        />
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Format: YYMMDD-XXXX (e.g., 250806-0001)
                        </p>
                    </div>

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
