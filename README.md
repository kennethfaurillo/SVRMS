# SVRMS - Service Vehicle Request Management System

A modern web application for managing service vehicle requests and trips, built with Preact, TypeScript, and Firebase.

## 🚀 Overview

SVRMS is a comprehensive vehicle request management system designed to streamline the process of requesting, approving, and tracking service vehicle usage. The application provides separate interfaces for regular users to submit requests and administrators to manage and approve trips.

## ✨ Features

### Core Functionality
- **Vehicle Request Submission**: Users can submit requests for specific vehicles with detailed information
- **Admin Request Management**: Administrators can view, edit, approve, and manage all requests
- **Trip Management**: Approved requests are converted into trips that can be tracked and managed
- **Real-time Notifications**: Audio notifications for new requests and trip updates
- **Data Export**: CSV export functionality for requests and trips
- **Dark/Light Theme**: Toggle between dark and light modes with persistent preferences

### User Management
- **Role-based Access Control**: Separate permissions for regular users and administrators
- **Firebase Authentication**: Secure authentication with email/password
- **Anonymous Access**: Guest users can view and submit requests

### Request Features
- **Comprehensive Form**: Capture requester details, vehicle preferences, dates, destinations, and purposes
- **Status Tracking**: Track requests through pending, approved, cancelled, and rescheduled states
- **Driver Assignment**: Option to request specific drivers or assign drivers to approved trips
- **Remarks System**: Add comments and track completion dates

### Trip Management
- **Trip Consolidation**: Combine multiple requests into single trips
- **Personnel Tracking**: Track all personnel assigned to trips
- **Status Management**: Mark trips as fulfilled or not fulfilled
- **Vehicle Assignment**: Assign specific vehicles and drivers to trips

## 🛠️ Technology Stack

- **Frontend**: Preact (React alternative)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: Wouter (client-side routing)
- **Backend**: Firebase Firestore (NoSQL database)
- **Authentication**: Firebase Auth
- **Build Tool**: Vite
- **Icons**: Lucide React

## 🔐 Authentication & Authorization

The application implements role-based access control:

- **Anonymous Users**: Can view and submit requests
- **Administrators**: Complete access including trip management, request approval, and data export

Admin privileges are managed through Firebase custom claims.

## 📱 User Interface

### Responsive Design
- Mobile-first approach with responsive breakpoints
- Sidebar navigation that adapts to screen size
- Touch-friendly interfaces for mobile devices

### Accessibility Features
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatible
- High contrast color schemes

### Dark Mode Support
- System-wide dark/light theme toggle
- Persistent theme preferences
- Automatic system theme detection

## 🔔 Notifications

The application includes a real-time notification system:
- Audio alerts for new requests and trip updates
- Visual notification badges
- Activity history with timestamps
- Configurable notification preferences

## 📊 Data Management

### Export Functionality
- CSV export for requests and trips
- Filtered data export options
- Batch operations for bulk management

### Data Validation
- Form validation with TypeScript
- Firebase security rules
- Input sanitization and validation


## 🗺️ Roadmap

Future enhancements planned:
- Advanced reporting and analytics
- SMS/Email notification system
- Advanced user role management
