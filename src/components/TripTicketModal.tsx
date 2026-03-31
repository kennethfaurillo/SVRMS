import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { firebaseFirestore } from "../firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
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

  // ==================== FETCH TRIP DATA ====================
  useEffect(() => {
    if (!showTripTicket || !requestId) {
      setTripData(null);
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
          setTripData({ id: doc.id, ...data });
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

  const returnHome = tripData.returnHomeTime || "—";
  const tripTicketNo = tripData.tripCode || tripData.tripTicketNumber || "N/A";

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
            margin: 8mm; 
          }
          body { 
            font-family: Arial, sans-serif; 
            color: #000; 
            margin: 0; 
            padding: 0;
          }
          .ticket {
            width: 100%;
            border: 3px solid #000 !important;
            padding: 15px 18px;
            box-sizing: border-box;
            margin-bottom: 12px;
            page-break-inside: avoid;
            height: 47%;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 12px; 
            border-bottom: 3px solid #000; 
            padding-bottom: 8px; 
          }
          .logo { height: 52px; }
          h2 { 
            text-align: center; 
            margin: 12px 0 18px; 
            font-size: 21px; 
            font-weight: bold; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 18px; 
          }
          th, td { 
            border: 2px solid #000; 
            padding: 8px 10px; 
            font-size: 14px; 
            vertical-align: middle; 
          }
          th { 
            background-color: #f0f0f0; 
            text-align: left; 
            width: 32%; 
          }
          .note {
            font-size: 12.5px;
            text-align: center;
            margin: 12px 0 18px;
            font-style: italic;
          }
          .signatures {
            display: flex;
            justify-content: space-around;
            margin-top: 35px;
            font-size: 13px;
          }
          .signature-box {
            text-align: center;
            width: 30%;
          }
          .signature-name {
            font-weight: bold;
            min-height: 24px;
            margin-bottom: 6px;
          }
          .signature-line {
            border-top: 2px solid #000;
            width: 80%;
            margin: 0 auto 6px auto;
          }
          .small-text {
            font-size: 11px;
            text-align: right;
            margin-top: 15px;
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
            <tr><th>Return Home</th><td colspan="3">${returnHome}</td></tr>
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
            <tr><th>Return Home</th><td colspan="3">${returnHome}</td></tr>
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

          <p class="small-text">* Print Trip Ticket No. – Admin Feature Only</p>
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
          Trip Ticket No.: {tripData.tripCode || tripData.tripTicketNumber || "N/A"}
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
    <tr>
      <th style={{ border: "1px solid #000", padding: 12, background: "#f0f0f0" }}>Return Home Time</th>
      <td style={{ border: "1px solid #000", padding: 12 }}>
        {tripData.returnHomeTime || "—"}
      </td>
    </tr>
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
