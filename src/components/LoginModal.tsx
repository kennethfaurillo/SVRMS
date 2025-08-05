import { useState } from "preact/hooks";
import { useAuth } from "../contexts/AuthContext";

interface LoginModalProps {
    darkMode: boolean;
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ darkMode, isOpen, onClose }: LoginModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { signInUser } = useAuth();

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await signInUser(email, password);
            onClose();
            // Reset form
            setEmail('');
            setPassword('');
        } catch (error) {
            console.error('Login error:', error);
            setError('Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setPassword('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${darkMode ? 'bg-gray-900 bg-opacity-20' : 'bg-gray-600 bg-opacity-20'}`}>
            <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} p-6 rounded-lg shadow-xl w-full max-w-md mx-4`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Sign In</h2>
                    <button
                        onClick={handleClose}
                        className={`text-gray-500 hover:text-gray-700 ${darkMode ? 'hover:text-gray-300' : ''}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-300'}`}
                            placeholder="Enter your email"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-300'}`}
                            placeholder="Enter your password"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className={`flex-1 py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                <div className={`mt-4 text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p>Don't have an account? Contact your administrator.</p>
                </div>
            </div>
        </div>
    );
}
