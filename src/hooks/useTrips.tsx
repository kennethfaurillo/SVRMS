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
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    // Find existing trip codes for today
    const todayTripCodes = existingTrips
        .filter(trip => trip.tripCode?.startsWith(datePrefix))
        .map(trip => {
            const sequence = trip.tripCode.split('-')[1];
            return parseInt(sequence, 10);
        })
        .filter(num => !isNaN(num))
        .sort((a, b) => b - a); // Sort descending

    // Get next sequence number
    const nextSequence = todayTripCodes.length > 0 ? todayTripCodes[0] + 1 : 1;
    const sequenceStr = nextSequence.toString().padStart(4, '0');

    return `${datePrefix}-${sequenceStr}`;
};