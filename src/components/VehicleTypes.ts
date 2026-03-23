// src/components/vehicleTypes.ts

export interface VehicleTypeInfo {
  description: string;   // Vehicle Type
  fuelType: "Diesel" | "Unleaded" | "Gasoline";
  tankCapacity: number;  // Tank capacity in liters
};

/**
 * Map of plate number → vehicle type info
 */
export const vehicleTypes: Record<string, VehicleTypeInfo> = {
  // Motorcycles / Scooters
  "MV 231": { description: "RS 125", fuelType: "Gasoline", tankCapacity: 10 },
  "MV 287": { description: "RS 125", fuelType: "Gasoline", tankCapacity: 10 },
  "MV 291": { description: "RS 125", fuelType: "Unleaded", tankCapacity: 10 },

  // Honda Supremo 155
  "TRYC. NO. 01": { description: "Honda Supremo 155", fuelType: "Unleaded", tankCapacity: 12 },
  "TRYC. NO. 02": { description: "Honda Supremo 155", fuelType: "Unleaded", tankCapacity: 12 },
  "TRYC. NO. 03": { description: "Honda Supremo 155", fuelType: "Unleaded", tankCapacity: 12 },
  "TRYC. NO. 04": { description: "Honda Supremo 155", fuelType: "Unleaded", tankCapacity: 12 },

  // Small Vans / Light Trucks
  "SAA 7857": { description: "Mitsubishi L300", fuelType: "Diesel", tankCapacity: 60 },
  "SBA 1406": { description: "Mitsubishi Estrada", fuelType: "Diesel", tankCapacity: 50 },
  "SBA 1045": { description: "Mitsubishi Estrada", fuelType: "Diesel", tankCapacity: 50 },
  "SAB 6183": { description: "Isuzu Van", fuelType: "Diesel", tankCapacity: 50 },

  // Pickups / Hilux
  "SKU 532": { description: "Toyota Hilux", fuelType: "Diesel", tankCapacity: 75 },
  "SEH 336": { description: "Toyota Hilux", fuelType: "Diesel", tankCapacity: 75 },
  "SEH 673": { description: "Toyota Hilux 2.8 5S", fuelType: "Diesel", tankCapacity: 80 },
  "SKU532": { description: "Toyota Hilux", fuelType: "Gasoline", tankCapacity: 70 },

  // Medium / Large Trucks
  "131202": { description: "Suzuki Super Carrier Truck", fuelType: "Diesel", tankCapacity: 120 },
  "131206": { description: "Boom Truck", fuelType: "Diesel", tankCapacity: 150 },
  "SAB 6182": { description: "Cargo Truck", fuelType: "Diesel", tankCapacity: 120 },
  "SAA 6494": { description: "Isuzu Truck Dropside", fuelType: "Diesel", tankCapacity: 140 },
};