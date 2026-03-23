import { useState, useEffect } from "preact/hooks";
import { Link } from "wouter-preact";
import { firebaseFirestore } from "../firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { vehicleTypes } from "./VehicleTypes";


export default function VehicleAvailability() {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);

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

      const todayStr = new Date().toISOString().slice(0, 10);

      const availabilityList = Object.entries(vehicleTypes).map(([plate, vehicle]) => {
        const assignedTrip = trips.find((trip) => {
          const tripDate = trip.dateTime ? trip.dateTime.slice(0, 10) : "";
          return trip.plateNumber === plate && tripDate === todayStr && trip.status !== "Fulfilled";
        });

        return {
          plateNumber: plate,
          description: vehicle.description,
          status: assignedTrip ? `Assigned (${assignedTrip.tripCode})` : "Available",
        };
      });

      setAvailability(availabilityList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-4 border border-slate-200 mb-6">
      <h2 className="text-lg font-bold mb-2">Vehicle Availability (Today)</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full border border-slate-300 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-1 border">Plate Number</th>
                <th className="px-3 py-1 border">Vehicle</th>
                <th className="px-3 py-1 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {availability.map((v) => (
                <tr key={v.plateNumber} className="hover:bg-slate-50">
                  <td className="px-3 py-1 border">{v.plateNumber}</td>
                  <td className="px-3 py-1 border">{v.description}</td>
                  <td
                    className={`px-3 py-1 border font-semibold ${
                      v.status === "Available" ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    {v.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Link href="/request-form">
            <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Proceed to Request Form
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}