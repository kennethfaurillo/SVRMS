import { addDoc, collection, deleteDoc, doc, DocumentReference, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import ApproveModal from './components/ApproveModal';
import Loader from './components/Loader';
import LoginModal from './components/LoginModal';
import RequestForm from './components/RequestForm';
import RequestsTable from './components/RequestsTable';
import TripsTable from './components/TripsTable';
import { useAuth } from './contexts/AuthContext';
import { firebaseFirestore } from './firebase';
import useRequests from './hooks/useRequests';
import useTrips from './hooks/useTrips';
import { type Notification, type Request, type Trip } from './types';
import { exportToCsv } from './utils';

export function App() {
  // Firebase 
  const db = firebaseFirestore
  const [message, setMessage] = useState('');
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [currentEditData, setCurrentEditData] = useState<Request | null>(null); // Stores data for the currently edited row
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const { requests, addRequest } = useRequests();
  const { trips } = useTrips();
  const { user, isAdmin, signOutUser } = useAuth();

  // Login modal state
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Toggle state for showing new request form
  const [showRequestForm, setShowRequestForm] = useState(true);

  // Approve modal state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState<Request | null>(null);

  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Effect to apply dark mode class to documentElement and save preference
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);
  // Effect to handle authentication message
  useEffect(() => {
    if (isAdmin) {
      setMessage(`Welcome ${user?.email || 'User'}! You are logged in as an ${isAdmin ? 'Admin' : 'User'}.`);
    }
  }, [isAdmin]);
  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };
  // Function to handle logout
  const handleLogout = async () => {
    try {
      await signOutUser();
      setMessage('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setMessage('Error logging out');
    }
  };
  // Function to add a new notification
  const addNotification = (type: Notification['type'], details: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setNotifications(prev => [{ id: Date.now().toString(), type, details, timestamp }, ...prev].slice(0, 5)); // Keep last 5 notifications
  };
  // Function to handle request form submission
  const handleSubmitRequest = async (requestData: Request) => {
    const response = await addRequest(requestData);
    if (response.ok) {
      addNotification('added', `${requestData.requesterName} Added request ${requestData.requestedVehicle}.`)
      setMessage(`Request submitted successfully! ID: ${response.docRef?.id}`);
    } else {
      setMessage(`Error submitting request: ${response.error}`);
    }
  }
  // Function to initiate editing, showing the admin modal first
  const handleUpdateClick = (request: Request) => {
    if (request?.id) {
      setEditingRequestId(request.id);
      setCurrentEditData(request);
    }
  };

  // Function to initiate deletion, showing the admin modal first
  const handleDeleteClick = async (request: Request) => {
    try {
      await deleteDoc(doc(db, `requests`, request.id));
      addNotification('deleted', `${request.requesterName} Deleted request: "${request.requestedVehicle}"`);
      setMessage(`Request ${request.requestedVehicle} (${new Date(request.requestedDateTime).toLocaleString()}) deleted successfully!`);
    } catch (error) {
      console.error("Error deleting document:", error);
      setMessage(`Error deleting request: ${error.message}`);
    }
  };

  // Function to cancel editing
  const cancelEditing = () => {
    setEditingRequestId(null);
    setCurrentEditData(null);
    setMessage(''); // Clear any previous messages
  };

  // Handle changes in editable fields
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setCurrentEditData(prevData => {
      const newData = { ...prevData };
      if (name === 'isDriverRequested') { // Handle dropdown change for isDriverRequested
        newData.isDriverRequested = value;
        // If isDriverRequested changes to 'No', clear delegatedDriverName
        if (value === 'No') {
          console.log('clearing')
          newData.delegatedDriverName = null;
        }
      } else {
        newData[name] = value;
      }

      if (name === 'remarks' && !(value || '').toLowerCase().includes('completed')) {
        newData.completedDate = '';
      }
      return newData;
    });
  };

  // Function to save updated request
  const saveEditedRequest = async (requestId: string) => {
    if (!db) {
      setMessage("Firebase not initialized.");
      return;
    }

    if (!currentEditData) {
      setMessage("No edit data found.");
      return;
    }

    try {
      const dataToUpdate = {
        requestedVehicle: currentEditData.requestedVehicle,
        requesterName: currentEditData.requesterName,
        department: currentEditData.department,
        isDriverRequested: currentEditData.isDriverRequested,
        delegatedDriverName: currentEditData.delegatedDriverName ?? null,
        purpose: currentEditData.purpose,
        destination: currentEditData.destination,
        requestedDateTime: currentEditData.requestedDateTime,
        status: currentEditData.status,
        remarks: currentEditData.remarks,
        completedDate: (currentEditData.remarks || '').toLowerCase().includes('completed') ? currentEditData.completedDate : null,
      };

      await updateDoc(doc(db, `requests`, requestId), dataToUpdate);

      let notificationDetails = `${currentEditData.requesterName} Updated request ${currentEditData.requestedVehicle}.`;

      addNotification('updated', notificationDetails);
      setMessage(`Request ${requestId} updated successfully!`);
      setEditingRequestId(null);
      setCurrentEditData(null);
    } catch (error) {
      console.error("Error updating request:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Error updating request: ${errorMessage}`);
      let notificationDetails = `Failed to update request "${currentEditData.requestedVehicle}" by ${currentEditData.requesterName}. Error: ${errorMessage}`;
      addNotification('update attempt', notificationDetails);
    }
  };

  // Function to trigger admin modal for CSV export
  const handleExportClick = () => {
    exportToCsv(requests);
  };

  // Function to handle approve button click
  const handleApproveClick = (request: Request) => {
    setRequestToApprove(request);
    setShowApproveModal(true);
  };

  // Function to handle trip approval and management
  const handleApproveSubmit = async (tripCode: string, isNewTrip: boolean, tripData?: Partial<Trip>) => {
    if (!requestToApprove || !db) {
      setMessage("No request to approve or Firebase not initialized.");
      return;
    }

    try {
      const batch = writeBatch(db);
      // Create a document reference for the request
      const requestRef = doc(db, 'requests', requestToApprove.id);

      if (isNewTrip) {
        // Update the request with approved status
        // await updateDoc(requestRef, {
        //   status: 'Approved'
        // });
        batch.update(requestRef, {
          status: 'Approved',
          requestedDateTime: tripData?.dateTime || requestToApprove.requestedDateTime,
          requestedVehicle: tripData?.vehicleAssigned || requestToApprove.requestedVehicle,
          isDriverRequested: tripData?.driverName ? 'Yes' : 'No',
          delegatedDriverName: tripData?.driverName || (requestToApprove.isDriverRequested === 'Yes' ? requestToApprove.delegatedDriverName || null : null)
        })

        // Create new trip document following the new schema
        const newTrip: Trip = {
          id: '', // This will be set by Firebase
          tripCode,
          dateTime: tripData?.dateTime || requestToApprove.requestedDateTime,
          vehicleAssigned: tripData?.vehicleAssigned || requestToApprove.requestedVehicle,
          driverName: tripData?.driverName || (requestToApprove.isDriverRequested === 'Yes' ? requestToApprove.delegatedDriverName || null : null),
          personnel: [requestToApprove.requesterName],
          purpose: [requestToApprove.purpose],
          destination: requestToApprove.destination,
          requests: [doc(db, 'requests', requestToApprove.id) as DocumentReference<Request>],
          status: 'Not Fulfilled'
        };
        const newTripRef = doc(collection(db, 'trips'));
        batch.set(newTripRef, newTrip);
        await batch.commit();
        // await addDoc(collection(db, 'trips'), newTrip);
        setMessage(`Request approved and new trip ${tripCode} created!`);
      } else {
        // Find existing trip by tripCode and append request reference
        const tripsRef = collection(db, 'trips');
        const tripQuery = query(tripsRef, where('tripCode', '==', tripCode));
        const tripSnapshot = await getDocs(tripQuery);

        if (!tripSnapshot.empty) {
          const existingTripDoc = tripSnapshot.docs[0];
          const existingTrip = existingTripDoc.data() as Trip;

          // Update the request to match the existing trip's datetime, vehicle, and driver
          // but keep the request's own personnel, purpose, destination, and remarks
          await updateDoc(requestRef, {
            status: 'Approved',
            requestedDateTime: existingTrip.dateTime,
            requestedVehicle: existingTrip.vehicleAssigned,
            isDriverRequested: existingTrip.driverName ? 'Yes' : 'No',
            delegatedDriverName: existingTrip.driverName || null
          });

          const updatedRequests = [...existingTrip.requests, requestRef as any];

          // Update personnel array (add if not already present)
          const updatedPersonnel = [...(existingTrip.personnel || [])];
          if (!updatedPersonnel.includes(requestToApprove.requesterName)) {
            updatedPersonnel.push(requestToApprove.requesterName);
          }

          // Update purpose array (add if not already present)
          const updatedPurpose = [...(existingTrip.purpose || [])];
          if (!updatedPurpose.includes(requestToApprove.purpose)) {
            updatedPurpose.push(requestToApprove.purpose);
          }

          // Update the trip with new request data
          await updateDoc(doc(db, 'trips', existingTripDoc.id), {
            requests: updatedRequests,
            personnel: updatedPersonnel,
            purpose: updatedPurpose,
            // Keep the existing dateTime, vehicleAssigned, and driverName unless they're not set
            dateTime: existingTrip.dateTime || requestToApprove.requestedDateTime,
            vehicleAssigned: existingTrip.vehicleAssigned || requestToApprove.requestedVehicle,
            driverName: existingTrip.driverName || (requestToApprove.isDriverRequested === 'Yes' ? requestToApprove.delegatedDriverName || null : null),
          });
          setMessage(`Request approved and added to existing trip ${tripCode}!`);
        } else {
          setMessage(`Error: Trip ${tripCode} not found!`);
          return;
        }
      }

      addNotification('updated', `${requestToApprove.requesterName} Request approved for trip ${tripCode}.`);
      setRequestToApprove(null);
    } catch (error) {
      console.error("Error approving request:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Error approving request: ${errorMessage}`);
      addNotification('update attempt', `Failed to approve request "${requestToApprove.requestedVehicle}" by ${requestToApprove.requesterName}. Error: ${errorMessage}`);
    }
  };

  // Show loader if user is not authenticated
  if (!user) {
    return <Loader darkMode={darkMode} />;
  }

  return (
    <div className={`min-h-screen p-4 font-sans flex flex-col items-center ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-blue-100 to-purple-200 text-gray-900'}`}>
      <div className={`w-full max-w-10/12 shadow-xl rounded-xl p-6 md:p-8 space-y-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-extrabold text-center flex-grow">
            Service Vehicle Request
          </h1>
          <div className="relative flex items-center space-x-4">
            {/* Login/Logout Button */}
            <button
              onClick={!isAdmin ? () => setShowLoginModal(true) : handleLogout}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} cursor-pointer`}
              title={!isAdmin ? "Sign In" : "Sign Out"}
            >
              {!isAdmin ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors duration-200 ease-in-out ${darkMode ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'} cursor-pointer`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M3 12H2m8.007-4.243l.707-.707M15.293 15.293l.707.707M12 18a6 6 0 110-12 6 6 0 010 12zM4.243 4.243l-.707.707m11.314 11.314l.707.707M4.243 15.757l-.707-.707m11.314-11.314l.707-.707" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9 9 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(prev => !prev)}
              className={`p-2 rounded-full transition-colors duration-200 ease-in-out ${darkMode ? 'bg-gray-700 text-blue-300 hover:bg-gray-600' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'} cursor-pointer`}
              title="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0v1" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className={`absolute right-0 mt-2 top-full w-72 rounded-md shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} border border-gray-200 z-10`}>
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <div className={`block px-4 py-2 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Recent Activity</div>
                  {notifications.length === 0 ? (
                    <div className={`block px-4 py-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No new notifications.</div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className={`block px-4 py-2 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'} last:border-b-0`}>
                        <span className="font-medium">{notif.type.toUpperCase()}:</span> {notif.details}
                        <span className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notif.timestamp}</span>
                      </div>
                    ))
                  )}
                  <div className="px-4 py-2">
                    <button
                      onClick={() => setNotifications([])}
                      className="w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className={`${darkMode ? 'bg-blue-800 border-blue-600 text-blue-200' : 'bg-blue-100 border-blue-400 text-blue-700'} px-4 py-3 rounded relative mb-4`} role="alert">
            <span className="block sm:inline">{message}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setMessage('')}>
              <svg className="fill-current h-6 w-6" cursor={'pointer'} role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" /></svg>
            </span>
          </div>
        )}

        {user && (
          <div className={`text-center text-sm mb-4 p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
            Current User: <span className="font-mono break-all">{user.email}</span>
          </div>
        )}
        {/* Request Submission Form */}
        {showRequestForm && (
          <RequestForm
            darkMode={darkMode}
            onSubmit={handleSubmitRequest}
            onToggle={() => setShowRequestForm(false)}
          />
        )}

        {/* Show Form Button - displayed when form is hidden */}
        {!showRequestForm && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowRequestForm(true)}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out ${darkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} cursor-pointer shadow-lg`}
              title="Show Request Form"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Show Request Form
            </button>
          </div>
        )}

        {/* Requests Table */}
        <RequestsTable
          requests={requests}
          darkMode={darkMode}
          editingRequestId={editingRequestId}
          currentEditData={currentEditData}
          handleEditChange={handleEditChange}
          saveEditedRequest={saveEditedRequest}
          cancelEditing={cancelEditing}
          handleUpdateClick={handleUpdateClick}
          handleDeleteClick={handleDeleteClick}
          handleExportClick={handleExportClick}
          handleApproveClick={handleApproveClick}
        />

        {/* Trips Table */}
        <TripsTable
          trips={trips}
          darkMode={darkMode}
        />
      </div>
      {/* Login Modal */}
      <LoginModal
        darkMode={darkMode}
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
      {/* Approve Modal */}
      <ApproveModal
        darkMode={darkMode}
        key={requestToApprove?.id}
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onSubmit={handleApproveSubmit}
        request={requestToApprove}
        existingTrips={trips}
      />
    </div>
  );
}
