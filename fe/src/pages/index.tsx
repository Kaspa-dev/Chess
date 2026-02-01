import MainLayout from "@/layouts/main";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, PressEvent } from "@heroui/button";
import { useNavigate } from "react-router-dom";



interface ProfileResponse {
  message: string,
  profile?: any,
}


const UserProfile: React.FC = () => {
  const [nickname, setNickname] = useState<string | null>(null);
  const [showButton, setShowButton] = useState(false);
  const navigate = useNavigate();
  const buttonData = [
    { label: "Žaisti prieš AI", path: "/playeragainstai" },
    { label: "Žaisti viename įrenginyje", path: "/singledevice" },
    // čia pridėti online path
    { label: "Žaisti tinkle", path: "/multiplayer" }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 1000);
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("JWT");
      try {
        const response = await axios.get<ProfileResponse | undefined>("http://localhost:8000/profiles/myprofile", {
          headers: {
          Authorization: 'Bearer ' + token,
          }
      });
      const profileData = response?.data?.profile
      if (profileData) {
        setNickname(profileData.nickname);
    }
  } catch (error) {
    console.error("Error fetching profile data:", error);
  }
};

fetchUserProfile();
  }, []);
  
  return (
    <MainLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="text-black-500 text-4xl font-bold">
          Sveikas atvykęs,
        </div>
        <div className="opacity-0 animate-fade-in text-emerald-500 text-6xl font-bold"> 
          {nickname}
        </div>
        

<div className="w-full max-w-[800px] h-[200px] mx-auto border-none flex flex-row items-center justify-between gap-4">
  {buttonData.map(({ label, path }, index) => (
    <div key={index} className="w-1/3 flex justify-center">
      <Button
        size="lg"
        radius="lg"
        className="opacity-0 animate-fade-in w-[90%] h-[70px] font-semibold text-white shadow-lg bg-gradient-to-tr from-stone-700 to-green-500"
        style={{ animationDelay: '1000ms' }}
        onPress={() => navigate(path)}
      >
        {label}
      </Button>
    </div>
  ))}
</div>
      </section>
    </MainLayout>
  );
}
export default UserProfile;
