import { ChartColumnIcon, ClipboardClockIcon, FileTextIcon, MapPinCheckIcon, UsersIcon, FileBarChartIcon, ClipboardIcon, CarIcon, BikeIcon } from "lucide-react";
import { useState, useEffect } from "preact/hooks";
import type { ReactNode } from "preact/compat";
import { Link } from "wouter-preact";
import { collection, query, onSnapshot, addDoc, deleteDoc, orderBy, doc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { firebaseFirestore } from "../firebase";

const vehicleTypes = {
  "SKU 532": { description: "SKU 532" },
  "SEH 336": { description: "SEH 336" },
  "TRYC. NO. 02": { description: "TRYC. NO. 02" },
  "TRYC. NO. 01": { description: "TRYC. NO. 01" },
   "TRYC. NO. 03": { description: "TRYC. NO. 03" },
   "SBA 1406": { description: "SBA 1406" },
   "SAB 6183": { description: "SAB 6183" },
   "SBA 1045": { description: "SBA 1045" },
   "131202": { description: "131202" },
   "MV291": { description: "MV 291" },
   "MV231": { description: "MV 231" },
   "131206": { description: "131206" },
   "TRYC. NO. 04": { description: "TRYC. NO. 04" },
   "SAB 6182": { description: "SAB 6182" },
   "SAA 7857": { description: "SAA 7857" },
   "SAA 6494": { description: "SAA 6494" },
   "SEH 673": { description: "SEH 673" },
   "MV287": { description: "MV 287" },
};
interface VehicleAvailabilityItem {
  plateNumber: string;
  description: string;
  status: string;
} 

interface MaintenanceReport {
  plateNumber: string;
  checklist: { id: number; label: string; status: string }[];
}

export default function Home() {
  
    const { isAdmin } = useAuth();
    const [showMaintenance, setShowMaintenance] = useState(false);
    const [bulletinsData, setBulletinsData] = useState<any[]>([]);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [availability, setAvailability] = useState<VehicleAvailabilityItem[]>([]);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
     const [maintenanceReports, setMaintenanceReports] = useState<MaintenanceReport[]>([]);
  useEffect(() => {
    const reportsRef = collection(firebaseFirestore, "maintenanceReports");
    const unsubscribe = onSnapshot(reportsRef, snapshot => {
      const reports: MaintenanceReport[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          plateNumber: data.plateNumber ?? "",
          checklist: data.checklist ?? [],
        };
      });
      setMaintenanceReports(reports);
    });
    return () => unsubscribe();
  }, []);
    useEffect(() => {
        const tripsRef = collection(firebaseFirestore, "trips");
        const q = query(tripsRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const trips = snapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    tripCode: data.tripCode ?? "",
                    plateNumber: data.vehicleAssigned ?? "",
                    dateTime: data.dateTime ?? "",
                    status: data.status ?? "",
                };
            });

            const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); 
    const availabilityList = Object.entries(vehicleTypes).map(([plate, vehicle]) => {
     
      const assignedTrip = trips.find((trip) => {
        if (!trip.plateNumber || trip.status === "Fulfilled") return false;

        const tripDate = new Date(trip.dateTime);
        return (
          trip.plateNumber === plate &&
          tripDate.getFullYear() === currentYear &&
          tripDate.getMonth() === currentMonth
        );
      });

                return {
                    plateNumber: plate,
                    description: vehicle.description,
                    status: assignedTrip
                        ? `Assigned (${assignedTrip.tripCode})`
                        : "Available",
                };
            });

            setAvailability(availabilityList);
            setLoadingVehicles(false);
        });

        return () => unsubscribe();
    }, []);

          useEffect(() => {
          const q = query(
            collection(firebaseFirestore, "bulletins"),
            orderBy("createdAt", "desc")
          );

          const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setBulletinsData(data);
          });

          return () => unsub();
        }, []);

                const addBulletin = async () => {
          if (!isAdmin) return;

          await addDoc(collection(firebaseFirestore, "bulletins"), {
            title: newTitle,
            description: newDesc,
            createdAt: new Date()
          });

          setNewTitle("");
          setNewDesc("");
        };

          const deleteBulletin = async (id: string) => {
            if (!isAdmin) return;
            await deleteDoc(doc(firebaseFirestore, "bulletins", id));
          };

    const anyAvailable = availability.some(v => {
    const defectiveReport = maintenanceReports.find(
  r => r.plateNumber === v.plateNumber && r.checklist?.some(item => item.status === "Defective")
);
    return v.status === "Available" && !defectiveReport;
  });
   
   
    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6">
           <div className="max-w-6xl mx-auto space-y-10">

                  <div className="mb-10 space-y-6">
  {/* Latest Updates List */}
  
      {isAdmin && (
  <div className="mb-4 bg-white p-4 rounded shadow">
    <h3 className="text-sm font-semibold mb-2">Add Bulletin</h3>

    {/* Title Input */}
    <input
      className="border p-2 w-full mb-2 text-sm"
      placeholder="Title"
      value={newTitle}
      onInput={(e: any) => setNewTitle(e.target.value)}
    />

    {/* Description Input */}
    <textarea
      className="border p-2 w-full mb-2 text-sm"
      placeholder="Description"
      value={newDesc}
      onInput={(e: any) => setNewDesc(e.target.value)}
    />

    
    <button
      type="button"
      onClick={async () => {
        console.log("Clicked Post, isAdmin:", isAdmin);
        if (!isAdmin) {
          alert("Only admins can post bulletins!");
          return;
        }

        if (!newTitle.trim() || !newDesc.trim()) {
          alert("Please fill in both title and description.");
          return;
        }

        try {
          await addDoc(collection(firebaseFirestore, "bulletins"), {
            title: newTitle.trim(),
            description: newDesc.trim(),
            createdAt: new Date()
          });

          // Clear inputs
          setNewTitle("");
          setNewDesc("");
          alert("Bulletin posted successfully!");
        } catch (err) {
          console.error("Error posting bulletin:", err);
          alert("Failed to post bulletin. Check console for details.");
        }
      }}
      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
    >
      Post
    </button>
  </div>
)}

      {/* 🔥 BULLETIN LIST */}
      <ul className="space-y-4">
          {bulletinsData.map(b => (
          <li key={b.id} className="flex flex-col text-slate-800">

            <div className="flex items-center gap-2 font-medium">
             {b.title?.includes("Maintenance") && <CarIcon className="w-5 h-5 text-blue-600"/>}
              {b.title?.includes("Guidelines") && <ClipboardIcon className="w-5 h-5 text-teal-600"/>}
              {b.title?.includes("Update") && <FileTextIcon className="w-5 h-5 text-amber-600"/>}
              <span className="text-sm">{b.title}</span>
            </div>

            <p className="text-slate-600 text-xs ml-7 mt-1">
              {b.description}
            </p>

            
           {isAdmin && bulletinsData.length > 0 && (
            <button
              onClick={() => deleteBulletin(b.id)}
              className="text-red-500 text-xs ml-7 mt-1"
            >
              Delete
            </button>
          )}

          </li>
        ))}
      </ul>

  {/* Status Cards Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">

    {/* Equipment Status */}
    <div className="bg-white p-4 rounded-lg shadow-sm relative opacity-60 cursor-not-allowed">
  <h4 className="text-slate-800 font-semibold flex items-center gap-2 text-sm">
    <ClipboardIcon className="w-5 h-5 text-teal-600"/> Equipment Status
    <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
      Coming Soon
    </span>
  </h4>
  <ul className="text-slate-400 text-xs mt-2 space-y-1 ml-6">
    <li>Total Equipment: –</li>
    <li>Available: –</li>
    <li>Borrowed: –</li>
    <li>Defective: –</li>
  </ul>
