import { App } from "./app";
import { AuthProvider } from "./contexts/AuthContext";

export default function AppWithProviders  () {
    return (
        <AuthProvider>
            <App />
        </AuthProvider>
    )
} 