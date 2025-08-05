interface LoaderProps {
    darkMode?: boolean;
}

export default function Loader({ darkMode = false }: LoaderProps) {
    return (
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-100 to-purple-200'}`}>
            <div className="text-center">
                {/* Spinner */}
                <div className="relative mb-6">
                    <div className={`w-16 h-16 border-4 border-solid rounded-full animate-spin mx-auto ${darkMode ? 'border-gray-600 border-t-blue-400' : 'border-gray-300 border-t-blue-600'}`}></div>
                </div>
                
                {/* Loading text */}
                <div className={`text-lg font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Loading Service Vehicle Request System...
                </div>
                
                {/* Subtitle */}
                <div className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Authenticating user and initializing system
                </div>
                
                {/* Animated dots */}
                <div className={`mt-4 flex justify-center space-x-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
            </div>
        </div>
    );
}
