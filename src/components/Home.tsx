import { ChartColumnIcon, ClipboardClockIcon, FileTextIcon, MapPinCheckIcon, UsersIcon, FileBarChartIcon, ClipboardIcon, CarIcon, BikeIcon, DropletIcon, WrenchIcon } from "lucide-react";
import { useState, useEffect } from "preact/hooks";
import type { ReactNode } from "preact/compat";
import { Link } from "wouter-preact";
import { collection, query, onSnapshot, addDoc, deleteDoc, orderBy, doc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { firebaseFirestore } from "../firebase";

const vehicleTypes = {
  "SKU 532": { description: "SKU 532" },
  "SEH 336": { description: "SEH 336" },
  "TRYC. NO. 02": { description: "TRYC. NO. 02", imageUrl: "/images/TRYC. NO. 02.jpg" },
  "TRYC. NO. 01": { description: "TRYC. NO. 01", imageUrl: "/images/TRYC. NO. 01.jpg" },
   "TRYC. NO. 03": { description: "TRYC. NO. 03", imageUrl: "/images/TRYC. NO. 03.jpg" },
   "SBA 1406": { description: "SBA 1406", imageUrl: "/images/SBA 1406.jpg" },
   "SAB 6183": { description: "SAB 6183", imageUrl: "/images/SAB 6183.jpg"},
   "SBA 1045": { description: "SBA 1045", imageUrl: "/images/SBA 1045.jpg" },
   "131202": { description: "131202", imageUrl: "/images/131202.jpg" },
   "MV291": { description: "MV 291" },
   "MV231": { description: "MV 231" },
   "131206": { description: "131206", imageUrl: "/images/131206.jpg" },
   "TRYC. NO. 04": { description: "TRYC. NO. 04", imageUrl: "/images/TRYC. NO. 04.jpg" },
   "SAB 6182": { description: "SAB 6182", imageUrl: "/images/SAB 6182.jpg" },
   "SAA 7857": { description: "SAA 7857", imageUrl: "/images/SAA 7857.jpg" },
   "SAA 6494": { description: "SAA 6494", imageUrl: "/images/SAA 6494.jpg" },
   "SEH 673": { description: "SEH 673", imageUrl: "/images/SEH 673.jpg" },
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

interface HomeProps {
    darkMode: boolean;
}

export default function Home({ darkMode }: HomeProps) {
  
    const { isAdmin, role } = useAuth();
    const [showMaintenance, setShowMaintenance] = useState(false);
      const [showReports, setShowReports] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
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

      const todayStr = new Date().toISOString().slice(0, 10);   // ← Araw lang

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
  <div className={`mb-6 p-5 rounded-xl shadow-sm border 
    ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
    
    <h3 className={`text-sm font-semibold mb-3 
      ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
      Add Bulletin
    </h3>

    {/* Title Input - Consistent Styling */}
    <input
      className={`w-full px-4 py-2.5 text-sm border rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
        ${darkMode 
          ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' 
          : 'bg-white border-gray-300 placeholder-gray-500'
        }`}
      placeholder="Bulletin Title"
      value={newTitle}
      onInput={(e: any) => setNewTitle(e.target.value)}
    />

    {/* Description Input - Consistent Styling */}
    <textarea
      className={`w-full px-4 py-2.5 text-sm border rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-y min-h-[80px]
        ${darkMode 
          ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' 
          : 'bg-white border-gray-300 placeholder-gray-500'
        }`}
      placeholder="Bulletin Description"
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
      className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 shadow-sm hover:shadow-md"
    >
      Post Bulletin
    </button>
  </div>
)}
     {/* BULLETIN BOARD STYLE */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {bulletinsData.map(b => (
    <div
      key={b.id}
      className="relative bg-yellow-50 border border-yellow-200 rounded-xl shadow-md p-4 h-fit hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Pin effect */}
      <div className="absolute -top-2 left-4 w-3 h-3 bg-red-500 rounded-full shadow"></div>

      {/* Title */}
      <div className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
        {b.title?.includes("Maintenance") && <CarIcon className="w-5 h-5 text-blue-600" />}
        {b.title?.includes("Guidelines") && <ClipboardIcon className="w-5 h-5 text-teal-600" />}
        {b.title?.includes("Update") && <FileTextIcon className="w-5 h-5 text-amber-600" />}
        <span className="text-sm">{b.title}</span>
      </div>

      {/* Description */}
      <p className="text-slate-700 text-xs whitespace-pre-wrap break-words">
        {b.description}
      </p>

      {/* Footer actions */}
      <div className="flex justify-between items-center mt-3">
        <span className="text-[10px] text-slate-400">
          📌 Bulletin
        </span>

        {isAdmin && (
          <button
            onClick={() => deleteBulletin(b.id)}
            className="text-red-500 text-xs hover:underline"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  ))}
</div>

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
       
<div className="bg-slate-100 min-h-full w-full flex gap-4 p-4">

  {/* LEFT CARDS */}
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

    
    {/* Maintenance */}
   {["admin", "mechanic", "driver"].includes(role) ? (
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

    {/* Dropdown */}
    {showMaintenance && (
      <div className="absolute top-0 left-full ml-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 flex flex-col space-y-1 z-50">
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
) : (
  /* Disabled version for other users */
  <div className="group cursor-not-allowed opacity-60">
    <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
          <ClipboardIcon className="w-8 h-8 text-teal-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800">
          Maintenance Checklist
        </h2>
        <p className="text-slate-500">
          Only for Admin, Mechanic & Driver
        </p>
      </div>
    </div>
  </div>
)}

  </div>

  {/* CENTER CARD */}
  <div className="w-[60%]">
  <div className={`flex flex-col items-center p-2 rounded-lg shadow transition-colors duration-300 ${
  darkMode
    ? "bg-gray-800 border border-gray-700"
    : "bg-gray-50 border border-gray-200"
}`}>
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
        <p className={`text-xs font-semibold mt-1 text-center ${
            darkMode ? "text-gray-200" : "text-slate-800"
          }`}>
            {v.description}
          </p>
                  <p className={`text-xs font-medium ${statusColor} ${
            darkMode ? "drop-shadow-sm" : ""
          }`}>
            {finalStatus}
          </p>
      </div>
    );
  })}
</div>
    )}
    <Link href={anyAvailable ? "/request-form" : "#"} className="w-full mt-4">
         <button
          className={`w-full py-3 rounded text-white font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 hover:shadow-md ${
            anyAvailable ? "bg-blue-500 hover:bg-blue-600 cursor-pointer" : "bg-gray-400 cursor-not-allowed"
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
        {/* Analytics */}
    <HomeCard 
      href="/analytics"
      title="Data & Analytics"
      icon={<ChartColumnIcon className="w-8 h-8 text-purple-600" />}
      description="Analyze vehicle usage data"
    />

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

    {/* Reports*/}
   {role === "admin" && (
  <div className="relative">
    
    {/* MAIN CARD */}
    <div
      onClick={() => setShowReports(!showReports)}
      className="group cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
          <FileBarChartIcon className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800 group-hover:text-indigo-700">
          Reports
        </h2>
        <p className="text-slate-600">Generate service reports</p>
      </div>
    </div>

    {/* DROPDOWN */}
    {showReports && (
      <div className="absolute top-0 left-full ml-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 flex flex-col space-y-1 z-50">

        <Link href="/fuel-reports">
          <div onClick={() => setShowReports(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
            <DropletIcon className="w-6 h-6 text-indigo-600" />
            <span className="text-slate-700 font-medium">Fuel Reports</span>
          </div>
        </Link>

        <Link href="/maintenance-reports">
          <div onClick={() => setShowReports(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
            <WrenchIcon className="w-6 h-6 text-indigo-600" />
            <span className="text-slate-700 font-medium">Maintenance Reports</span>
          </div>
        </Link>

        <Link href="/borrow-report">
          <div onClick={() => setShowReports(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
            <ClipboardClockIcon className="w-6 h-6 text-indigo-600" />
            <span className="text-slate-700 font-medium">Borrow Reports</span>
          </div>
        </Link>

      </div>
    )}
  </div>
)}
    <div className="relative">

  {/* MAIN CARD */}
  <div
    onClick={() => setShowEquipment(!showEquipment)}
    className="group cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 hover:border-red-300 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 hover:scale-105"
  >
    <div className="flex flex-col items-center text-center space-y-3">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
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

  {/* DROPDOWN */}
  {showEquipment && (
    <div className="absolute top-0 left-full ml-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 flex flex-col space-y-1 z-50">

      <Link href="/borrow-form">
        <div onClick={() => setShowEquipment(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
          <FileTextIcon className="w-6 h-6 text-red-600" />
          <span className="text-slate-700 font-medium">Borrow Form</span>
        </div>
      </Link>

      <Link href="/borrow-requests">
        <div onClick={() => setShowEquipment(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
          <ClipboardClockIcon className="w-6 h-6 text-red-600" />
          <span className="text-slate-700 font-medium">Borrow Request</span>
        </div>
      </Link>

      <Link href="/borrow-checklist">
        <div onClick={() => setShowEquipment(false)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
          <ClipboardIcon className="w-6 h-6 text-red-600" />
          <span className="text-slate-700 font-medium">Checklist</span>
        </div>
      </Link>

    </div>
  )}
</div>

  </div>
</div>
            </div>
        </div>
    )
}

function HomeCard({ href, title, icon, description }: { 
  href: string; 
  title: string; 
  icon: ReactNode; 
  description: string 
}) {
  return (
    <Link href={href}>
      <div className="group cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 flex flex-col items-center text-center space-y-4">
        
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-slate-200 transition-colors">
          {icon}
        </div>

        <h2 className="text-lg font-semibold text-slate-800 group-hover:text-blue-700">
          {title}
        </h2>

        <p className="text-slate-600 group-hover:text-slate-700">
          {description}
        </p>

      </div>
    </Link>
  );
}