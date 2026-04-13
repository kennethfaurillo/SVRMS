export interface VehicleTypeInfo {
  image?: string;                  // Optional image URL
  category: "Automotive" | "Motorcycle";
  description: string;             // Vehicle Type
  fuelType: "Diesel" | "Unleaded" | "Gasoline";
  tankCapacity: number;            // Tank capacity in liters
}

/**
 * Map of plate number → vehicle type info
 */
export const vehicleTypes: Record<string, VehicleTypeInfo> = {
  // ------------------ Motorcycles / Scooters ------------------
  "MV231": { category: "Motorcycle", description: "RS 125", fuelType: "Gasoline", tankCapacity: 7, image: "/images/rs125.jpg" },
  "MV287": { category: "Motorcycle", description: "RS 125 BLACK", fuelType: "Gasoline", tankCapacity: 7, image: "/images/MV 287.jpg" },
  "MV291": { category: "Motorcycle", description: "RS 125 GRAY", fuelType: "Unleaded", tankCapacity: 7, image: "/images/rs125_gray.jpg" },

  // Honda Supremo 155
  "TRYC. NO. 01": { category: "Motorcycle", description: "SIDECAR 1", fuelType: "Unleaded", tankCapacity: 7, image: "/images/TRYC. NO. 01.jpg" },
  "TRYC. NO. 02": { category: "Motorcycle", description: "SIDECAR 2", fuelType: "Unleaded", tankCapacity: 7, image: "/images/TRYC. NO. 02.jpg" },
  "TRYC. NO. 03": { category: "Motorcycle", description: "SIDECAR 3", fuelType: "Unleaded", tankCapacity: 7, image: "/images/TRYC. NO. 03.jpg" },
  "TRYC. NO. 04": { category: "Motorcycle", description: "SIDECAR 4", fuelType: "Unleaded", tankCapacity: 7, image: "/images/TRYC. NO. 04.jpg" },

  // ------------------ Small Vans / Light Trucks ------------------
  "SAA 7857": { category: "Automotive", description: "L300", fuelType: "Diesel", tankCapacity: 50, image: "/images/SAA 7857.jpg" },
  "SBA 1406": { category: "Automotive", description: "MITSUBISHI STRADA", fuelType: "Diesel", tankCapacity: 50, image: "/images/SBA 1406.jpg" },
  "SBA 1045": { category: "Automotive", description: "MITSUBISHI STRADA", fuelType: "Diesel", tankCapacity: 50, image: "/images/SBA 1045.jpg" },
  "SAB 6183": { category: "Automotive", description: "ISUZU VAN", fuelType: "Diesel", tankCapacity: 50, image: "/images/SAB 6183.jpg" },

  // ------------------ Pickups / Hilux ------------------
  "DOL 180": { category: "Automotive", description: "Toyota Hilux", fuelType: "Diesel", tankCapacity: 75 },
  "SEH 336": { category: "Automotive", description: "Van", fuelType: "Diesel", tankCapacity: 75, image: "/images/van.png" },
  "SEH 673": { category: "Automotive", description: "VAN", fuelType: "Diesel", tankCapacity: 80, image: "/images/SEH 673.jpg" },
  "SKU 532": { category: "Automotive", description: "SKU 532", fuelType: "Gasoline", tankCapacity: 70, image: "/images/sku532.jpg" },

  // ------------------ Medium / Large Trucks ------------------
  "131202": { category: "Automotive", description: "MULTICAB", fuelType: "Diesel", tankCapacity: 100, image: "/images/131202 - Multicab.jpg" },
  "131206": { category: "Automotive", description: "TRUCK", fuelType: "Diesel", tankCapacity: 100, image: "/images/131206.jpg" },
  "SAB 6182": { category: "Automotive", description: "VAN", fuelType: "Diesel", tankCapacity: 100, image: "/images/SAB 6182.jpg" },
  "SAA 6494": { category: "Automotive", description: "TRUCK DROP SIDE", fuelType: "Diesel", tankCapacity: 100, image: "/images/SAA 6494.jpg" },
};