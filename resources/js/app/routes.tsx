import { createBrowserRouter, Navigate } from "react-router";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";
import Appointments from "./pages/Appointments";
import Surgeries from "./pages/Surgeries";
import ClinicalHistory from "./pages/ClinicalHistory";
import Odontogram from "./pages/Odontogram";
import Budgets from "./pages/Budgets";
import Payments from "./pages/Payments";
import Inventory from "./pages/Inventory";
import Accounting from "./pages/Accounting";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Layout from "./components/Layout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import SuperAdminLayout from "../components/SuperAdminLayout";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import Clinics from "./pages/superadmin/Clinics";
import ClinicDetail from "./pages/superadmin/ClinicDetail";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },

  // ---- ERP Dental (dentist, staff) ----
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "patients", Component: Patients },
          { path: "patients/:id", Component: PatientProfile },
          { path: "appointments", Component: Appointments },
          { path: "surgeries", Component: Surgeries },
          { path: "clinical-history", Component: ClinicalHistory },
          { path: "odontogram", Component: Odontogram },
          { path: "budgets", Component: Budgets },
          { path: "payments", Component: Payments },
          { path: "inventory", Component: Inventory },
          { path: "accounting", Component: Accounting },
          { path: "reports", Component: Reports },
          { path: "settings", Component: Settings },
        ],
      },
    ],
  },

  // ---- Panel SuperAdmin ----
  {
    path: "/superadmin",
    Component: () => <ProtectedRoute allowedRole="superadmin" redirectTo="/login" />,
    children: [
      {
        Component: SuperAdminLayout,
        children: [
          { index: true, Component: SuperAdminDashboard },
          { path: "clinics", Component: Clinics },
          { path: "clinics/:id", Component: ClinicDetail },
        ],
      },
    ],
  },

  // Ruta catch-all
  { path: "*", Component: () => <Navigate to="/" replace /> },
]);
