import type { Request } from "./types";

type Result = {
  ok: boolean;
  message?: string;
};

// Function to get current date in YYYY-MM-DD format
export const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Function to get current time in HH:MM format
export const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};
// Function to export data to CSV (after admin confirmation)
export const exportToCsv = (requests: Request[]): Result => {
  console.log('Export to CSV...')
  if (requests.length === 0) {
    // setMessage("No data to export.");
    return { ok: true, message: "No data to export." }; // Indicate no data to export
  }

  const headers = [
    "Timestamp", "Service Vehicle", "Requesting Personnel", "Department",
    "Driver Requested", "Delegated Driver Name", "Purpose", "Destination",
    "Requested Date/Time", "ETA", "Status", "Remarks"
  ];

  const csvRows = [];
  csvRows.push(headers.join(',')); // Add header row

  requests.forEach(request => {
    const timestampDate = request.timestamp ? new Date(request.timestamp.toDate()) : null;
    const formattedTimestamp = timestampDate ?
      `${timestampDate.getFullYear()}-${String(timestampDate.getMonth() + 1).padStart(2, '0')}-${String(timestampDate.getDate()).padStart(2, '0')} ` +
      `${String(timestampDate.getHours()).padStart(2, '0')}:${String(timestampDate.getMinutes()).padStart(2, '0')}:${String(timestampDate.getSeconds()).padStart(2, '0')}`
      : 'N/A';

    // Format the requested date/time from ISO string
    const requestedDateTime = request.requestedDateTime ?
      new Date(request.requestedDateTime).toLocaleString() : 'N/A';

    // Format the ETA from ISO string
    const estimatedArrival = request.estimatedArrival ?
      new Date(request.estimatedArrival).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

    const row = [
      `"${formattedTimestamp}"`,
      `"${request.requestedVehicle}"`,
      `"${request.requesterName}"`,
      `"${request.department}"`,
      `"${request.isDriverRequested ? 'Yes' : 'No'}"`,
      `"${request.delegatedDriverName || ''}"`,
      `"${request.purpose}"`,
      `"${request.destination}"`,
      `"${requestedDateTime}"`,
      `"${estimatedArrival}"`,
      `"${request.status}"`,
      `"${request.remarks || ''}"`
    ];
    csvRows.push(row.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'service_vehicle_requests.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // setMessage("Requests exported to CSV successfully!");
  return { ok: true }; // Indicate success
};
