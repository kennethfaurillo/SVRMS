import type { DocumentData, DocumentReference, Timestamp } from "firebase/firestore";
import type { REQUEST_STATUSES, TRIP_STATUSES } from "./constants";

export type Result = {
  ok: false;
  error: unknown;
} | {
  ok: true;
  docRef?: DocumentReference<DocumentData, DocumentData>;
  message?: string;
}
export type Request = {
  id?: string; // ID will be set by Firestore
  timestamp: Timestamp; // Optional, can be null if not set 
  requestedVehicle: string | null; // Service Vehicle
  requesterName: string;  // Name of the requester
  department: string; // Department
  isDriverRequested: 'Yes' | 'No'; // Dropdown for driver request
  delegatedDriverName?: string | null; // Optional, can be null if isDriverRequested is false
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
export type RequestKey = keyof Request;
export type Trip = {
  id: string; // Firebase auto-generated ID
  tripCode: string; // User-defined trip code (e.g., "250806-0001")
  dateTime: string; // Date and time of the trip in ISO format
  vehicleAssigned: string | null; // Vehicle assigned for the trip
  driverName?: string | null; // Optional, can be null if no driver assigned
  personnel: string[];
  purpose: string[];
  destination: string;
  requestIds: string[];
  status: TripStatus;
}
export type Department = {
  name: string,
  aliases?: string[]
}
export type ServiceVehicle = {
  name: string,
  model?: string
}
export type SVRStatus = typeof REQUEST_STATUSES[number];
export type TripStatus = typeof TRIP_STATUSES[number];

export type Notification = {
  id: string,
  type: 'added' | 'add attempt' | 'updated' | 'update attempt' | 'deleted' | 'delete attempt',
  details: string,
  timestamp: string
}