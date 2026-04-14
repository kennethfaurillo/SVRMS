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

            // BASIC INFO
            requestNo: data.requestNo ?? "",
            requestor: data.requestor ?? "",
            purpose: data.purpose ?? "",

            // DATES
            startDate: data.startDate ?? "",
            returnDate: data.returnDate ?? "",
            date: data.date ?? "",

            // STATUS
            status: data.status ?? "Pending",

            // ITEMS
            items: Array.isArray(data.items) ? data.items : [],

            // TIMESTAMPS
            createdAt: data.createdAt ?? null,
            timestamp: data.timestamp ?? null,

            // RETURN INFO
            returnedAt: data.returnedAt ?? null,
            dateReturned: data.dateReturned ?? null,
            receivedBy: data.receivedBy ?? "",

            // 🔥 IMPORTANT FIX (ITO ANG PROBLEMA MO)
            hasMaintenanceChecklist: data.hasMaintenanceChecklist ?? false,

            // 🔥 OPTIONAL BUT VERY USEFUL
            checklist: Array.isArray(data.checklist) ? data.checklist : [],
            checklistSubmittedAt: data.checklistSubmittedAt ?? null,

          } as unknown as BorrowRequest;
        });

        // 🔥 SORT NEWEST FIRST
        requests.sort((a, b) => {
          const getTime = (r: BorrowRequest) => {
            const dateObj =
              (r.createdAt as any)?.toDate?.() ||
              (r.timestamp as any)?.toDate?.() ||
              new Date(r.date || r.startDate || 0);

            return new Date(dateObj).getTime();
          };

          return getTime(b) - getTime(a);
        });

        console.log("🔥 UPDATED REQUESTS:", requests); // debug

        setBorrowRequests(requests);
      },
      (error) => {
        console.error("❌ Error fetching borrow requests:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return { borrowRequests };
}