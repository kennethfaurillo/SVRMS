import { collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import notifReqSound from "./assets/notif-request.mp3";
import notifTripSound from "./assets/notif-trip.mp3"
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

  // Request editing states
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [currentEditRequestData, setCurrentEditRequestData] = useState<Request | null>(null);

  // Trip editing states
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [currentEditTripData, setCurrentEditTripData] = useState<Trip | null>(null);
  const [updatingTripId, setUpdatingTripId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const { requests, addRequest } = useRequests(handleRequestChange);
  const { trips } = useTrips(handleTripChange);
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
  const addNotification = (type: Notification['type'], details: string, sound = 'request') => {
    console.log(sound)
    const timestamp = new Date().toLocaleTimeString();
    setNotifications(prev => [{ id: Date.now().toString(), type, details, timestamp }, ...prev].slice(0, 5)); // Keep last 5 notifications
    switch (sound) {
      case 'request':
        console.log("Playing request notification sound");
        new Audio(notifReqSound).play();
        break;
      case 'trip':
        console.log("Playing trip notification sound");
        new Audio(notifTripSound).play();
        break;
      default:
        new Audio(notifReqSound).play();
        break;
    }
  };
  // Function to handle request form submission
  const handleSubmitRequest = async (requestData: Request) => {
    const response = await addRequest(requestData);
    if (response.ok) {
      setMessage(`Request submitted successfully! ID: ${response.docRef?.id}`);
    } else {
      setMessage(`Error submitting request: ${response.error}`);
    }
  }

  // ===== REQUEST HANDLERS =====

  // Function to initiate request editing
  const handleEditRequest = (request: Request) => {
    if (request?.id) {
      setEditingRequestId(request.id);
      setCurrentEditRequestData(request);
    }
  };

  // Function to delete a request
  const handleDeleteRequest = async (request: Request) => {
    if (!request.id) return;
    setUpdatingRequestId(request.id);
    try {
      await deleteDoc(doc(db, 'requests', request.id));
      setMessage(`Request ${request.requestedVehicle} (${new Date(request.requestedDateTime).toLocaleString()}) deleted successfully!`);
    } catch (error) {
      console.error("Error deleting document:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Error deleting request: ${errorMessage}`);
    } finally {
      setUpdatingRequestId(null);
    }
  };

  // Function to cancel request editing
  const cancelRequestEditing = () => {
    setEditingRequestId(null);
    setCurrentEditRequestData(null);
    setMessage(''); // Clear any previous messages
  };

  // Handle changes in request editable fields
  const handleRequestEditChange = (e: any) => {
    const { name, value } = e.target;
    setCurrentEditRequestData(prevData => {
      if (!prevData) return null;
      const newData = { ...prevData };
      if (name === 'isDriverRequested') { // Handle dropdown change for isDriverRequested
        console.log('value', value)
        newData.isDriverRequested = value;
        // If isDriverRequested changes to 'No', clear delegatedDriverName
        if (value === 'No') {
          console.log('clearing')
          newData.delegatedDriverName = null;
        }
      } else {
        (newData as any)[name] = value;
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

    if (!currentEditRequestData) {
      setMessage("No edit data found.");
      return;
    }

    setUpdatingRequestId(requestId);
    try {
      const dataToUpdate = {
        requestedVehicle: currentEditRequestData.requestedVehicle,
        requesterName: currentEditRequestData.requesterName,
        department: currentEditRequestData.department,
        isDriverRequested: currentEditRequestData.isDriverRequested,
        delegatedDriverName: currentEditRequestData.delegatedDriverName ?? null,
        purpose: currentEditRequestData.purpose,
        destination: currentEditRequestData.destination,
        requestedDateTime: currentEditRequestData.requestedDateTime,
        status: currentEditRequestData.status,
        remarks: currentEditRequestData.remarks,
        completedDate: (currentEditRequestData.remarks || '').toLowerCase().includes('completed') ? currentEditRequestData.completedDate : null,
      };

      await updateDoc(doc(db, `requests`, requestId), dataToUpdate);

      setMessage(`Request ${requestId} updated successfully!`);
      setEditingRequestId(null);
      setCurrentEditRequestData(null);
    } catch (error) {
      console.error("Error updating request:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Error updating request: ${errorMessage}`);
    } finally {
      setUpdatingRequestId(null);
    }
  };
  // Handle request changes
  function handleRequestChange(type: 'added' | 'modified' | 'removed', request: Request) {
    switch (type) {
      case 'added':
        addNotification('added', `New request from ${request.requesterName} for ${request.requestedVehicle}`);
        break;
      case 'modified':
        addNotification('updated', `Request updated: ${request.requesterName} - ${request.requestedVehicle} (${request.status})`);
        break;
      // No need to notify for deletes
      // case 'removed':
      //   addNotification('deleted', `Request deleted: ${request.requesterName} - ${request.requestedVehicle}`);
      //   break;
    }
  };

  // ===== TRIP HANDLERS =====

  // Function to initiate trip editing
  const handleEditTrip = (trip: Trip) => {
    if (!isAdmin) return;
    setEditingTripId(trip.id);
    setCurrentEditTripData(trip);
  };

  // Function to delete a trip
  const handleDeleteTrip = async (trip: Trip) => {
    if (!isAdmin || !db) return;

    setUpdatingTripId(trip.id);
    try {
      await deleteDoc(doc(db, 'trips', trip.id));
      setMessage(`Trip ${trip.tripCode} deleted successfully!`);
    } catch (error) {
      console.error('Error deleting trip:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Error deleting trip: ${errorMessage}`);
    } finally {
      setUpdatingTripId(null);
    }
  };

  // Function to cancel trip editing
  const cancelTripEditing = () => {
    setEditingTripId(null);
    setCurrentEditTripData(null);
  };

  // Handle changes in trip editable fields
  const handleTripEditChange = (e: any) => {
    const { name, value } = e.target;
    setCurrentEditTripData(prevData => {
      if (!prevData) return null;
      const newData = { ...prevData };

      if (name === 'personnel') {
        // Split by comma and trim whitespace
        newData.personnel = value.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
      } else if (name === 'purpose') {
        // Split by comma and trim whitespace
        newData.purpose = value.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
      } else {
        (newData as any)[name] = value;
      }

      return newData;
    });
  };

  // Function to save edited trip
  const saveEditedTrip = async (tripId: string) => {
    if (!isAdmin || !db || !currentEditTripData) return;

    setUpdatingTripId(tripId);
    try {
      const dataToUpdate = {
        dateTime: currentEditTripData.dateTime,
        vehicleAssigned: currentEditTripData.vehicleAssigned,
        driverName: currentEditTripData.driverName || null,
        personnel: currentEditTripData.personnel,
        purpose: currentEditTripData.purpose,
        destination: currentEditTripData.destination,
        status: currentEditTripData.status
      };

      await updateDoc(doc(db, 'trips', tripId), dataToUpdate);
      setMessage(`Trip ${currentEditTripData.tripCode} updated successfully!`);
      setEditingTripId(null);
      setCurrentEditTripData(null);
    } catch (error) {
      console.error('Error updating trip:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Error updating trip: ${errorMessage}`);
    } finally {
      setUpdatingTripId(null);
    }
  };

  // Function to mark trip as fulfilled
  const handleMarkTripAsFulfilled = async (trip: Trip) => {
    if (!isAdmin || !db) return;

    setUpdatingTripId(trip.id);
    try {
      await updateDoc(doc(db, 'trips', trip.id), {
        status: 'Fulfilled'
      });
      setMessage(`Trip ${trip.tripCode} marked as fulfilled!`);
    } catch (error) {
      console.error('Error updating trip status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Error updating trip status: ${errorMessage}`);
    } finally {
      setUpdatingTripId(null);
    }
  };
  // Handle trip changes
  function handleTripChange(type: 'added' | 'modified' | 'removed', trip: Trip) {
    switch (type) {
      case 'added':
        addNotification('added', `New trip created: ${trip.tripCode}`, 'trip');
        break;
      case 'modified':
        addNotification('updated', `Trip updated: ${trip.tripCode}`, 'trip');
        break;
      // No need to notify for deletes
      // case 'removed':
      //   addNotification('deleted', `Request deleted: ${request.requesterName} - ${request.requestedVehicle}`);
      //   break;
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
    if (!requestToApprove || !db || !requestToApprove.id) {
      setMessage("No request to approve or Firebase not initialized.");
      return;
    }

    try {
      const batch = writeBatch(db);
      // Create a document reference for the request
      const requestRef = doc(db, 'requests', requestToApprove.id);

      if (isNewTrip) {
        // Update the request with approved status
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
          requestIds: [requestToApprove.id],
          status: 'Not Fulfilled'
        };
        const newTripRef = doc(collection(db, 'trips'));
        batch.set(newTripRef, newTrip);
        await batch.commit();

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
          await updateDoc(requestRef, {
            status: 'Approved',
            requestedDateTime: existingTrip.dateTime,
            requestedVehicle: existingTrip.vehicleAssigned,
            isDriverRequested: existingTrip.driverName ? 'Yes' : 'No',
            delegatedDriverName: existingTrip.driverName || null
          });
          const updatedRequestIds = [...existingTrip.requestIds, requestToApprove.id];

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

          // Merge destinations - append/merge instead of replacing
          let mergedDestination = existingTrip.destination || '';
          if (requestToApprove.destination && requestToApprove.destination.trim()) {
            if (mergedDestination && !mergedDestination.toLowerCase().includes(requestToApprove.destination.toLowerCase())) {
              mergedDestination = `${mergedDestination}; ${requestToApprove.destination}`;
            } else if (!mergedDestination) {
              mergedDestination = requestToApprove.destination;
            }
          }

          // Update the trip with new request data
          await updateDoc(doc(db, 'trips', existingTripDoc.id), {
            requestIds: updatedRequestIds,
            personnel: updatedPersonnel,
            purpose: updatedPurpose,
            // Keep the existing dateTime, vehicleAssigned, and driverName unless they're not set
            dateTime: existingTrip.dateTime || requestToApprove.requestedDateTime,
            vehicleAssigned: existingTrip.vehicleAssigned || requestToApprove.requestedVehicle,
            driverName: existingTrip.driverName || (requestToApprove.isDriverRequested === 'Yes' ? requestToApprove.delegatedDriverName || null : null),
            // Merge destinations instead of replacing
            destination: mergedDestination
          });
          setMessage(`Request approved and added to existing trip ${tripCode}! Destinations merged.`);
        } else {
          setMessage(`Error: Trip ${tripCode} not found!`);
          return;
        }
      }

      setRequestToApprove(null);
    } catch (error) {
      console.error("Error approving request:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Error approving request: ${errorMessage}`);
    }
  };

  // Show loader if user is not authenticated
  if (!user) {
    return <Loader darkMode={darkMode} />;
  }

  return (
    <div className={`min-h-screen p-2 sm:p-4 font-sans flex flex-col items-center ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-blue-100 to-purple-200 text-gray-900'}`}>
      <div className={`w-full max-w-[95%] sm:max-w-6xl shadow-xl rounded-xl p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
          <div className="flex-grow">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center sm:text-left">
              Service Vehicle Request
            </h1>
            {user && (
              <div className={`text-xs sm:text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Current User: <span className="font-mono break-all">{user.email}</span>
              </div>
            )}
          </div>
          <div className="relative flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {/* Login/Logout Button */}
            <button
              onClick={!isAdmin ? () => setShowLoginModal(true) : handleLogout}
              className={`flex-1 sm:flex-none px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ease-in-out ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} cursor-pointer`}
              title={!isAdmin ? "Sign In" : "Sign Out"}
            >
              {!isAdmin ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign In</span>
                  <span className="sm:hidden">Login</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Logout</span>
                </>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-1.5 sm:p-2 rounded-full transition-colors duration-200 ease-in-out ${darkMode ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'} cursor-pointer`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M3 12H2m8.007-4.243l.707-.707M15.293 15.293l.707.707M12 18a6 6 0 110-12 6 6 0 010 12zM4.243 4.243l-.707.707m11.314 11.314l.707.707M4.243 15.757l-.707-.707m11.314-11.314l.707-.707" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9 9 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(prev => !prev)}
              className={`relative p-1.5 sm:p-2 rounded-full transition-colors duration-200 ease-in-out ${darkMode ? 'bg-gray-700 text-blue-300 hover:bg-gray-600' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'} cursor-pointer`}
              title="Notifications"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0v1" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full min-w-[1.25rem] h-5">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className={`absolute right-0 mt-2 top-full w-64 sm:w-72 rounded-md shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} border border-gray-200 z-10`}>
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <div className={`block px-3 sm:px-4 py-2 text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Recent Activity</div>
                  {notifications.length === 0 ? (
                    <div className={`block px-3 sm:px-4 py-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No new notifications.</div>
                  ) : (
                    notifications.slice(0, 5).map(notif => (
                      <div key={notif.id} className={`block px-3 sm:px-4 py-2 text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'} last:border-b-0`}>
                        <span className="font-medium">{notif.type.toUpperCase()}: </span>
                        <span className="break-words">{notif.details}</span>
                        <span className={`block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{notif.timestamp}</span>
                      </div>
                    ))
                  )}
                  <div className="px-3 sm:px-4 py-2">
                    <button
                      onClick={() => setNotifications([])}
                      className="w-full text-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
          currentEditData={currentEditRequestData}
          updatingRequestId={updatingRequestId}
          handleEditChange={handleRequestEditChange}
          saveEditedRequest={saveEditedRequest}
          cancelEditing={cancelRequestEditing}
          handleUpdateClick={handleEditRequest}
          handleDeleteClick={handleDeleteRequest}
          handleExportClick={handleExportClick}
          handleApproveClick={handleApproveClick}
        />

        {/* Trips Table */}
        <TripsTable
          trips={trips}
          darkMode={darkMode}
          editingTripId={editingTripId}
          currentEditTripData={currentEditTripData}
          updatingTripId={updatingTripId}
          handleEditTrip={handleEditTrip}
          handleDeleteTrip={handleDeleteTrip}
          cancelTripEditing={cancelTripEditing}
          handleTripEditChange={handleTripEditChange}
          saveEditedTrip={saveEditedTrip}
          handleMarkTripAsFulfilled={handleMarkTripAsFulfilled}
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
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onSubmit={handleApproveSubmit}
        request={requestToApprove}
        existingTrips={trips}
      />
    </div>
  );
}
