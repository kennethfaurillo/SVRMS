import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "preact/hooks";
import { firebaseFirestore } from "../firebase";
import type { BorrowRequest } from "../types";

export default function useBorrowRequests() {
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firebaseFirestore, "borrowRequests"),
      (snapshot) => {
        const requests: BorrowRequest[] = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            requestNo: data.requestNo ?? "",
            requestor: data.requestor ?? "",
            purpose: data.purpose ?? "",

            startDate: data.startDate ?? "",
            returnDate: data.returnDate ?? "",

            // Keep original status case
            status: data.status ?? "Pending",

            items: Array.isArray(data.items) ? data.items : [],

            // Keep original date objects (Timestamp or string)
            createdAt: data.createdAt ?? null,
            timestamp: data.timestamp ?? null,

            // ✅ IMPORTANT: Do NOT normalize returnedAt here
            returnedAt: data.returnedAt ?? null, // Primary field
            dateReturned: data.dateReturned ?? null, // Fallback (old data)

            receivedBy: data.receivedBy ?? "",
          } as unknown as BorrowRequest;
        });

        // Sort newest first
        requests.sort((a, b) => {
          const getTime = (r: BorrowRequest) => {
            const dateObj =
              (r.createdAt as any)?.toDate?.() ||
              (r.timestamp as any)?.toDate?.() ||
              new Date(r.startDate || 0);

            return new Date(dateObj).getTime();
          };

          return getTime(b) - getTime(a);
        });

        setBorrowRequests(requests);
      },
      (error) => {
        console.error("Error fetching borrow requests:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return { borrowRequests };
}