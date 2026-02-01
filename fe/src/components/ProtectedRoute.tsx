import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

type Props = { children: React.ReactNode };

const ProtectedRoute = ({ children }: Props) => {
  const location = useLocation();
  const token = localStorage.getItem("JWT");

  // Check if there's a token
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    // Decode the token and extract the expiration time
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Get current time in seconds (Unix timestamp)
    
    // Check if the token is expired
    if (decoded.exp < currentTime) {
      // Token is expired, redirect to login
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  } catch (error) {
    // If decoding the token fails, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If token is valid and not expired, render the protected children
  return <>{children}</>;
};

export default ProtectedRoute;