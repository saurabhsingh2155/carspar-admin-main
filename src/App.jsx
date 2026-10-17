import { lazy, Suspense, useState } from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import LoadingOverlay from "./components/LoadingOverlay";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./pages/LoginPage";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const BannersPage = lazy(() => import("./pages/BannersPage"));
const CarsPage = lazy(() => import("./pages/CarsPage"));
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const CitiesPage = lazy(() => import("./pages/CitiesPage"));
const StatesPage = lazy(() => import("./pages/StatesPage"));
const FaqsPage = lazy(() => import("./pages/FaqsPage"));
const VideosPage = lazy(() => import("./pages/VideosPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const AboutAppPage = lazy(() => import("./pages/AboutAppPage"));
const TermsConditionsPage = lazy(() => import("./pages/TermsConditionsPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const AffiliatesPage = lazy(() => import("./pages/AffiliatesPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const ReelsPage = lazy(() => import("./pages/ReelsPage"));
const AdminManagementPage = lazy(() => import("./pages/AdminManagementPage"));

function AdminLayout() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: "#2563eb",
          borderRadius: 10,
          fontFamily: '"Poppins", sans-serif',
        },
      }}
    >
      <div className="min-h-screen bg-secondary text-primary">
        <Sidebar />
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="lg:ml-53.25 p-3 sm:p-5">
          <Suspense fallback={<LoadingOverlay />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/banner" element={<BannersPage />} />
          <Route path="/car" element={<CarsPage />} />
          <Route path="/brands" element={<CatalogPage />} />
          <Route path="/city" element={<CitiesPage />} />
          <Route path="/state" element={<StatesPage />} />
          <Route path="/faqs" element={<FaqsPage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/user" element={<UsersPage />} />
          <Route path="/about-app" element={<AboutAppPage />} />
          <Route path="/terms-condition" element={<TermsConditionsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/setting" element={<SettingsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/affiliates" element={<AffiliatesPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/reels" element={<ReelsPage />} />
          <Route path="/admins" element={<AdminManagementPage />} />
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
