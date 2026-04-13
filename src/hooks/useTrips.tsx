// src/hooks/useTrips.ts
import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "preact/hooks";
import { useAuth } from "../contexts/AuthContext";
import { firebaseAuth, firebaseFirestore } from "../firebase";
import type { Trip } from "../types";

export default function useTrips(
  onTripChange?: (type: 'added' | 'modified' | 'removed', trip: Trip) => void
) {
  const db = firebaseFirestore;
  const auth = firebaseAuth;
  const { user } = useAuth();

  const [trips, setTrips] = useState<Trip[]>([]);

  const newTripCode = useMemo(() => generateTripCode(trips), [trips]);

  const todayTrips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return trips.filter(trip => {
      if (!trip.requestedDateTime) return false;

      const tripDate = new Date(trip.requestedDateTime);
      tripDate.setHours(0, 0, 0, 0);

      return tripDate.getTime() === today.getTime();
    });
  }, [trips]);

  useEffect(() => {
    if (!db || !auth || !user) return;

    const q = query(collection(db, "trips"));

    let isInitialLoad = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTrips: Trip[] = snapshot.docs.map((doc) => {
        const data = doc.data();

        // ================= STRICT: requestedDateTime ONLY =================
        let fuelSlipDate = "";
        let timestamp: number | undefined;

        const dateField = data.requestedDateTime;

        if (dateField) {
          let parsedDate: Date | null = null;

          if (dateField?.toDate && typeof dateField.toDate === "function") {
            parsedDate = dateField.toDate();
          } else {
            parsedDate = new Date(dateField);
          }

          if (parsedDate && !isNaN(parsedDate.getTime())) {
            const year = parsedDate.getFullYear();
            const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
            const day = String(parsedDate.getDate()).padStart(2, "0");

            fuelSlipDate = `${year}-${month}-${day}`;
            timestamp = parsedDate.getTime();
          }
        }

        return {
          ...data,
          id: doc.id,

          driver: data.driverName ?? "",
          passengers: Array.isArray(data.passengers) ? data.passengers : [],
          plateNumber: data.vehicleAssigned ?? "",
          tripTicketNo: data.tripCode ?? doc.id,

          fuelSlipDate, // ✅ ONLY requestedDateTime source

          purpose: Array.isArray(data.purpose)
            ? data.purpose.join(", ")
            : data.purpose ?? "",

          fuelPrice: Number(data.fuelPrice) || 0,
          fuelQuantity: Number(data.fuelQuantity) || 0,
          totalAmount: Number(data.totalAmount) || 0,

          status: data.status ?? "",
          description: data.description ?? "",
          fuelType: data.fuelType ?? "",
          requestedDateTime: data.requestedDateTime ?? null,
        } as unknown as Trip;
      });

      fetchedTrips.sort((a, b) =>
        (b.tripCode || "").localeCompare(a.tripCode || "")
      );

      setTrips(fetchedTrips);

      if (!isInitialLoad && onTripChange) {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();

          let fuelSlipDate = "";

          // STRICT AGAIN
          const dateField = data.requestedDateTime;

          if (dateField) {
            const parsedDate =
              dateField?.toDate ? dateField.toDate() : new Date(dateField);

            if (parsedDate && !isNaN(parsedDate.getTime())) {
              fuelSlipDate = `${parsedDate.getFullYear()}-${String(
                parsedDate.getMonth() + 1
              ).padStart(2, "0")}-${String(parsedDate.getDate()).padStart(2, "0")}`;
            }
          }

          const trip: Trip = {
            ...data,
            id: change.doc.id,
            driver: data.driverName ?? "",
            passengers: Array.isArray(data.passengers) ? data.passengers : [],
            plateNumber: data.vehicleAssigned ?? "",
            tripTicketNo: data.tripCode ?? change.doc.id,
            fuelSlipDate, // ✅ STRICT
            purpose: Array.isArray(data.purpose)
              ? data.purpose.join(", ")
              : data.purpose ?? "",
            fuelPrice: Number(data.fuelPrice) || 0,
            fuelQuantity: Number(data.fuelQuantity) || 0,
            totalAmount: Number(data.totalAmount) || 0,
            status: data.status ?? "",
            description: data.description ?? "",
            fuelType: data.fuelType ?? "",
          } as unknown as Trip;

          onTripChange(change.type, trip);
        });
      }

      isInitialLoad = false;
    });

    return () => unsubscribe();
  }, [db, auth, user, onTripChange]);

  return { trips, newTripCode, todayTrips };
}

// ------------------- Generate Trip Code -------------------
const generateTripCode = (existingTrips: Trip[]) => {
  const now = new Date();
  const prefix =
    now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  const today = existingTrips
    .filter(t => t.tripCode?.startsWith(prefix))
    .map(t => parseInt(t.tripCode?.split("-")[1] || "0", 10))
    .filter(n => !isNaN(n))
    .sort((a, b) => b - a);

  const next = (today[0] || 0) + 1;

  return `${prefix}-${String(next).padStart(4, "0")}`;
};