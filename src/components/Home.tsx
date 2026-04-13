import { useState, useEffect } from "preact/hooks";
import type { ReactNode } from "preact/compat";
import { Link } from "wouter-preact";
import {
  ChartColumnIcon,
  ClipboardClockIcon,
  FileTextIcon,
  MapPinCheckIcon,
  UsersIcon,
  FileBarChartIcon,
  ClipboardIcon,
  CarIcon,
  BikeIcon,
  DropletIcon,
  WrenchIcon,
} from "lucide-react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { firebaseFirestore } from "../firebase";

/* ---------------- VEHICLE TYPES ---------------- */
const vehicleTypes: Record<
  string,
  { description: string; imageUrl?: string }
> = {
  "SKU 532": { description: "SKU 532", imageUrl: "/images/sku532.jpg" },
  "SEH 336": { description: "Van", imageUrl: "/images/van.png" },
  "TRYC. NO. 02": { description: "SIDECAR 2", imageUrl: "/images/TRYC. NO. 02.jpg" },
  "TRYC. NO. 01": { description: "SIDECAR 1", imageUrl: "/images/TRYC. NO. 01.jpg" },
  "TRYC. NO. 03": { description: "SIDECAR 3", imageUrl: "/images/TRYC. NO. 03.jpg" },
  "SBA 1406": { description: "MITSUBISHI STRADA", imageUrl: "/images/SBA 1406.jpg" },
  "SAB 6183": { description: "ISUZU VAN", imageUrl: "/images/SAB 6183.jpg" },
  "SBA 1045": { description: "MITSUBISHI STRADA", imageUrl: "/images/SBA 1045.jpg" },
  "131202": { description: "MULTICAB", imageUrl: "/images/131202 - Multicab.jpg" },
  "MV 291": { description: "RS 125 GRAY", imageUrl: "/images/rs125_gray.jpg" },
  "MV 231": { description: "RS 125", imageUrl: "/images/rs125.jpg" },
  "131206": { description: "TRUCK", imageUrl: "/images/131206.jpg" },
  "TRYC. NO. 04": { description: "SIDECAR 4", imageUrl: "/images/TRYC. NO. 04.jpg" },
  "SAB 6182": { description: "VAN", imageUrl: "/images/SAB 6182.jpg" },
  "SAA 7857": { description: "L300", imageUrl: "/images/SAA 7857.jpg" },
  "SAA 6494": { description: "TRUCK DROP SIDE", imageUrl: "/images/SAA 6494.jpg" },
  "SEH 673": { description: "VAN", imageUrl: "/images/SEH 673.jpg" },
  "MV 287": { description: "RS 125 BLACK", imageUrl: "/images/MV 287.jpg" },
};

/* ---------------- TYPES ---------------- */
interface VehicleAvailabilityItem {
  plateNumber: string;
  description: string;
  status: string;
}

interface MaintenanceReport {
  plateNumber: string;
  status: "Defective" | "Completed" | "Pending";
}

