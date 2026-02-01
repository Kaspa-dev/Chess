import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

type Props = { children: React.ReactNode };

const PublicRoute = ({ children }: Props) => {
    const token = localStorage.getItem("JWT");

    if (token) {
        console.log("Token exists, checking expiration...");
        try {
            const decoded: any = jwtDecode(token);
            const currentTime = Date.now() / 1000;

            if (decoded.exp > currentTime) {
                console.log("Token is valid, redirecting to main page...");
                return <Navigate to="/" replace />;
            }
        } catch (error) {
            console.error("Error decoding token:", error);
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

export default PublicRoute;