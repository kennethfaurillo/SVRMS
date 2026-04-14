// src/types.ts
import type { DocumentData, DocumentReference, Timestamp } from "firebase/firestore";
import type { REQUEST_STATUSES, TRIP_STATUSES } from "./constants";

// -------------------
// Result type for operations
// -------------------
export type Result =
  | { ok: false; error: unknown }
  | { ok: true; docRef?: DocumentReference<DocumentData, DocumentData>; message?: string };

// -------------------
// Request (trip request) type
// -------------------
export type Request = {
  id?: string; // Firestore ID
  timestamp: Timestamp;
  requestedVehicle: string | null;
  requesterName: string;
  department: string;
  isDriverRequested: 'Yes' | 'No';
  delegatedDriverName?: string | null;
  purpose: string;
  destination: string;
  requestedDateTime: string; // ISO string
  estimatedArrival?: string; // ISO string
  status: SVRStatus;
  remarks?: string;
  completedDate?: string | null;
  tripId?: string;
  issueFaced?: string;
  actionTaken?: string;
  passengers?: string[];
};

export type RequestKey = keyof Request;

// -------------------
// Trip type
// -------------------
export type Trip = {
  requestedDateTime: any;
  fuelPrice: number;
  id: string;                  // Firestore document ID
  tripTicketNo: string;        // maps from tripCode for FuelReports
  tripCode: string;            // Firestore trip code, e.g., "250826-0001"
  dateTime: string;            // ISO string
  estimatedArrival?: string;   // ISO string
  vehicleAssigned: string | null; // Vehicle name / plate
  driverName?: string | null;  // Firestore driver
  personnel: string[];
  passengers?: string[];       // array of passenger names
  purpose?: string;            // single string (FuelReports-friendly)
  destination: string;
  requestIds: string[];
  status: TripStatus;

  // Computed / display fields for FuelReports
  plateNumber?: string;        // maps from vehicleAssigned
  driver?: string;             // maps from driverName
  fuelSlipDate?: string;       // formatted estimatedArrival
};

// -------------------
// Department type
// -------------------
export type Department = {
  name: string;
  aliases?: string[];
};

// -------------------
// ServiceVehicle type
// -------------------
export type ServiceVehicle = {
  description: string;
  name: string;
  model?: string;
  image?: string;
};

// -------------------
// Status types
// -------------------
export type SVRStatus = typeof REQUEST_STATUSES[number];
export type TripStatus = typeof TRIP_STATUSES[number];

// -------------------
// Notification type
// -------------------
export type Notification = {
  id: string;
  type: 'added' | 'add attempt' | 'updated' | 'update attempt' | 'deleted' | 'delete attempt';
  details: string;
  timestamp: string;
};

// -------------------
// Vehicle type
// -------------------
export type Vehicle = {
  id: string;
  name: string;
  status?: string; // optional, e.g., 'Active', 'Inactive'
  [key: string]: any; // allow extra fields from Firestore
};

// -------------------
// Driver type
// -------------------
export type Driver = {
  id: string;
  name: string;
  status?: string; // optional, e.g., 'Active', 'Inactive'
  [key: string]: any;
};

// -------------------
// Equipment Borrow Request Types (NEW)
// -------------------
export type Item = {
  particulars: string;
  quantity: string;
  remarks: string;
};

export type BorrowRequest = {
  hasMaintenanceChecklist: any;
  returnDate: any;
  startDate: any;
  createdAt: any;
  id?: string;
  requestNo: string;
  date: string;                    // YYYY-MM-DD format from the form
  requestor: string;
  purpose: string;
  period: string;                  // Intended Period of Use
  items: Item[];
  status?: 'Pending' | 'Approved' | 'Returned' | 'Cancelled';
  timestamp?: Timestamp;
  dateReturned?: string;
  receivedBy?: string;
  remarks?: string;
};