/* ---------------- COMPONENT ---------------- */
export default function Home() {
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);

  const [availability, setAvailability] = useState<VehicleAvailabilityItem[]>([]);
  const [maintenanceReports, setMaintenanceReports] = useState<MaintenanceReport[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  /* ---------------- MAINTENANCE REPORTS ---------------- */
  useEffect(() => {
    const reportsRef = collection(firebaseFirestore, "maintenanceReports");
    const unsubscribe = onSnapshot(reportsRef, snapshot => {
      const reports: MaintenanceReport[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return { plateNumber: data.plateNumber ?? "", status: data.status ?? "Pending" };
      });
      setMaintenanceReports(reports);
    });
    return () => unsubscribe();
  }, []);

  /* ---------------- VEHICLE AVAILABILITY ---------------- */
  useEffect(() => {
    const tripsRef = collection(firebaseFirestore, "trips");
    const q = query(tripsRef);

    const unsubscribe = onSnapshot(q, snapshot => {
      const trips = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          tripCode: data.tripCode ?? "",
          plateNumber: data.vehicleAssigned ?? "",
          dateTime: data.dateTime ?? "",
          status: data.status ?? "",
        };
      });

      const todayStr = new Date().toISOString().slice(0, 10);

      const availabilityList = Object.entries(vehicleTypes).map(([plate, vehicle]) => {
        const assignedTrip = trips.find(
          trip =>
            trip.plateNumber === plate &&
            trip.dateTime?.slice(0, 10) === todayStr &&
            trip.status !== "Fulfilled"
        );
        return {
          plateNumber: plate,
          description: vehicle.description,
          status: assignedTrip ? `Assigned (${assignedTrip.tripCode})` : "Available",
        };
      });

      setAvailability(availabilityList);
      setLoadingVehicles(false);
    });

    return () => unsubscribe();
  }, []);

  const anyAvailable = availability.some(v => v.status === "Available");

  /* ---------------- BULLETINS ---------------- */
  const bulletins = [
    { id: 1, title: "Vehicle Maintenance Alert", description: "Check SKU 532 for oil change." },
    { id: 2, title: "New Guidelines", description: "Submit requests 2 days in advance." },
    { id: 3, title: "System Update", description: "Analytics module down tonight 10 PM - 12 AM." },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen w-full px-6 py-6">
      {/* BULLETINS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {bulletins.map(b => (
          <div
            key={b.id}
            className="flex flex-col bg-white p-4 rounded-xl shadow hover:shadow-md transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              {b.title.includes("Maintenance") && <CarIcon className="w-5 h-5 text-blue-600" />}
              {b.title.includes("Guidelines") && <ClipboardIcon className="w-5 h-5 text-teal-600" />}
              {b.title.includes("Update") && <FileTextIcon className="w-5 h-5 text-amber-600" />}
              <span>{b.title}</span>
            </div>
            <p className="text-slate-700 text-xs mt-2">{b.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-3"></div>

      {/* DASHBOARD */}
      <div className="w-full flex gap-4">
        {/* LEFT PANEL */}
        <div className="w-[20%] flex flex-col gap-4">
          <HomeCard
            href="/request-form"
            title="Request Form"
            icon={<FileTextIcon className="w-8 h-8 text-blue-600" />}
            description="Create a new vehicle service request"
          />
          <HomeCard
            href="/requests"
            title="Requests"
            icon={<ClipboardClockIcon className="w-8 h-8 text-amber-600" />}
            description="View and manage your service requests"
          />
          <HomeCard
            href="/trips"
            title="Approved Trips"
            icon={<MapPinCheckIcon className="w-8 h-8 text-green-600" />}
            description="Track your approved vehicle trips"
          />

          {/* Maintenance Dropdown */}
          <div className="relative">
            <div
              onClick={() => setShowMaintenance(!showMaintenance)}
              className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                  <ClipboardIcon className="w-8 h-8 text-teal-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">Maintenance Checklist</h2>
                <p className="text-slate-600 text-center">
                  Track and Manage Vehicle Maintenance Tasks
                </p>
              </div>
            </div>
            {showMaintenance && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-3 flex flex-col space-y-1 z-50">
                <Link href="/maintenance/automotive">
                  <DropdownItem icon={<CarIcon className="w-6 h-6 text-teal-600" />} label="Automotive" />
                </Link>
                <Link href="/maintenance/motorcycle">
                  <DropdownItem icon={<BikeIcon className="w-6 h-6 text-teal-600" />} label="Motorcycle/Trimobile" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* CENTER PANEL */}
        <div className="w-[60%]">
          <VehicleAvailabilityPanel
            availability={availability}
            maintenanceReports={maintenanceReports}
            loading={loadingVehicles}
            anyAvailable={anyAvailable}
          />
        </div>

        {/* RIGHT PANEL */}
        <div className="w-[20%] flex flex-col gap-4">
          <HomeCard
            href="/analytics"
            title="Data & Analytics"
            icon={<ChartColumnIcon className="w-8 h-8 text-purple-600" />}
            description="Analyze vehicle usage data"
          />

          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm opacity-60">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <UsersIcon className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Management</h2>
              <p className="text-slate-600">Manage drivers & vehicles</p>
            </div>
          </div>

          {/* Reports Dropdown */}
<div className="relative">
  <div
    onClick={() => setShowReports(!showReports)}
    className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition"
  >
    <div className="flex flex-col items-center text-center space-y-3">
      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
        <FileBarChartIcon className="w-8 h-8 text-indigo-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-800">Reports</h2>
      <p className="text-slate-600">Generate service reports</p>
    </div>
  </div>

  {showReports && (
    <div
      className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-3 flex flex-col space-y-1 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <Link href="/fuel-reports">
        <div onClick={() => setShowReports(false)}>
          <DropdownItem
            icon={<DropletIcon className="w-6 h-6 text-indigo-600" />}
            label="Fuel Reports"
          />
        </div>
      </Link>

      <Link href="/maintenance-reports">
        <div onClick={() => setShowReports(false)}>
          <DropdownItem
            icon={<WrenchIcon className="w-6 h-6 text-indigo-600" />}
            label="Maintenance Reports"
          />
        </div>
      </Link>

      {/* ✅ FIXED: Borrow Reports */}
      <Link href="/borrow-report">
        <div onClick={() => setShowReports(false)}>
          <DropdownItem
            icon={<ClipboardClockIcon className="w-6 h-6 text-indigo-600" />}
            label="Borrow Reports"
          />
        </div>
      </Link>
    </div>
  )}
</div>
          {/* Equipment Borrow Dropdown */}
<div className="relative">
  <div
    onClick={() => setShowEquipment(!showEquipment)}
    className="cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 p-6 rounded-xl shadow-sm hover:shadow-md transition"
  >
    <div className="flex flex-col items-center text-center space-y-3">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <WrenchIcon className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-800">
        Equipment Borrow
      </h2>
      <p className="text-slate-600">
        Borrow and manage equipment requests
      </p>
    </div>
  </div>

  {showEquipment && (
    <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-3 flex flex-col space-y-1 z-50">
      
      <Link href="/borrow-form">
        <DropdownItem
          icon={<FileTextIcon className="w-6 h-6 text-red-600" />}
          label="Borrow Form"
        />
      </Link>

      <Link href="/borrow-requests">
        <DropdownItem
          icon={<ClipboardClockIcon className="w-6 h-6 text-red-600" />}
          label="Borrow Request"
        />
      </Link>

      <Link href="/borrow-checklist">
  <DropdownItem
    icon={<ClipboardIcon className="w-6 h-6 text-red-600" />}
    label="Checklist"
  />
</Link>

    </div>
  )}
</div>         
        </div>
      </div>
    </div>
  );
}

