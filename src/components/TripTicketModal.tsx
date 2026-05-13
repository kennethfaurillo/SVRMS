import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { firebaseFirestore } from "../firebase";
import { collection, query, where, getDocs, limit, orderBy, Timestamp } from "firebase/firestore";
import type { DriverLog, Request } from "../types";

interface DriverLogSectionProps {
  driverLog?: DriverLog;
  onChange?: (updates: Partial<DriverLog>) => void;
  darkMode?: boolean;
  isEditable?: boolean;
}

interface TripTicketModalProps {
  showTripTicket: boolean;
  setShowTripTicket: (value: boolean) => void;
  requestId: string | null;
  darkMode?: boolean;
}

export default function TripTicketModal({
  showTripTicket,
  setShowTripTicket,
  requestId,
  darkMode = false,
}: TripTicketModalProps) {

  const [tripData, setTripData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceData, setMaintenanceData] = useState<any>(null);

const fetchMaintenanceData = async (plate?: string, requestDateInput?: string | Date) => {
  const vehiclePlate = plate;

  if (!vehiclePlate) return;

  try {
    const maintenanceRef = collection(firebaseFirestore, "maintenanceReports");

    let targetDate = new Date();
    if (requestDateInput) {
      targetDate = typeof requestDateInput === "string" 
        ? new Date(requestDateInput) 
        : requestDateInput;
    }

    
    targetDate.setHours(23, 59, 59, 999);

    if (isNaN(targetDate.getTime())) targetDate = new Date();

    const targetTimestamp = Timestamp.fromDate(targetDate);

    const q = query(
      maintenanceRef,
      where("plateNumber", "==", vehiclePlate),
      where("timestamp", "<=", targetTimestamp),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const maintenance = { 
        id: snapshot.docs[0].id, 
        ...snapshot.docs[0].data() 
      };
      setMaintenanceData(maintenance);
      console.log(`✅ CORRECT Maintenance for ${vehiclePlate} as of ${targetDate.toLocaleDateString("en-PH")}`, maintenance);
    } else {
      console.log(`⚠️ No maintenance before or on ${targetDate.toLocaleDateString("en-PH")} for ${vehiclePlate}`);
      setMaintenanceData(null);
    }
  } catch (err) {
    console.error("Error fetching maintenance:", err);
    setMaintenanceData(null);   
  }
};
const formatETA = (isoString?: string): string => {
    if (!isoString) return "";

    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;

      return date.toLocaleTimeString("en-PH", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return isoString;
    }
  };

  const getSpeedometerReading = (): string => {
 
  if (tripData?.speedometerReading) {
    return tripData.speedometerReading.toString();
  }

  
  if (maintenanceData?.driverSection?.speedReading !== undefined && 
      maintenanceData.driverSection.speedReading !== null) {
    return maintenanceData.driverSection.speedReading.toString();
  }

  return "—";
};

// ==================== GET BALANCE IN TANK FROM MAINTENANCE ====================
  const getBalanceInTank = (): string => {
    if (maintenanceData?.driverSection?.balanceInTank !== undefined) {
      return maintenanceData.driverSection.balanceInTank.toString();
    }
    return "";
  };

  // ==================== REFUEL STATUS ====================
  const getRefuelStatus = (): string => {
    if (maintenanceData?.driverSection?.balanceInTank === undefined) {
      return "—";
    }

    const balance = Number(maintenanceData.driverSection.balanceInTank);
    const plate = (tripData?.requestedVehicle || tripData?.vehicleAssigned || "").toUpperCase();
    const isMotorcycle = plate.includes("TRYC") || plate.includes("MC") || plate.includes("MOTOR");
    const fullTank = isMotorcycle ? 10 : 20;
    const threshold = fullTank * 0.20;

    return balance <= threshold ? "⚠️ NEED REFUEL" : "NO NEED";
  };
    // ==================== FETCH TRIP DATA + MAINTENANCE ====================
  useEffect(() => {
    if (!showTripTicket || !requestId) {
      setTripData(null);
      setMaintenanceData(null);
      setError(null);
      return;
    }

    const fetchTripData = async () => {
      setLoading(true);
      setError(null);

      try {
        const tripsRef = collection(firebaseFirestore, "trips");
        const q = query(
          tripsRef,
          where("requestIds", "array-contains", requestId),
          limit(1)
        );

        const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          
          console.log("✅ Fetched Trip Data:", data);

                   const trip = { 
            id: doc.id, 
            ...data 
          };

          setTripData(trip);

          const tripAny = data as any;

          const plate = 
            tripAny.requestedVehicle || 
            tripAny.vehicleAssigned || 
            (trip as any).requestedVehicle || 
            (trip as any).vehicleAssigned || 
            "";

          let requestDateForMaintenance: string | Date = new Date();

          if (tripAny.requestedDateTime) {
            requestDateForMaintenance = tripAny.requestedDateTime;
          } else if (tripAny.dateTime) {
            requestDateForMaintenance = tripAny.dateTime;
          } else if ((trip as any).requestedDateTime) {
            requestDateForMaintenance = (trip as any).requestedDateTime;
          } else if ((trip as any).dateTime) {
            requestDateForMaintenance = (trip as any).dateTime;
          }

          
          if (typeof requestDateForMaintenance === "string") {
            requestDateForMaintenance = new Date(requestDateForMaintenance);
          }

          
          if (isNaN((requestDateForMaintenance as Date).getTime())) {
            requestDateForMaintenance = new Date();
          }

          if (plate) {
            console.log(`🔍 Fetching maintenance for ${plate} using date:`, requestDateForMaintenance);
            await fetchMaintenanceData(plate, requestDateForMaintenance);
          } else {
            console.warn("⚠️ No plate number found in this trip record.");
          }
        } else {
          setError("Trip record not found for this request.");
        }
      } catch (err: any) {
        console.error("Error fetching trip:", err);
        setError("Failed to load Trip Ticket. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTripData();
  }, [showTripTicket, requestId]);

  const refuelAmount = (() => {
    if (!maintenanceData?.driverSection?.balanceInTank) return 0;

    const balance = Number(maintenanceData.driverSection.balanceInTank);
    const plate = (tripData?.requestedVehicle || tripData?.vehicleAssigned || "").toUpperCase();
    
    const isMotorcycle = plate.includes("TRYC") || plate.includes("MC") || plate.includes("MOTOR");
    const fullTank = isMotorcycle ? 10 : 20;
    const threshold = fullTank * 0.20;   // 20% threshold

    if (balance <= threshold) {
      return Math.ceil(fullTank - balance);   
    }
    return 0;
  })();

  const showRefuelRow = refuelAmount > 0;

  const handleDriverLogChange = (updates: Partial<DriverLog>) => {
    if (!tripData) return;
    setTripData({
      ...tripData,
      driverLog: { ...(tripData.driverLog || {}), ...updates }
    });
  };
 
  // ==================== FINAL PRINT - 2 SHEETS (Ticket + 2 Compact Letter B) ====================
  const getPrintHtml = () => {
    if (!tripData) return "<h2>No Data Available</h2>";

    const dateStr = tripData.requestedDateTime || tripData.dateTime
      ? new Date(tripData.requestedDateTime || tripData.dateTime).toLocaleDateString("en-PH")
      : "—";

    const driver = tripData.delegatedDriverName || tripData.driverName || "—";
    const plate = tripData.requestedVehicle || tripData.vehicleAssigned || "—";
    const purposeText = Array.isArray(tripData.purpose) 
      ? tripData.purpose.join(", ") 
      : (tripData.purpose || "—");

    const passengersText = tripData.passengers 
      ? (Array.isArray(tripData.passengers) ? tripData.passengers.join(", ") : tripData.passengers)
      : "—";

    const eta = formatETA(tripData.estimatedArrival) || "—";
    const speedoReading = getSpeedometerReading();

    let fuelInTankDisplay = "— L";
    if (maintenanceData?.driverSection?.balanceInTank !== undefined) {
      fuelInTankDisplay = `${maintenanceData.driverSection.balanceInTank} L`;
    } else if (tripData.fuelInTank !== undefined && tripData.fuelInTank !== null) {
      fuelInTankDisplay = `${tripData.fuelInTank} L`;
    }

    const tripTicketNo = tripData.tripCode || "N/A";

   
    const recommendedBy = tripData.recommendedBy || "________________________";
    const approvedBy     = tripData.approvedBy     || "________________________";

    const log = tripData.driverLog || {};

    const refuelDisplay = (() => {
  if (!maintenanceData?.driverSection?.balanceInTank) return "";

  const balance = Number(maintenanceData.driverSection.balanceInTank);
  const plate = (tripData?.requestedVehicle || tripData?.vehicleAssigned || "").toUpperCase();

  const isMotorcycle = plate.includes("TRYC") || plate.includes("MC") || plate.includes("MOTOR");
  const fullTank = isMotorcycle ? 10 : 20;
  const threshold = fullTank * 0.20;

  if (balance <= threshold) {
    return `${Math.ceil(fullTank - balance)} L`;
  }

  return "";
})();

    return `
      <html>
        <head>
          <title>DRIVER'S TRIP TICKET</title>
          <style>
            @page {size: A4; margin: 8mm;}
            body { font-family: Arial, sans-serif; color: #000; margin:0; padding:0; }
            .ticket {
              width: 100%;
              border: 3px solid #000;
              padding: 12px 14px;
              box-sizing: border-box;
              margin-bottom: 15px;
              page-break-inside: avoid;
              height: 48.5%;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              margin-bottom: 10px; 
              border-bottom: 3px solid #000; 
              padding-bottom: 6px; 
            }
            .logo { height: 45px; }
            h2 { 
              text-align: center; 
              margin: 8px 0 12px; 
              font-size: 19px; 
              font-weight: bold; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 12px; 
              font-size: 13.5px;
            }
            th, td { 
              border: 2px solid #000; 
              padding: 6px 8px; 
            }
            th { 
              background-color: #f0f0f0; 
              text-align: left; 
              width: 32%; 
              font-weight: bold;
            }
            .note {
              font-size: 12px;
              text-align: center;
              margin: 10px 0 25px;
              font-style: italic;
            }
            .log-section {
              margin-top: 8px;
              line-height: 1.6;
              font-size: 12.5px;
            }

            .remarks-box {
                border: 2px solid #000;
                padding: 8px;
                font-size: 12.5px;

                flex-grow: 1;        
                min-height: 40px;
                max-height: 80px;    
                overflow: hidden;    
              }
              .signatures {
                display: flex;
                justify-content: space-between;
                margin-top: 15px;
              }

              .signature-box {
                width: 30%;
                text-align: center;
                font-size: 12px;
              }

              .signature-line {
                border-top: 2px solid #000;
                margin-bottom: 5px;
                height: 20px;
              }
                 .page {
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  height: 100vh;
                  page-break-after: always;
                }
          </style>
        </head>
        <body>

           <div class="page">
          <div class="ticket">
            <div class="header">
              <img src="${window.location.origin}/images/PIWAD-LOGO.png" class="logo" alt="PIWAD">
              <div style="text-align:center; flex:1;">
                <p style="margin:0; font-size:12px;">Republic of the Philippines</p>
                <p style="margin:4px 0; font-size:17px; font-weight:bold;">PILI WATER DISTRICT</p>
                <p style="margin:0; font-size:11px;">Sta. Rita Agro-Industrial Park, San Jose, Pili, Camarines Sur 4418</p>
              </div>
              <img src="${window.location.origin}/images/logo-TUV.jpg" class="logo" alt="TUV">
            </div>
            <h2>DRIVER'S TRIP TICKET</h2>
            <table>
              <tr><th>Date</th><td>${dateStr}</td><th>Trip Ticket No.</th><td style="text-align:center; font-weight:bold;">${tripTicketNo}</td></tr>
              <tr><th>Driver</th><td colspan="3">${driver}</td></tr>
              <tr><th>Plate Number</th><td colspan="3">${plate}</td></tr>
              <tr><th>Purpose</th><td colspan="3">${purposeText}</td></tr>
              <tr><th>Passengers</th><td colspan="3">${passengersText}</td></tr>
              <tr><th>Estimated Time of Arrival</th><td colspan="3">${eta}</td></tr>
              <tr><th>Speedometer Reading</th><td colspan="3">${speedoReading} km</td></tr>
              <tr><th>Fuel in Tank</th><td colspan="3">${fuelInTankDisplay}</td></tr>
              ${refuelDisplay ? `
              <tr>
                <th>Refuel</th>
                <td colspan="3" style="color:red; font-weight:bold;">
                  ${refuelDisplay}
                </td>
              </tr>
              ` : ""}
              </table>
            <div class="note"><strong>Return this trip ticket to GS after vehicle use.</strong></div>
            <div class="signatures" style="margin-top:auto;">

              <div class="signature-box">
                <div>${recommendedBy}</div>
                <div class="signature-line"></div>
                Division Mgr.
              </div>

              <div class="signature-box">
                <div>${approvedBy}</div>
                <div class="signature-line"></div>
                Asst. Chief
              </div>
            </div>
          </div>

           <div class="page">
          <div class="ticket">
            <div class="header">
              <img src="${window.location.origin}/images/PIWAD-LOGO.png" class="logo" alt="PIWAD">
              <div style="text-align:center; flex:1;">
                <p style="margin:0; font-size:12px;">Republic of the Philippines</p>
                <p style="margin:4px 0; font-size:17px; font-weight:bold;">PILI WATER DISTRICT</p>
                <p style="margin:0; font-size:11px;">Sta. Rita Agro-Industrial Park, San Jose, Pili, Camarines Sur 4418</p>
              </div>
              <img src="${window.location.origin}/images/logo-TUV.jpg" class="logo" alt="TUV">
            </div>
            <h2>DRIVER'S TRIP TICKET</h2>
            <table>
              <tr><th>Date</th><td>${dateStr}</td><th>Trip Ticket No.</th><td style="text-align:center; font-weight:bold;">${tripTicketNo}</td></tr>
              <tr><th>Driver</th><td colspan="3">${driver}</td></tr>
              <tr><th>Plate Number</th><td colspan="3">${plate}</td></tr>
              <tr><th>Purpose</th><td colspan="3">${purposeText}</td></tr>
              <tr><th>Passengers</th><td colspan="3">${passengersText}</td></tr>
              <tr><th>Estimated Time of Arrival</th><td colspan="3">${eta}</td></tr>
              <tr><th>Speedometer Reading</th><td colspan="3">${speedoReading} km</td></tr>
              <tr><th>Fuel in Tank</th><td colspan="3">${fuelInTankDisplay}</td></tr>
              ${refuelDisplay ? `
                <tr>
                  <th>Refuel</th>
                  <td colspan="3" style="color:red; font-weight:bold;">
                    ${refuelDisplay}
                  </td>
                </tr>
                ` : ""}
              </table>
            <div class="note"><strong>Return this trip ticket to GS after vehicle use.</strong></div>
            <div class="signatures" style="margin-top:auto;">

              <div class="signature-box">
                <div>${recommendedBy}</div>
                <div class="signature-line"></div>
                Division Mgr.
              </div>

              <div class="signature-box">
                <div>${approvedBy}</div>
                <div class="signature-line"></div>
                Asst. Chief
              </div>
            </div>
          </div>

       <div class="ticket">
            <h2 style="margin:5px 0 10px; font-size:17.5px;">B. TO BE FILLED BY THE DRIVER</h2>
            <div class="log-section" style="line-height: 1.8;">
              1. Time of Departure from Office/Garage 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 160px; display: inline-block; text-align: center;">
                ${log.timeDepartureOffice || "&nbsp;"}
              </span><br/>

              2. Time of Arrival back to Office/Garage 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 160px; display: inline-block; text-align: center;">
                ${log.timeArrivalBackOffice || "&nbsp;"}
              </span><br/><br/>

              3. Gasoline Issued purchased and consumed 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 140px; display: inline-block; text-align: center;">
                ${log.gasolineIssuedConsumed || "&nbsp;"}
              </span> Liters<br/>

                a. Balance In tank 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 110px; display: inline-block; text-align: center;">
                ${log.balanceInTankStart || "&nbsp;"}
              </span> Liters<br/>

                b. Add purchased during trip 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 110px; display: inline-block; text-align: center;">
                ${log.purchasedDuringTrip || "&nbsp;"}
              </span> Liters<br/>

                <strong>TOTAL:</strong> 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 110px; display: inline-block; text-align: center;">
                ${log.totalFuel || "&nbsp;"}
              </span> Liters<br/>

                c. Deduct Used During the Trip (To and From) 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 110px; display: inline-block; text-align: center;">
                ${log.usedDuringTrip || "&nbsp;"}
              </span> Liters<br/>

                d. Balance In Tank at the end of trip 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 110px; display: inline-block; text-align: center;">
                ${log.balanceInTankEnd || "&nbsp;"}
              </span> Liters<br/><br/>

              4. Speedometer readings if any:<br/>
                At beginning of trip 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 100px; display: inline-block; text-align: center;">
                ${log.speedometerBegin || "&nbsp;"}
              </span> kms.<br/>

                At end of trip 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 100px; display: inline-block; text-align: center;">
                ${log.speedometerEnd || "&nbsp;"}
              </span> kms.<br/>

                Distance Travelled/DIVISOR _____ km/liters 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 100px; display: inline-block; text-align: center;">
                ${log.distanceTravelled || "&nbsp;"}
              </span> kms.<br/><br/>
              5. REMARKS:
            </div>
            <div class="remarks-box">
              ${log.remarks || "N/A"}
            </div>
          </div>

          <!-- Duplicate Letter B -->
          <div class="ticket">
            <h2 style="margin:5px 0 10px; font-size:17.5px;">B. TO BE FILLED BY THE DRIVER</h2>
            <div class="log-section" style="line-height: 1.8;">
              1. Time of Departure from Office/Garage 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 160px; display: inline-block; text-align: center;">
                ${log.timeDepartureOffice || "&nbsp;"}
              </span><br/>

              2. Time of Arrival back to Office/Garage 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 160px; display: inline-block; text-align: center;">
                ${log.timeArrivalBackOffice || "&nbsp;"}
              </span><br/><br/>

              3. Gasoline Issued purchased and consumed 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 140px; display: inline-block; text-align: center;">
                ${log.gasolineIssuedConsumed || "&nbsp;"}
              </span> Liters<br/>

                a. Balance In tank 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 110px; display: inline-block; text-align: center;">
                ${log.balanceInTankStart || "&nbsp;"}
              </span> Liters<br/>

                b. Add purchased during trip 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 110px; display: inline-block; text-align: center;">
                ${log.purchasedDuringTrip || "&nbsp;"}
              </span> Liters<br/>

                <strong>TOTAL:</strong> 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 110px; display: inline-block; text-align: center;">
                ${log.totalFuel || "&nbsp;"}
              </span> Liters<br/>

                c. Deduct Used During the Trip (To and From) 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 110px; display: inline-block; text-align: center;">
                ${log.usedDuringTrip || "&nbsp;"}
              </span> Liters<br/>

                d. Balance In Tank at the end of trip 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 110px; display: inline-block; text-align: center;">
                ${log.balanceInTankEnd || "&nbsp;"}
              </span> Liters<br/><br/>

              4. Speedometer readings if any:<br/>
                At beginning of trip 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 100px; display: inline-block; text-align: center;">
                ${log.speedometerBegin || "&nbsp;"}
              </span> kms.<br/>

                At end of trip 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 100px; display: inline-block; text-align: center;">
                ${log.speedometerEnd || "&nbsp;"}
              </span> kms.<br/>

                Distance Travelled/DIVISOR _____ km/liters 
              <span style="border-bottom: 2px solid #000; padding: 0 6px; min-width: 100px; display: inline-block; text-align: center;">
                ${log.distanceTravelled || "&nbsp;"}
              </span> kms.<br/><br/>

              5. REMARKS:
            </div>
            <div class="remarks-box">
              ${log.remarks || "N/A"}
            </div>
          </div>

        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=1200,height=900");
    if (win) {
      win.document.write(getPrintHtml());
      win.document.close();
      setTimeout(() => {
        win.focus();
        win.print();
      }, 800);
    }
  };

 if (loading) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, color: "#fff" }}>
        Loading Trip Ticket...
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
        <div style={{ background: "#fff", padding: "30px", borderRadius: "8px", maxWidth: "500px", textAlign: "center" }}>
          <h3>⚠️ Error</h3>
          <p>{error || "No trip record found for this request."}</p>
          <button onClick={() => setShowTripTicket(false)} style={{ marginTop: 15, padding: "10px 25px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px" }}>
            Close
          </button>
        </div>
      </div>
    );
  }
 
    const speedoDisplay = getSpeedometerReading();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowTripTicket(false)}>
      <div
  style={{
    background: darkMode ? "#1f2937" : "#fff",
    color: darkMode ? "#f9fafb" : "#000",
    width: "95%",
    maxWidth: "920px",
    maxHeight: "95vh",
    overflowY: "auto",
    padding: "25px",
    borderRadius: "8px"
  }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <img src={`${window.location.origin}/images/PIWAD-LOGO.png`} style={{ height: 80 }} alt="PIWAD" />
          <div style={{ textAlign: "center", flex: 1 }}>
            <p style={{ margin: 0, fontSize: 12 }}>Republic of the Philippines</p>
            <p style={{ margin: 5, fontSize: 18, fontWeight: "bold" }}>PILI WATER DISTRICT</p>
            <p style={{ margin: 0, fontSize: 12 }}>Sta. Rita Agro-Industrial Park, San Jose, Pili, Camarines Sur 4418</p>
          </div>
          <img src={`${window.location.origin}/images/logo-TUV.jpg`} style={{ height: 60 }} alt="TUV" />
        </div>

                {/* Header Title + Trip Ticket Number */}
        <h2 style={{ textAlign: "center", marginBottom: 10 }}>DRIVER'S TRIP TICKET</h2>
        
        <p style={{ textAlign: "center", fontSize: "20px", fontWeight: "bold", marginBottom: 25, color: "#1e40af" }}>
                   Trip Ticket No.: {tripData.tripCode || "N/A"}
        </p>

        {/* Editable Form Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "2.5px solid #000", marginBottom: 30 }}>
          <tbody>
            <tr>
              <th
  style={{
    border: "1px solid #000",
    padding: 12,
    background: darkMode ? "#374151" : "#f0f0f0",
    color: darkMode ? "#fff" : "#000",
    width: "30%"
  }}
>Date</th>
              <td style={{ border: "1px solid #000", padding: 12 }}>
                {tripData.requestedDateTime 
                  ? new Date(tripData.requestedDateTime).toLocaleDateString("en-PH")
                  : tripData.dateTime 
                    ? new Date(tripData.dateTime).toLocaleDateString("en-PH")
                    : "—"}
              </td>
            </tr>
            <tr>
              <th
  style={{
    border: "1px solid #000",
    padding: 12,
    background: darkMode ? "#374151" : "#f0f0f0",
    color: darkMode ? "#fff" : "#000",
    width: "30%"
  }}
>Driver</th>
              <td style={{ border: "1px solid #000", padding: 12 }}>
                {tripData.delegatedDriverName || tripData.driverName || "—"}
              </td>
            </tr>
            <tr>
              <th
  style={{
    border: "1px solid #000",
    padding: 12,
    background: darkMode ? "#374151" : "#f0f0f0",
    color: darkMode ? "#fff" : "#000",
    width: "30%"
  }}
>Plate Number</th>
              <td style={{ border: "1px solid #000", padding: 12 }}>
                {tripData.requestedVehicle || tripData.vehicleAssigned || "—"}
              </td>
            </tr>
            <tr>
              <th
  style={{
    border: "1px solid #000",
    padding: 12,
    background: darkMode ? "#374151" : "#f0f0f0",
    color: darkMode ? "#fff" : "#000",
    width: "30%"
  }}
>Purpose</th>
              <td style={{ border: "1px solid #000", padding: 12 }}>
                {tripData.purpose 
                  ? (Array.isArray(tripData.purpose) ? tripData.purpose.join(", ") : tripData.purpose)
                  : "—"}
              </td>
            </tr>
            <tr>
             <th
  style={{
    border: "1px solid #000",
    padding: 12,
    background: darkMode ? "#374151" : "#f0f0f0",
    color: darkMode ? "#fff" : "#000",
    width: "30%"
  }}
>Passengers</th>
              <td style={{ border: "1px solid #000", padding: 12 }}>
                {tripData.passengers 
                  ? (Array.isArray(tripData.passengers) 
                      ? tripData.passengers.join(", ") 
                      : typeof tripData.passengers === 'string' 
                        ? tripData.passengers 
                        : "—")
                  : "—"}
              </td>
            </tr>

                      <tr>
                  <th
  style={{
    border: "1px solid #000",
    padding: 12,
    background: darkMode ? "#374151" : "#f0f0f0",
    color: darkMode ? "#fff" : "#000",
    width: "30%"
  }}
>
                    Estimated Time of Arrival
                  </th>
                  <td style={{ border: "1px solid #000", padding: 12 }}>
                    <input
                      type="text"
                      value={formatETA(tripData.estimatedArrival) || ""}
                      onChange={(e) => setTripData({ 
                        ...tripData, 
                        estimatedArrival: e.currentTarget.value 
                      })}
                      style={{
                        width: "100%",
                        border: "none",
                        borderBottom: "2px solid #000",
                        background: darkMode ? "#111827" : "#fff",
                        color: darkMode ? "#fff" : "#000"
                      }}
                      placeholder="e.g. 10:00 AM"
                    />
                    {!tripData.estimatedArrival && (
                      <small style={{ color: "#ef4444", display: "block", marginTop: "4px" }}>
                        * ETA not yet set in this trip record
                      </small>
                    )}
                  </td>
                </tr>
                        <tr>
                   <th
              style={{
                border: "1px solid #000",
                padding: 12,
                background: darkMode ? "#374151" : "#f0f0f0",
                color: darkMode ? "#fff" : "#000",
                width: "30%"
              }}
            >Speedometer Reading</th>
              <td style={{ border: "1px solid #000", padding: 12 }}>
                <strong style={{ fontSize: "16px" }}>
                  {speedoDisplay} km
                </strong>
                {speedoDisplay === "—" && (
                  <small style={{ color: "#ef4444", display: "block", marginTop: "4px" }}>
                    * Maintenance checklist not yet completed for this vehicle
                  </small>
                )}
              </td>
            </tr>
                                   <tr>
              <th
              style={{
                border: "1px solid #000",
                padding: 12,
                background: darkMode ? "#374151" : "#f0f0f0",
                color: darkMode ? "#fff" : "#000",
                width: "30%"
              }}
            >Fuel in Tank</th>
              <td style={{ border: "1px solid #000", padding: 12 }}>
                <input
                  type="text"
                  value={tripData.fuelInTank || getBalanceInTank()}
                  onChange={(e) => setTripData({ ...tripData, fuelInTank: e.currentTarget.value })}
                  style={{
                    width: "100%",
                    border: "none",
                    borderBottom: "2px solid #000",
                    background: darkMode ? "#111827" : "#fff",
                    color: darkMode ? "#fff" : "#000"
                  }}
                  placeholder="e.g. 25 L"
                />
              </td>
            </tr>
            {showRefuelRow && (
              <tr>
                <th
              style={{
                border: "1px solid #000",
                padding: 12,
                background: darkMode ? "#374151" : "#f0f0f0",
                color: darkMode ? "#fff" : "#000",
                width: "30%"
              }}
            >Refuel</th>
                <td style={{ 
                  border: "1px solid #000", 
                  padding: 12, 
                  color: "#ef4444", 
                  fontWeight: "bold",
                  fontSize: "16px"
                }}>
                  {refuelAmount} L
                </td>
              </tr>
            )}
          </tbody>
        </table>

                {/* ==================== B. TO BE FILLED BY THE DRIVER ==================== */}
        <div style={{
          marginTop: "35px",
          padding: "25px",
          border: "2.5px solid #000",
          borderRadius: "6px",
          background: darkMode ? "#1f2937" : "#ffffff"
        }}>
          <h3 style={{ 
            fontSize: "18px", 
            fontWeight: "bold", 
            marginBottom: "20px",
            color: darkMode ? "#60a5fa" : "#1e3a8a" 
          }}>
            B. To Be Filled by the Driver
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px", fontSize: "15px" }}>

            {/* 1 & 2 */}
            <div style={{ display: "flex", gap: "25px" }}>
              <div style={{ flex: 1 }}>
                1. Time of Departure from Office/Garage
                <input
                  type="text"
                  value={tripData.driverLog?.timeDepartureOffice || ""}
                  onChange={(e) => handleDriverLogChange({ timeDepartureOffice: e.currentTarget.value })}
                  style={{ display: "block", width: "100%", marginTop: "5px", border: "none", borderBottom: "2px solid #000", background: "transparent", color: darkMode ? "#fff" : "#000" }}
                  placeholder="___________________________"
                />
              </div>
              <div style={{ flex: 1 }}>
                2. Time of Arrival back to Office/Garage
                <input
                  type="text"
                  value={tripData.driverLog?.timeArrivalBackOffice || ""}
                  onChange={(e) => handleDriverLogChange({ timeArrivalBackOffice: e.currentTarget.value })}
                  style={{ display: "block", width: "100%", marginTop: "5px", border: "none", borderBottom: "2px solid #000", background: "transparent", color: darkMode ? "#fff" : "#000" }}
                  placeholder="___________________________"
                />
              </div>
            </div>

            {/* 3 - Gasoline */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                3. Gasoline Issued purchased and consumed
                <input
                  type="text"
                  value={tripData.driverLog?.gasolineIssuedConsumed || ""}
                  onChange={(e) => handleDriverLogChange({ gasolineIssuedConsumed: e.currentTarget.value })}
                  style={{ width: "90px", border: "none", borderBottom: "2px solid #000", background: "transparent", color: darkMode ? "#fff" : "#000", textAlign: "center" }}
                  placeholder="_______"
                />
                Liters
              </div>

              <div style={{ marginLeft: "30px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>a. Balance In tank 
                  <input type="text" value={tripData.driverLog?.balanceInTankStart || ""} 
                         onChange={(e) => handleDriverLogChange({ balanceInTankStart: e.currentTarget.value })}
                         style={{ width: "110px", marginLeft: "12px", border: "none", borderBottom: "2px solid #000", background: "transparent" }} /> Liters
                </div>
                <div>b. Add purchased during trip 
                  <input type="text" value={tripData.driverLog?.purchasedDuringTrip || ""} 
                         onChange={(e) => handleDriverLogChange({ purchasedDuringTrip: e.currentTarget.value })}
                         style={{ width: "110px", marginLeft: "12px", border: "none", borderBottom: "2px solid #000", background: "transparent" }} /> Liters
                </div>
                <div style={{ fontWeight: "bold" }}>
                  TOTAL: 
                  <input type="text" value={tripData.driverLog?.totalFuel || ""} 
                         onChange={(e) => handleDriverLogChange({ totalFuel: e.currentTarget.value })}
                         style={{ width: "110px", marginLeft: "12px", border: "none", borderBottom: "2px solid #000", background: "transparent", fontWeight: "bold" }} /> Liters
                </div>
                <div>c. Deduct Used During the Trip (To and From) 
                  <input type="text" value={tripData.driverLog?.usedDuringTrip || ""} 
                         onChange={(e) => handleDriverLogChange({ usedDuringTrip: e.currentTarget.value })}
                         style={{ width: "110px", marginLeft: "12px", border: "none", borderBottom: "2px solid #000", background: "transparent" }} /> Liters
                </div>
                <div>d. Balance In Tank at the end of trip 
                  <input type="text" value={tripData.driverLog?.balanceInTankEnd || ""} 
                         onChange={(e) => handleDriverLogChange({ balanceInTankEnd: e.currentTarget.value })}
                         style={{ width: "110px", marginLeft: "12px", border: "none", borderBottom: "2px solid #000", background: "transparent" }} /> Liters
                </div>
              </div>
            </div>

            {/* 4 - Speedometer (Fully Editable) */}
            <div>
              <div>4. Speedometer readings if any:</div>
              <div style={{ marginLeft: "30px", marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  At beginning of trip 
                  <input type="text" value={tripData.driverLog?.speedometerBegin || ""} 
                         onChange={(e) => handleDriverLogChange({ speedometerBegin: e.currentTarget.value })}
                         style={{ width: "130px", marginLeft: "12px", border: "none", borderBottom: "2px solid #000", background: "transparent" }} />
                  kms.
                </div>
                <div>
                  At end of trip 
                  <input type="text" value={tripData.driverLog?.speedometerEnd || ""} 
                         onChange={(e) => handleDriverLogChange({ speedometerEnd: e.currentTarget.value })}
                         style={{ width: "130px", marginLeft: "12px", border: "none", borderBottom: "2px solid #000", background: "transparent" }} />
                  kms.
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  Distance Travelled/DIVISOR 
                  <input type="text" value={tripData.driverLog?.distanceTravelled || ""} 
                         onChange={(e) => handleDriverLogChange({ distanceTravelled: e.currentTarget.value })}
                         style={{ width: "90px", marginLeft: "8px", marginRight: "8px", border: "none", borderBottom: "2px solid #000", background: "transparent", textAlign: "center" }} />
                  km/liters 
                  <input type="text" value={tripData.driverLog?.distanceTravelled || ""} 
                         onChange={(e) => handleDriverLogChange({ distanceTravelled: e.currentTarget.value })}
                         style={{ width: "130px", marginLeft: "8px", border: "none", borderBottom: "2px solid #000", background: "transparent" }} />
                  kms.
                </div>
              </div>
            </div>

            {/* 5 - Remarks */}
            <div>
              <div>5. REMARKS:</div>
              <textarea
                value={tripData.driverLog?.remarks || ""}
                onChange={(e) => handleDriverLogChange({ remarks: e.currentTarget.value })}
                rows={3}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  border: "2px solid #000",
                  padding: "10px",
                  fontSize: "15px",
                  resize: "vertical",
                  background: darkMode ? "#374151" : "#fff",
                  color: darkMode ? "#fff" : "#000"
                }}
                placeholder="Write your remarks here..."
              />
            </div>

          </div>
        </div>

{/* Editable Signatures */}
        <div style={{ marginTop: 40 }}>
         
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          
            <div style={{ width: "32%", textAlign: "center" }}>
              Recommended by:<br />
              <input
                type="text"
                value={tripData.recommendedBy || ""}
                onChange={(e) => setTripData({ ...tripData, recommendedBy: e.currentTarget.value })}
                style={{
                  width: "85%",
                  marginTop: 35,
                  border: "none",
                  borderBottom: "2px solid #000",
                  textAlign: "center",
                  background: darkMode ? "#111827" : "#fff",
                  color: darkMode ? "#fff" : "#000"
                }}
              />
              <div style={{ marginTop: 8 }}>Division Manager / Supervisor</div>
            </div>
            <div style={{ width: "32%", textAlign: "center" }}>
              Approved by:<br />
              <input
                type="text"
                value={tripData.approvedBy || ""}
                onChange={(e) => setTripData({ ...tripData, approvedBy: e.currentTarget.value })}
                style={{
                  width: "85%",
                  marginTop: 35,
                  border: "none",
                  borderBottom: "2px solid #000",
                  textAlign: "center",
                  background: darkMode ? "#111827" : "#fff",
                  color: darkMode ? "#fff" : "#000"
                }}
              />
              <div style={{ marginTop: 8 }}>Asst. Chief</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <button
            onClick={handlePrint}
            style={{ 
              padding: "12px 32px", 
              background: "#4f46e5", 
              color: "#fff", 
              border: "none", 
              borderRadius: "6px", 
              marginRight: 15, 
              cursor: "pointer", 
              fontSize: "16px" 
            }}
          >
            🖨️ Print Driver's Trip Ticket
          </button>

          <button
            onClick={() => setShowTripTicket(false)}
            style={{ 
              padding: "12px 32px", 
              background: "#ef4444", 
              color: "#fff", 
              border: "none", 
              borderRadius: "6px", 
              cursor: "pointer", 
              fontSize: "16px" 
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
