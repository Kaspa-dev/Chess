import MainLayout from "@/layouts/main";
import React, { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { useNavigate } from "react-router-dom";
import { getMyProfile } from "@/services/profileApi";


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
      try {
        const response = await getMyProfile();
        const profileData = response?.data?.profile;

        if (profileData) {
          setNickname(profileData.nickname);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    void fetchUserProfile();
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <MainLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="rounded-2xl bg-zinc-950/85 px-6 py-3 text-4xl font-extrabold text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-sm">
          Sveikas atvykęs,
        </div>
        <div className={`text-emerald-500 text-6xl font-bold transition-opacity duration-700 ${showButton ? "opacity-100" : "opacity-0"}`}> 
          {nickname}
        </div>
        

<div className="w-full max-w-[800px] h-[200px] mx-auto border-none flex flex-row items-center justify-between gap-4">
  {buttonData.map(({ label, path }, index) => (
    <div key={index} className="w-1/3 flex justify-center">
      <Button
        size="lg"
        radius="lg"
        className={`w-[90%] h-[70px] font-semibold text-white shadow-lg bg-gradient-to-tr from-stone-700 to-green-500 transition-all duration-700 ${showButton ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
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