/* ----------------- COMPONENTS ----------------- */

function HomeCard({ href, title, icon, description }: { href: string; title: string; icon: ReactNode; description: string }) {
  return (
    <Link href={href}>
      <div className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">{icon}</div>
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <p className="text-slate-600">{description}</p>
      </div>
    </Link>
  );
}

function DropdownItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
      {icon}
      <span className="text-slate-700 font-medium">{label}</span>
    </div>
  );
}

function VehicleAvailabilityPanel({
  availability,
  maintenanceReports,
  loading,
  anyAvailable,
}: {
  availability: VehicleAvailabilityItem[];
  maintenanceReports: MaintenanceReport[];
  loading: boolean;
  anyAvailable: boolean;
}) {
  return (
    <div className="w-full bg-white p-6 rounded-xl shadow flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4 text-center">Vehicle Availability</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-5 gap-4 w-full">
          {availability.map(v => {
            const defectiveReport = maintenanceReports.find(r => r.plateNumber === v.plateNumber && r.status === "Defective");
            const isAssigned = v.status.startsWith("Assigned");

            let statusText = "Available";
            let statusColor = "text-green-600";
            if (defectiveReport) {
              statusText = "Under Maintenance";
              statusColor = "text-red-600";
            } else if (isAssigned) {
              statusText = v.status;
              statusColor = "text-yellow-600";
            }

            return (
              <div key={v.plateNumber} className="flex flex-col items-center bg-gray-50 p-4 rounded-xl shadow">
                {/* IMAGE */}
                {vehicleTypes[v.plateNumber]?.imageUrl ? (
                  <img
                    src={vehicleTypes[v.plateNumber].imageUrl}
                    alt={v.description}
                    className="w-32 h-20 object-cover rounded-xl"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-32 h-20 bg-slate-200 flex items-center justify-center font-bold text-base rounded-xl">
                    {v.description.slice(0, 2)}
                  </div>
                )}

                <p className="text-xs font-semibold mt-2 text-center">{v.description}</p>
                <p className="text-xs text-slate-500 mt-1 text-center">{v.plateNumber}</p>
                <p className={`text-xs font-medium mt-1 ${statusColor}`}>{statusText}</p>
              </div>
            );
          })}
        </div>
      )}
      <Link href={anyAvailable ? "/request-form" : "#"} className="w-full mt-4">
        <button
          className={`w-full py-3 rounded text-white font-semibold ${
            anyAvailable ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"
          }`}
          disabled={!anyAvailable}
        >
          Proceed to Request Form
        </button>
      </Link>
    </div>
  );
}