import { useEffect, useState } from "preact/hooks";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { firebaseFirestore } from "../firebase";
import type { BorrowRequest } from "../types";

export default function useEquipment() {
  const [equipment, setEquipment] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔥 REAL-TIME LISTENER
  useEffect(() => {
    const q = collection(firebaseFirestore, "borrowRequests");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: BorrowRequest[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as BorrowRequest),
      }));

      setEquipment(items);
    });

    return () => unsubscribe();
  }, []);

  // =========================
  // ⚙️ ACTIONS (BUSINESS LOGIC)
  // =========================

  // MARK AS RETURNED
  const markAsReturned = async (id: string) => {
    if (!id) return;

    setLoading(true);

    try {
      await updateDoc(doc(firebaseFirestore, "borrowRequests", id), {
        dateReturned: new Date().toISOString(),
        returnedAt: Timestamp.now(),
      });

      // OPTIONAL: hook point for notification
      // addNotification("updated", "Equipment marked as returned", "request");

    } catch (error) {
      console.error("Error marking as returned:", error);
    } finally {
      setLoading(false);
    }
  };

  // MARK AS NOT RETURNED
  const markAsNotReturned = async (id: string) => {
    if (!id) return;

    setLoading(true);

    try {
      await updateDoc(doc(firebaseFirestore, "borrowRequests", id), {
        dateReturned: null,
        returnedAt: null,
      });

      // OPTIONAL: notification hook point
      // addNotification("updated", "Equipment marked as not returned", "request");

    } catch (error) {
      console.error("Error marking as not returned:", error);
    } finally {
      setLoading(false);
    }
  };

  // DELETE EQUIPMENT RECORD
  const deleteEquipment = async (id: string) => {
    if (!id) return;

    const confirmDelete = confirm("Are you sure you want to delete this record?");
    if (!confirmDelete) return;

    setLoading(true);

    try {
      await deleteDoc(doc(firebaseFirestore, "borrowRequests", id));
    } catch (error) {
      console.error("Error deleting equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    equipment,
    loading,
    markAsReturned,
    markAsNotReturned,
    deleteEquipment,
  };
}