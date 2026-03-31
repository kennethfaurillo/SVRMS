import { collection, onSnapshot, query, waitForPendingWrites } from "firebase/firestore";
import { useEffect, useMemo, useState } from "preact/hooks";
import { useAuth } from "../contexts/AuthContext";
import { firebaseAuth, firebaseFirestore } from "../firebase";
import type { Trip } from "../types";

/**
 * Custom hook to manage trips in the application.
 * Provides functionality to fetch and manage trips from Firestore.
 */
export default function useTrips(onTripChange?: (type: 'added' | 'modified' | 'removed', trip: Trip) => void) {
    const db = firebaseFirestore
    const auth = firebaseAuth

    const [trips, setTrips] = useState<Trip[]>([]);
    const newTripCode = useMemo(() => {
        return generateTripCode(trips);
    }, [trips]);
    const { user } = useAuth();

    
    const todayTrips = useMemo(() => {
        const today = new Date();
        return trips.filter(trip => {
            const tripDate = new Date(trip?.dateTime);
            return tripDate &&
                tripDate.getDate() === today.getDate() &&
                tripDate.getMonth() === today.getMonth() &&
                tripDate.getFullYear() === today.getFullYear();
        });
    }, [trips]);

    useEffect(() => {
        let isInitialLoad = true;
        if (db && auth && user) {
            const tripsCollectionRef = collection(db, `trips`);
            const q = query(tripsCollectionRef);

            const unsubscribe = onSnapshot(q, async (snapshot) => {
                await waitForPendingWrites(firebaseFirestore)
                if (!isInitialLoad && onTripChange) {
                    snapshot.docChanges().forEach((change) => {
                        const trip = { ...change.doc.data() as Trip, id: change.doc.id };
                        onTripChange(change.type, trip);
                    });
                }
                const fetchedTrips: Trip[] = snapshot.docs.map(doc => ({
                    ...doc.data() as Trip,
                    id: doc.id
                }));

                // Sort trips by tripCode (most recent first)
                fetchedTrips.sort((a, b) => b.tripCode.localeCompare(a.tripCode));
                setTrips(fetchedTrips);
                isInitialLoad = false;
            }, (error) => {
                console.error("Error fetching trips:", error);
            });
            return () => unsubscribe(); // Clean up the listener on unmount
        }
    }, [user]);

    return { trips, newTripCode, todayTrips }
}

// Function to generate auto-filled trip code in format YYMMDD-XXXX
const generateTripCode = (existingTrips: Trip[]) => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);           // 26
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 03
    const day = now.getDate().toString().padStart(2, '0');         // 31
    
    const datePrefix = `${year}${month}${day}`;   // Example: 260331

    // Kunin ang lahat ng existing trip codes (global, hindi lang today)
    const existingNumbers = existingTrips
        .map(trip => {
            if (!trip.tripCode) return NaN;
            const parts = trip.tripCode.split('-');
            return parseInt(parts[1], 10);
        })
        .filter(num => !isNaN(num));

    // Kunin ang pinakamataas na numero sa buong system + 1
    const highestNumber = existingNumbers.length > 0 
        ? Math.max(...existingNumbers) 
        : 0;

    const nextNumber = highestNumber + 1;
    const sequenceStr = nextNumber.toString().padStart(4, '0');

    return `${datePrefix}-${sequenceStr}`;   // Example: 260331-0001
};