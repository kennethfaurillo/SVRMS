import type { DocumentData, DocumentReference, Timestamp } from "firebase/firestore";
import type { DEPARTMENTS, REQUEST_STATUSES, SERVICE_VEHICLES, TRIP_STATUSES } from "./constants";

export type Result = {
  ok: false;
  error: unknown;
} | {
  ok: true;
  docRef?: DocumentReference<DocumentData, DocumentData>;
  message?: string;
}
export type Request = {
  id: string; // ID will be set by Firestore
  timestamp: Timestamp; // Optional, can be null if not set 
  requestedVehicle: ServiceVehicle; // SV Request type
  requesterName: string;
  department: Department;
  isDriverRequested: boolean;
  delegatedDriverName?: string; // Optional, can be null if isDriverRequested is false
  purpose: string;
  destination: string;
  requestedDateTime: string; // Combined requested date and time in ISO format
  status: SVRStatus;
  remarks?: string; // Optional remarks by requester
  completedDate?: string | null; // Optional, can be null if not completed
  tripId?: string;
  // Admin Only Fields
  issueFaced?: string;
  actionTaken?: string;
}
export type Trip = {
  id: string; // Firebase auto-generated ID
  tripCode: string; // User-defined trip code (e.g., "250806-0001")
  requests: Request[];
  completedDate: Timestamp | null;
  status: TripStatus;
}
export type Department = typeof DEPARTMENTS[number];
export type ServiceVehicle = typeof SERVICE_VEHICLES[number];
export type SVRStatus = typeof REQUEST_STATUSES[number];
export type TripStatus = typeof TRIP_STATUSES[number];

export type Notification = {
  id: string, 
  type: 'added' | 'add attempt' | 'updated' | 'update attempt' | 'deleted' | 'delete attempt',
  details: string,
  timestamp: string
}