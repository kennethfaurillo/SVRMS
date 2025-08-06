import { collection, onSnapshot, query, waitForPendingWrites } from "firebase/firestore";
import { useEffect, useState } from "preact/hooks";
import { useAuth } from "../contexts/AuthContext";
import { firebaseAuth, firebaseFirestore } from "../firebase";
import type { Trip } from "../types";

/**
 * Custom hook to manage trips in the application.
 * Provides functionality to fetch and manage trips from Firestore.
 */
export default function useTrips() {
    const db = firebaseFirestore
    const auth = firebaseAuth

    const [trips, setTrips] = useState<Trip[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        if (db && auth && user) {
            const tripsCollectionRef = collection(db, `trips`);
            const q = query(tripsCollectionRef);

            const unsubscribe = onSnapshot(q, async (snapshot) => {
                await waitForPendingWrites(firebaseFirestore)
                // create a new type for fetched trips
                const fetchedTrips: Trip[] = snapshot.docs.map(doc => ({
                    ...doc.data() as Trip,
                    id: doc.id
                }));
                
                // Sort trips by ID (most recent first)
                fetchedTrips.sort((a, b) => b.id.localeCompare(a.id));
                setTrips(fetchedTrips);
                // console.log("Trips fetched successfully:", fetchedTrips);
            }, (error) => {
                console.error("Error fetching trips:", error);
            });
            return () => unsubscribe(); // Clean up the listener on unmount
        }
    }, [user]);

    return { trips }
}