</div>
  </div>

        </div>

        {/* ICON CARDS */}
        {/* ===================== ICON CARDS SPLIT START ===================== */}
<div className="bg-slate-100 min-h-screen w-full flex gap-4 p-4">

  {/* LEFT CARDS */}
  <div className="w-[20%] flex flex-col gap-4">

    {/* Request Form */}
    <HomeCard href="/request-form">
      <div className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <FileTextIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 group-hover:text-blue-700">
            Request Form
          </h2>
          <p className="text-slate-600 group-hover:text-slate-700">
            Create a new vehicle service request
          </p>
        </div>
      </div>
    </HomeCard>

    {/* Requests */}
    <HomeCard href="/requests">
      <div className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-300 p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
            <ClipboardClockIcon className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 group-hover:text-amber-700">
            Requests
          </h2>
          <p className="text-slate-600 group-hover:text-slate-700">
            View and manage your service requests
          </p>
        </div>
      </div>
    </HomeCard>

    {/* Approved Trips */}
    <HomeCard href="/trips">
      <div className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-green-300 p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
            <MapPinCheckIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 group-hover:text-green-700">
            Approved Trips
          </h2>
          <p className="text-slate-600 group-hover:text-slate-700">
            Track your approved vehicle trips
          </p>
        </div>
      </div>
    </HomeCard>

  </div>

  {/* CENTER CARD */}
  <div className="w-[60%]">
  <div className="w-full col-span-1 sm:col-span-2 lg:col-span-3 bg-white p-6 rounded-xl shadow flex flex-col items-center">
    <h2 className="text-xl font-bold mb-4 text-center">Vehicle Availability</h2>
    {loadingVehicles ? (
      <p>Loading...</p>
    ) : (
     <div className="grid grid-cols-5 gap-3 w-full">
  {availability.map(v => {
    // ✅ Only one declaration
     const normalize = (str: string) => str.replace(/\s|\./g, "").toLowerCase();

    // Check if any checklist item is defective
    const defectiveReport = maintenanceReports.find(
      r =>
        normalize(r.plateNumber) === normalize(v.plateNumber) &&
        r.checklist?.some(item => item.status === "Defective")
    );

    // Determine final status
    let finalStatus = v.status; 
    let statusColor = "text-green-600";

    if (defectiveReport) {
      finalStatus = "Defective";
      statusColor = "text-red-600";
    } else if (v.status.startsWith("Assigned")) {
      finalStatus = v.status; 
      statusColor = "text-yellow-600";
    }

    return (
      <div key={v.plateNumber} className="flex flex-col items-center bg-gray-50 p-2 rounded-lg shadow">
        <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center font-bold">
          {v.description.slice(0, 2)}
        </div>
        <p className="text-xs font-semibold mt-1 text-center">{v.description}</p>
        <p className={`text-xs font-medium ${statusColor}`}>
          {finalStatus}
        </p>
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
</div>

  {/* RIGHT CARDS */}
  <div className="w-[20%] flex flex-col gap-4">

    {/* Maintenance */}
    <div className="relative">
      <div 
        onClick={() => setShowMaintenance(!showMaintenance)}
        className="group cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 hover:border-teal-300 p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center group-hover:bg-teal-200 transition-colors">
            <ClipboardIcon className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 group-hover:text-teal-700">
            Maintenance Checklist
          </h2>
          <p className="text-slate-600 group-hover:text-slate-700">
            Track and Manage Vehicle Maintenance Tasks
          </p>
        </div>
      </div>

      {/* Maintenance Dropdown */}
      {showMaintenance && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg p-4 flex flex-col space-y-2 z-50">
          <Link href="/maintenance/automotive">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-teal-50 cursor-pointer">
              <CarIcon className="w-6 h-6 text-teal-600"/>
              <span className="text-teal-700 font-medium">Automotive</span>
            </div>
          </Link>
          <Link href="/maintenance/motorcycle">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-teal-50 cursor-pointer">
              <BikeIcon className="w-6 h-6 text-teal-600"/>
              <span className="text-teal-700 font-medium">Motorcycle/Trimobile</span>
            </div>
          </Link>
        </div>
      )}
    </div>

    {/* Analytics */}
    <HomeCard href="/analytics">
      <div className="group bg-white hover:bg-slate-50 border border-slate-200 hover:border-purple-300 p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
            <ChartColumnIcon className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 group-hover:text-purple-700">
            Data & Analytics
          </h2>
          <p className="text-slate-600 group-hover:text-slate-700">
            Analyze vehicle usage data
          </p>
        </div>
      </div>
    </HomeCard>

    {/* Management (Disabled) */}
    <div className="group cursor-not-allowed opacity-60">
      <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <UsersIcon className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">
            Management
          </h2>
          <p className="text-slate-600">
            Manage drivers, vehicles & availability
          </p>
        </div>
      </div>
    </div>

    {/* Reports (Disabled) */}
    <div className="group cursor-not-allowed opacity-60">
      <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <FileBarChartIcon className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">
            Reports
          </h2>
          <p className="text-slate-600">
            Generate detailed service reports
          </p>
        </div>
      </div>
    </div>

  </div>
</div>
{/* ===================== ICON CARDS SPLIT END ===================== */}
            </div>
        </div>
    )
}

interface HomeCardProps {
    children?: ReactNode
    href: string
}

function HomeCard({ children, href }: HomeCardProps) {
    return (
        <Link href={href}>
            {children}
        </Link>
    )
}