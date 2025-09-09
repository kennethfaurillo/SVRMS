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

    return { departments, departmentsString, serviceVehicles, serviceVehiclesString, loading, error };
}
