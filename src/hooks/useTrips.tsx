import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "preact/hooks";
import { useAuth } from "../contexts/AuthContext";
import { firebaseAuth, firebaseFirestore } from "../firebase";
import type { Trip } from "../types";

/**
 * Custom hook to manage trips in the application.
 * Provides functionality to fetch and manage trips from Firestore.
 */
export default function useTrips(
  onTripChange?: (type: 'added' | 'modified' | 'removed', trip: Trip) => void
) {
  const db = firebaseFirestore;
  const auth = firebaseAuth;
  const { user } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);

  // Auto-generated trip code for new trips
  const newTripCode = useMemo(() => generateTripCode(trips), [trips]);

  // Filter trips for today only
  const todayTrips = useMemo(() => {
    const today = new Date();
    return trips.filter(trip => {
      if (!trip.dateTime) return false;
      const tripDate = new Date(trip.dateTime);
      return (
        tripDate.getDate() === today.getDate() &&
        tripDate.getMonth() === today.getMonth() &&
        tripDate.getFullYear() === today.getFullYear()
      );
    });
  }, [trips]);

  useEffect(() => {
    if (!db || !auth || !user) return;

    const tripsCollectionRef = collection(db, "trips");
    const q = query(tripsCollectionRef);

    let isInitialLoad = true;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTrips: Trip[] = snapshot.docs.map(doc => {
          const data = doc.data() as Trip;

          return {
            ...data,
            id: doc.id,
            // Safely handle passengers: store as array, join for display
            passengers: Array.isArray(data.passengers) ? data.passengers.join(", ") : data.passengers ?? "",
          };
        });

        // Sort trips by tripCode descending (most recent first)
        fetchedTrips.sort((a, b) => (b.tripCode || "").localeCompare(a.tripCode || ""));

        setTrips(fetchedTrips);

        // Call onTripChange for incremental updates
        if (!isInitialLoad && onTripChange) {
          snapshot.docChanges().forEach(change => {
            const data = change.doc.data() as Trip;
            const trip = {
              ...data,
              id: change.doc.id,
              passengers: Array.isArray(data.passengers) ? data.passengers.join(", ") : data.passengers ?? "",
            };
            onTripChange(change.type, trip);
          });
        }

        isInitialLoad = false;
      },
      (error) => {
        console.error("Error fetching trips:", error);
      }
    );

    return () => unsubscribe();
  }, [db, auth, user, onTripChange]);

  return { trips, newTripCode, todayTrips };
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
      const sequence = trip.tripCode?.split('-')[1];
      return sequence ? parseInt(sequence, 10) : 0;
    })
    .filter(num => !isNaN(num))
    .sort((a, b) => b - a); // Descending

  const nextSequence = todayTripCodes.length > 0 ? todayTripCodes[0] + 1 : 1;
  const sequenceStr = nextSequence.toString().padStart(4, '0');

  return `${datePrefix}-${sequenceStr}`;
};