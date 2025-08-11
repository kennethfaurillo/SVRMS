import { collection, onSnapshot, query, waitForPendingWrites } from "firebase/firestore";
import { useEffect, useMemo, useState } from "preact/hooks";
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
    const newTripCode = useMemo(() => {
        return generateTripCode(trips);
    }, [trips]);
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

    return { trips, newTripCode }
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