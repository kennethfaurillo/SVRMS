import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { firebaseFirestore } from "../firebase";
import { collection, query, where, getDocs, limit, orderBy, Timestamp } from "firebase/firestore";
import type { Request } from "../types";

interface TripTicketModalProps {
  showTripTicket: boolean;
  setShowTripTicket: (value: boolean) => void;
  requestId: string | null;
}

export default function TripTicketModal({
  showTripTicket,
  setShowTripTicket,
  requestId,
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
      console.log(`⚠️ No maintenance before ${targetDate.toLocaleDateString("en-PH")} for ${vehiclePlate}`);
      setMaintenanceData(null);
    }
  } catch (err) {
    console.error("Error fetching maintenance:", err);
    
    // Fallback sa dati mong code
    console.log("Falling back to old logic...");
    const fallbackQ = query(
      collection(firebaseFirestore, "maintenanceReports"),
      where("plateNumber", "==", vehiclePlate)
    );
    const fallbackSnap = await getDocs(fallbackQ);
    
    if (!fallbackSnap.empty) {
      const sorted = fallbackSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setMaintenanceData(sorted[0]);
    }
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
  // Priority 1: Value saved directly in Trip document
  if (tripData?.speedometerReading) {
    return tripData.speedometerReading.toString();
  }

  // Priority 2: Latest value from Maintenance Checklist (this is what you want)
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

          // ====================== ULTRA SAFE EXTRACTION (walang TypeScript error) ======================
          const plate = 
            (data as any).requestedVehicle || 
            (data as any).vehicleAssigned || 
            (trip as any).requestedVehicle || 
            (trip as any).vehicleAssigned || 
            "";

          // Safe date extraction - sinusuri lahat ng posibleng field names
          let requestDateInput: string | Date = new Date();

          if ((data as any).requestedDateTime) {
            requestDateInput = (data as any).requestedDateTime;
          } else if ((data as any).dateTime) {
            requestDateInput = (data as any).dateTime;
          } else if ((trip as any).requestedDateTime) {
            requestDateInput = (trip as any).requestedDateTime;
          } else if ((trip as any).dateTime) {
            requestDateInput = (trip as any).dateTime;
          }

          if (plate) {
            console.log(`🔍 Fetching maintenance for plate: "${plate}" | Date used:`, requestDateInput);
            await fetchMaintenanceData(plate, requestDateInput);   // Pass plate + date
          } else {
            console.log("⚠️ No plate number found in this trip record.");
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
      return Math.ceil(fullTank - balance);   // Kung magkano ang kailangan irefuel
    }
    return 0;
  })();

  const showRefuelRow = refuelAmount > 0;

  // ==================== PRINT FUNCTION (2 copies on 1 A4) ====================
 
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

  
  let refuelDisplay = "NO NEED";
  if (maintenanceData?.driverSection?.balanceInTank !== undefined) {
    const balance = Number(maintenanceData.driverSection.balanceInTank);
    const plateUpper = (plate || "").toUpperCase();
    const isMotorcycle = plateUpper.includes("TRYC") || plateUpper.includes("MC") || plateUpper.includes("MOTOR");
    const fullTank = isMotorcycle ? 10 : 20;
    const threshold = fullTank * 0.20;

    if (balance <= threshold) {
      refuelDisplay = "⚠️ NEED REFUEL";
    }
  }

 const tripTicketNo = tripData.tripCode || "N/A";

  // Signature values
  const mechanicName = tripData.mechanicName || "";
  const recommendedBy = tripData.recommendedBy || "";
  const approvedBy = tripData.approvedBy || "";

  return `
    <html>
      <head>
        <title>DRIVER'S TRIP TICKET</title>
        <style>
         @page { 
            size: A4 portrait; 
            margin: 5mm; 
          }
          body { 
            font-family: Arial, sans-serif; 
            color: #000; 
            margin: 0; 
            padding: 0;
          }
          .ticket {
            width: 100%;
            border: 3px solid #000;
            padding: 12px 15px;
            box-sizing: border-box;
            margin-bottom: 10px;
            page-break-inside: avoid;
            height: 48.5%;
            display: flex;
            flex-direction: column;
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
            vertical-align: middle; 
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
            margin: 10px 0 14px;
            font-style: italic;
          }
          .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: auto;
            font-size: 12.5px;
          }
          .signature-box {
            text-align: center;
            width: 30%;
          }
          .signature-name {
            font-weight: bold;
            min-height: 20px;
            margin-bottom: 4px;
          }
          .signature-line {
            border-top: 2px solid #000;
            width: 85%;
            margin: 0 auto 4px auto;
          }
          .small-text {
            font-size: 10px;
            text-align: right;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
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
           ${showRefuelRow ? `<tr><th>Refuel</th><td colspan="3">${refuelAmount} L</td></tr>` : ''}
          </table>

          <div class="note">
            <strong>Return this trip ticket to GS after vehicle use.</strong>
          </div>

          <div class="signatures">
            <div class="signature-box">
              <div class="signature-name">${mechanicName}</div>
              <div class="signature-line"></div>
              Mechanic
            </div>
            <div class="signature-box">
              <div class="signature-name">${recommendedBy}</div>
              <div class="signature-line"></div>
              Division Mgr.
            </div>
            <div class="signature-box">
              <div class="signature-name">${approvedBy}</div>
              <div class="signature-line"></div>
              Asst. Chief
            </div>
          </div>
        </div>

        <!-- Second Copy -->
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
           ${showRefuelRow ? `<tr><th>Refuel</th><td colspan="3">${refuelAmount} L</td></tr>` : ''}
          </table>

          <div class="note">
            <strong>Return this trip ticket to GS after vehicle use.</strong>
          </div>

          <div class="signatures">
            <div class="signature-box">
              <div class="signature-name">${mechanicName}</div>
              <div class="signature-line"></div>
              Mechanic
            </div>
            <div class="signature-box">
              <div class="signature-name">${recommendedBy}</div>
              <div class="signature-line"></div>
              Division Mgr.
            </div>
            <div class="signature-box">
              <div class="signature-name">${approvedBy}</div>
              <div class="signature-line"></div>
              Asst. Chief
            </div>
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
  const tripTicketNo = tripData.tripCode || tripData.tripTicketNumber || "N/A";
    const speedoDisplay = getSpeedometerReading();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={() => setShowTripTicket(false)}>
      <div style={{ background: "#fff", width: "95%", maxWidth: "920px", maxHeight: "95vh", overflowY: "auto", padding: "25px", borderRadius: "8px" }} onClick={(e) => e.stopPropagation()}>
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
       {/* Information Table - with better fallbacks */}
<table style={{ width: "100%", borderCollapse: "collapse", border: "2.5px solid #000", marginBottom: 30 }}>
          <tbody>
            <tr>
              <th style={{ border: "1px solid #000", padding: 12, background: "#f0f0f0", width: "30%" }}>Date</th>
              <td style={{ border: "1px solid #000", padding: 12 }}>
                {tripData.requestedDateTime 
                  ? new Date(tripData.requestedDateTime).toLocaleDateString("en-PH")
                  : tripData.dateTime 
                    ? new Date(tripData.dateTime).toLocaleDateString("en-PH")
                    : "—"}
              </td>
            </tr>
            <tr>
              <th style={{ border: "1px solid #000", padding: 12, background: "#f0f0f0" }}>Driver</th>
              <td style={{ border: "1px solid #000", padding: 12 }}>
                {tripData.delegatedDriverName || tripData.driverName || "—"}
              </td>
            </tr>
            <tr>
              <th style={{ border: "1px solid #000", padding: 12, background: "#f0f0f0" }}>Plate Number</th>
              <td style={{ border: "1px solid #000", padding: 12 }}>
                {tripData.requestedVehicle || tripData.vehicleAssigned || "—"}
              </td>
            </tr>
            <tr>
              <th style={{ border: "1px solid #000", padding: 12, background: "#f0f0f0" }}>Purpose</th>
              <td style={{ border: "1px solid #000", padding: 12 }}>
                {tripData.purpose 
                  ? (Array.isArray(tripData.purpose) ? tripData.purpose.join(", ") : tripData.purpose)
                  : "—"}
              </td>
            </tr>
            <tr>
              <th style={{ border: "1px solid #000", padding: 12, background: "#f0f0f0" }}>Passengers</th>
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

            {/* Bagong Fields mula sa handwritten form */}
                      <tr>
                  <th style={{ border: "1px solid #000", padding: 12, background: "#f0f0f0" }}>
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
                      style={{ width: "100%", border: "none", borderBottom: "2px solid #000" }}
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
              <th style={{ border: "1px solid #000", padding: 12, background: "#f0f0f0" }}>Speedometer Reading</th>
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
              <th style={{ border: "1px solid #000", padding: 12, background: "#f0f0f0" }}>Fuel in Tank</th>
              <td style={{ border: "1px solid #000", padding: 12 }}>
                <input
                  type="text"
                  value={tripData.fuelInTank || getBalanceInTank()}
                  onChange={(e) => setTripData({ ...tripData, fuelInTank: e.currentTarget.value })}
                  style={{ width: "100%", border: "none", borderBottom: "2px solid #000" }}
                  placeholder="e.g. 25 L"
                />
              </td>
            </tr>
            {showRefuelRow && (
  <tr>
    <th style={{ border: "1px solid #000", padding: 12, background: "#f0f0f0" }}>Refuel</th>
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

{/* Editable Signatures */}
        <div style={{ marginTop: 40 }}>
          <strong>Signatures:</strong>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
            <div style={{ width: "32%", textAlign: "center" }}>
              Mechanic:<br />
              <input
                type="text"
                value={tripData.mechanicName || ""}
                onChange={(e) => setTripData({ ...tripData, mechanicName: e.currentTarget.value })}
                style={{ width: "85%", marginTop: 35, border: "none", borderBottom: "2px solid #000", textAlign: "center" }}
              />
            </div>
            <div style={{ width: "32%", textAlign: "center" }}>
              Recommended by:<br />
              <input
                type="text"
                value={tripData.recommendedBy || ""}
                onChange={(e) => setTripData({ ...tripData, recommendedBy: e.currentTarget.value })}
                style={{ width: "85%", marginTop: 35, border: "none", borderBottom: "2px solid #000", textAlign: "center" }}
              />
              <div style={{ marginTop: 8 }}>Division Manager / Supervisor</div>
            </div>
            <div style={{ width: "32%", textAlign: "center" }}>
              Approved by:<br />
              <input
                type="text"
                value={tripData.approvedBy || ""}
                onChange={(e) => setTripData({ ...tripData, approvedBy: e.currentTarget.value })}
                style={{ width: "85%", marginTop: 35, border: "none", borderBottom: "2px solid #000", textAlign: "center" }}
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
