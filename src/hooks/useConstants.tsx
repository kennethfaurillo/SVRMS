import { useState, useEffect } from "preact/hooks";
import { collection, getDocs } from "firebase/firestore";
import { firebaseAuth, firebaseFirestore } from "../firebase";
import type { Department, ServiceVehicle } from "../types";
import { useAuth } from "../contexts/AuthContext";

let DEPARTMENTS = [] as Department[];
let SERVICE_VEHICLES = [] as ServiceVehicle[];

/**
 * Custom hook to fetch constants from Firebase Firestore.
 * Constants:
 * - Departments
 * - Service Vehicles
 */
export function useConstants() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [serviceVehicles, setServiceVehicles] = useState<ServiceVehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const departmentsString = departments.map((department) => department.name)
    const serviceVehiclesString = serviceVehicles.map((serviceVehicle) => serviceVehicle.name)
    const equipmentItems = [
  "Air Compressor",
  "Atlas Copco-Jack Hammer (Hydraulic)",
  "Atlas Copco-Jack Hammer (Pneumatic)",
  "Airman Pneumatic - Jack Hammer (Toku TPB-90)",
  "Concrete Cutter 1",
  "Concrete Cutter 2",
  "Concrete Cutter 3",
  "Grass Cutter 1",
  "Grass Cutter 2",
  "Grass Cutter 3",
  "Grass Cutter 4",
  "Jack Hammer Hilti 1",
  "Jack Hammer Hilti 2",
  "Jack Hammer Hilti 3",
  "Mobile Gen-set 10KVA",
  "Welding Generator",
  "Pipe Threader",
  "Power Spray",
  "Stanley-Jackhammer/1 Dewatering",
  "Stanley-Jackhammer/2 Dewatering",
  "Dewatering New",
  "Dewatering Old",
  "Tampering Machine 1",
  "Tampering Machine 2",
  "Butt Fusion Machine",
  "Cement Mixer 1",
  "Cement Mixer 2",
  "Chainsaw",
  "Fusion Machine",
  "Grease Pump",
  "GS #1: San Vicente",
  "GS #4: San Jose",
  "GS #5: La Purisima I",
  "GS #6: San Jose",
  "GS #7: PIWAD Office",
  "GS #8: San Vicente",
  "GS #9 C. Park",
  "GS #10 Del Rosario",
  "GS #11 Cadlan",
  "GS #12 La Purisima II",
  "GS #13 Caroyroyan",
  "GS #14 Palestina",
  "GS #15 Del Rosario",
  "GS #16 La Purisima II",
  "GS #17 Palestina",
  "GS #18 C. Park",
  "Others"
];
    
    const db = firebaseFirestore;
    const auth = firebaseAuth;
    const { user } = useAuth();

    useEffect(() => {
        if (db && auth && user) {
            const fetchDepartments = async () => {
                if (DEPARTMENTS.length > 0) {
                    setDepartments(DEPARTMENTS);
                    return;
                }
                try {
                    setLoading(true);
                    setError(null);

                    const departmentsCollection = collection(firebaseFirestore, "departments");
                    const snapshot = await getDocs(departmentsCollection);

                    const departmentsList: Department[] = snapshot.docs.map(doc => (doc.data() as Department));
                    setDepartments(departmentsList);
                    DEPARTMENTS = departmentsList;
                } catch (err) {
                    console.error("Error fetching departments:", err);
                    setError("Failed to fetch departments");
                } finally {
                    setLoading(false);
                }
            };
            const fetchServiceVehicles = async () => {
                if (SERVICE_VEHICLES.length > 0) {
                    setServiceVehicles(SERVICE_VEHICLES);
                    return;
                }
                try {
                    setLoading(true);
                    setError(null);

                    const serviceVehiclesCollection = collection(firebaseFirestore, "vehicles");
                    const snapshot = await getDocs(serviceVehiclesCollection);

                    const serviceVehiclesList: ServiceVehicle[] = snapshot.docs.map(doc => doc.data() as ServiceVehicle);

                    setServiceVehicles(serviceVehiclesList);
                    SERVICE_VEHICLES = serviceVehiclesList;
                } catch (err) {
                    console.error("Error fetching service vehicles:", err);
                    setError("Failed to fetch service vehicles");
                } finally {
                    setLoading(false);
                }
            };

            fetchDepartments();
            fetchServiceVehicles();
        }
    }, [user]);

return {
    departments,
    departmentsString,
    serviceVehicles,
    serviceVehiclesString,
    equipmentItems,
    loading,
    error
};
}
