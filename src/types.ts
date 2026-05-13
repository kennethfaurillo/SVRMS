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
  estimatedArrival?: string; // Estimated time of arrival in ISO format
  status: SVRStatus;
  remarks?: string; // Optional remarks by requester
  completedDate?: string | null; // Optional, can be null if not completed
  tripId?: string;
  // Admin Only Fields
  issueFaced?: string;
  actionTaken?: string;
  passengers?: string[];  
  itinerary?: {
    destination: string;
    time: string;
    driverSignature?: string;
  }[];
  personnel?: string[]; 
  recommendedBy?: string; 
  approvedBy?: string; 
  mechanicName?: string;
  overtimeActivity?: string;
  tripTicketNumber?: string; 
  maintenanceReportId?: string;
}

export interface DriverLog {
  timeDepartureOffice?: string;
  timeArrivalBackOffice?: string;
  gasolineIssuedConsumed?: string;
  balanceInTankStart?: string;
  purchasedDuringTrip?: string;
  totalFuel?: string;
  usedDuringTrip?: string;
  balanceInTankEnd?: string;
  speedometerBegin?: string;
  speedometerEnd?: string;
  distanceTravelled?: string;
  remarks?: string;
}

export type RequestKey = keyof Request;
export type Trip = {
  id: string; // Firebase auto-generated ID
  tripCode: string; // User-defined trip code (e.g., "250806-0001")
  dateTime: string; // Date and time of the trip in ISO format
  estimatedArrival?: string; // Estimated time of arrival in ISO format
  vehicleAssigned: string | null; // Vehicle assigned for the trip
  driverName?: string | null; // Optional, can be null if no driver assigned
  personnel: string[];
  passengers?: string[] | string;
  purpose: string[];
  destination: string;
  requestIds: string[];
  status: TripStatus;
  maintenanceChecked?: boolean;
  fuelPercentageAtStart?: number;     
  fuelInTank?: number;                
  needsRefuel?: boolean;
  refuelAmount?: number;              
  refuelRemarks?: string;

  mechanicName?: string;
  recommendedBy?: string;
  approvedBy?: string;
  speedometerReading?: string;
  driverLog?: DriverLog;
}
export type Department = {
  name: string,
  aliases?: string[]
}
export type ServiceVehicle = {
  name: string,
  model?: string,
  image?: string,
  isDefective?: boolean
}
export type SVRStatus = typeof REQUEST_STATUSES[number];
export type TripStatus = typeof TRIP_STATUSES[number];

export type Notification = {
  id: string,
  type: 'added' | 'add attempt' | 'updated' | 'update attempt' | 'deleted' | 'delete attempt',
  details: string,
  timestamp: string
}
// Add these to your types.ts
export type Vehicle = {
  id: string;
  name: string;
  status?: string; // optional, e.g., 'Active', 'Inactive'
  [key: string]: any; // allows extra fields from Firestore
}

export type Driver = {
  id: string;
  name: string;
  status?: string; // optional, e.g., 'Active', 'Inactive'
  [key: string]: any; // allows extra fields from Firestore
}
export type FilterType =
  | null
  | "Maintenance Reports"
  | "Defective Vehicles"
  | "Needs Refuel";

  export interface MaintenanceReport {
  id: string;
  trackingId: string;
  plateNumber: string;
  category: string;
  remarks: string;
  inspectedBy: string;
  conformedBy?: string;
  evidenceUrl?: string;
  timestamp: any;
  status?: string;
  checklist?: { label: string; status: "Good" | "Defective" }[];
  inspectorRemarks?: string;
  driverSection?: {
    balanceInTank?: number;
    fuelPercentage?: number;
   speedometerReading?: number;
    driverRemarks?: string;
    needsRefuel?: boolean;
    suggestedRefuelAmount?: number;
    [key: string]: any; 
  };
   driverSignature?: string;
    mechanicSignature?: string;
}
export type Item = {
  particulars: string;
  quantity: string;
  unit: string;
  location: string;
  remarks: string;
};

export type BorrowRequest = {
  hasMaintenanceChecklist: any;
  returnDate: any;
  startDate: any;
  createdAt: any;

  id?: string;
  requestNo: string;
  date: string;
  requestor: string;
  purpose: string;
  period: string;

  items: Item[];

  status?: 'Pending' | 'Approved' | 'Returned' | 'Not Returned' | 'Cancelled' | "Rescheduled";
  timestamp?: Timestamp;

  dateReturned?: string;
  receivedBy?: string;
  remarks?: string;
};

export interface Equipment {
  id?: string;
  requestNo: string;
  requestor: string;
  purpose: string;
  items: Item[];
  status?: string;
  createdAt?: Timestamp;
  dateReturned?: string;
  timestamp?: Timestamp;
}

