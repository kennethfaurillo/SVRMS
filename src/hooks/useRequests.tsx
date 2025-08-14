import { addDoc, collection, onSnapshot, query, waitForPendingWrites } from "firebase/firestore";
import { useEffect, useRef, useState } from "preact/hooks";
import { useAuth } from "../contexts/AuthContext";
import { firebaseAuth, firebaseFirestore } from "../firebase";
import type { Request, Result, SVRStatus } from "../types";

/**
 * Custom hook to manage requests in the application.
 * Provides functionality to add, update, and delete requests in Firestore.
 */
export default function useRequests(onRequestChange?: (type: 'added' | 'modified' | 'removed', request: Request) => void) {
    const db = firebaseFirestore
    const auth = firebaseAuth

    const [requests, setRequests] = useState<Request[]>([]);
    const { user } = useAuth();
    const isInitialLoad = useRef(true);

    useEffect(() => {
        if (db && auth && user) {
            const requestsCollectionRef = collection(db, `requests`);
            const q = query(requestsCollectionRef);

            const unsubscribe = onSnapshot(q, async (snapshot) => {
                await waitForPendingWrites(firebaseFirestore)
                // Track changes for notifications (skip initial load)
                if (!isInitialLoad.current && onRequestChange) {
                    console.log("Request changes detected:", snapshot.docChanges());
                    snapshot.docChanges().forEach((change) => {
                        const request = { ...change.doc.data() as Request, id: change.doc.id };
                        onRequestChange(change.type, request);
                    });
                }
                // create a  new type for fetched requests
                const fetchedRequests: Request[] = snapshot.docs.map(doc => ({
                    ...doc.data() as Request,
                    id: doc.id
                }));
                // Custom sorting: Pending first, then Approved. Within each, sort by timestamp (most recent first).
                fetchedRequests.sort((a, b) => {
                    const statusOrder: { [key in SVRStatus]: number } = { 'Pending': 1, 'Approved': 2, 'Rescheduled': 3, 'Cancelled': 4 };
                    const statusA = statusOrder[a.status] || 99; // Default to a high number for unknown statuses
                    const statusB = statusOrder[b.status] || 99;

                    if (statusA !== statusB) {
                        return statusA - statusB; // Sort by status (Pending before Approved)
                    } else {
                        // If statuses are the same, sort by timestamp (most recent first)
                        const timestampA = a.timestamp?.toDate()?.getTime() || 0;
                        const timestampB = b.timestamp?.toDate()?.getTime() || 0;
                        return timestampB - timestampA;
                    }
                });
                setRequests(fetchedRequests);
                isInitialLoad.current = false;
                // console.log("Requests fetched successfully:", fetchedRequests);
            }, (error) => {
                console.error("Error fetching requests:", error);
                // setMessage(`Error fetching requests: ${error.message}`);
            });
            return () => unsubscribe(); // Clean up the listener on unmount
        }
    }, [user]);

    const addRequest = async (requestData: Request): Promise<Result> => {
        try {
            const docRef = await addDoc(collection(db, `requests`), requestData);
            return { ok: true, docRef };
        } catch (error) {
            console.error("Error adding document:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { ok: false, error: `Error adding document: ${errorMessage}` };
        }
    }

    return { requests, addRequest }
}
