import { useTheme } from '@heroui/use-theme';
import { useEffect } from 'react';
import SingleDevice from "./pages/Singledevice";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import IndexPage from "@/pages/index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import MainPage from "./pages/Main";
import ProfilePage from "./pages/Profile";
import { Logout } from "./pages/Logout";
import EditProfile from "./pages/EditProfile";
import OtherProfile from "./pages/OtherProfile";
import AgainstAi from "./pages/PlayerAgainstAi";
import SettingsLayout from "./pages/settings/SettingsLayout";
import PasswordSettingsPage from "./pages/settings/PasswordSettingsPage";
import ThemeSettingsPage from "./pages/settings/ThemeSettingsPage";
import PvP from "./pages/PlayerAgainstPlayer";
import { UserProvider } from "./contexts/UserContext";
import AboutPage from "./pages/about";
import NotFoundPage from "./pages/NotFound";

function App() {
    const { theme } = useTheme();
    useEffect(() => {
        // Set the dark class on the html tag when dark theme is enabled
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, [theme]);
    return (
        < UserProvider>
            <Routes>
                {/* Public Routes (No authentication needed) */}
                <Route element={<PublicRoute><Register /></PublicRoute>} path="/register" />
                <Route element={<PublicRoute><Login /></PublicRoute>} path="/login" />

                <Route element={<PublicRoute><MainPage /></PublicRoute>} path="/main" />
                <Route element={<PublicRoute><AboutPage /></PublicRoute>} path="/about" />

                {/* Protected Routes */}
                    <Route element={<ProtectedRoute><PvP /></ProtectedRoute>} path="/multiplayer" />
                    <Route element={<ProtectedRoute><IndexPage /></ProtectedRoute>} path="/" />
                    <Route element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} path="/myprofile" />
                    <Route element={<ProtectedRoute><OtherProfile /></ProtectedRoute>} path="/profile" />
                   
                    <Route element={<ProtectedRoute><Logout /></ProtectedRoute>} path="/logout" />
                    <Route element={<ProtectedRoute><SingleDevice /></ProtectedRoute>} path="/singledevice" />
                    <Route element={<ProtectedRoute><AgainstAi /></ProtectedRoute>} path="/playerAgainstAi" />
                    <Route element={<ProtectedRoute><EditProfile /></ProtectedRoute>} path="/editprofile" />
                    <Route
                      element={<ProtectedRoute><SettingsLayout /></ProtectedRoute>}
                      path="/settings"
                    >
                      <Route element={<Navigate replace to="password" />} index />
                      <Route element={<PasswordSettingsPage />} path="password" />
                      <Route element={<ThemeSettingsPage />} path="themes" />
                    </Route>
                    <Route element={<NotFoundPage />} path="*" />
            </Routes>
        </UserProvider>
    );
}

export default App;
