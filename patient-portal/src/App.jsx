import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import LogSymptom from './pages/LogSymptom';
import LogMood from './pages/LogMood';
import LogLifestyle from './pages/LogLifestyle';
import SignalHistory from './pages/SignalHistory';
import Appointments from './pages/Appointments';
import BookAppointment from './pages/BookAppointment';
import Prescriptions from './pages/Prescriptions';
import LabResults from './pages/LabResults';
import LifeLens from './pages/LifeLens';
import Timeline from './pages/Timeline';
import UploadDocument from './pages/UploadDocument';
import OCRConfirmation from './pages/OCRConfirmation';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import VoiceAssistant from './components/VoiceAssistant';

// Redirect authenticated users away from login
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page-container min-h-screen flex items-center justify-center">
        <div className="spinner" style={{ width: '2rem', height: '2rem' }}></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/log-symptom"
        element={
          <ProtectedRoute>
            <LogSymptom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/log-mood"
        element={
          <ProtectedRoute>
            <LogMood />
          </ProtectedRoute>
        }
      />
      <Route
        path="/log-lifestyle"
        element={
          <ProtectedRoute>
            <LogLifestyle />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <SignalHistory />
          </ProtectedRoute>
        }
      />

      {/* Appointment Routes */}
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <Appointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book-appointment"
        element={
          <ProtectedRoute>
            <BookAppointment />
          </ProtectedRoute>
        }
      />

      <Route
        path="/prescriptions"
        element={
          <ProtectedRoute>
            <Prescriptions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lab-results"
        element={
          <ProtectedRoute>
            <LabResults />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lifelens"
        element={
          <ProtectedRoute>
            <LifeLens />
          </ProtectedRoute>
        }
      />
      <Route
        path="/timeline"
        element={
          <ProtectedRoute>
            <Timeline />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload-document"
        element={
          <ProtectedRoute>
            <UploadDocument />
          </ProtectedRoute>
        }
      />
      <Route
        path="/verify-ocr/:documentId"
        element={
          <ProtectedRoute>
            <OCRConfirmation />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Placeholder for future pages
const ComingSoon = ({ title }) => (
  <div className="page-container min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
        {title}
      </h1>
      <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
        Coming soon in the next module
      </p>
      <a
        href="/dashboard"
        className="btn btn-primary mt-4 inline-block"
      >
        Back to Dashboard
      </a>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        {/* Global Voice Assistant - appears on all pages */}
        <VoiceAssistant />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
