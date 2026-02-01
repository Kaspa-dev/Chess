import React, { createContext, useContext, useState, ReactNode } from 'react';
import axios from "axios";

type UserContextType = {
    avatarUrl: string;
    getAvatarUrl: () => void;
    resetAvatar: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [avatarUrl, setAvatarUrl] = useState<string>("");

    const fetchAvatar = async () => {
        try {
            const token = localStorage.getItem("JWT");
            const response = await axios.get<any | undefined>("http://localhost:8000/profiles/myavatar", {
                headers: {
                    Authorization: 'Bearer ' + token,
                }
            });
            if (response.data.avatar)
                setAvatarUrl(response.data.avatar);

            console.log("Avatar URL:", response.data.avatarUrl);
        } catch (error) {
            console.error("Failed to fetch avatar:", error);
        }
    };

    const resetAvatar = () => {
        setAvatarUrl("");
    }

    React.useEffect(() => {
        fetchAvatar();
    }, []);

    return (
        <UserContext.Provider value={{ avatarUrl, getAvatarUrl: fetchAvatar, resetAvatar: resetAvatar }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUserContext must be used within a UserProvider");
    }
    return context;
};