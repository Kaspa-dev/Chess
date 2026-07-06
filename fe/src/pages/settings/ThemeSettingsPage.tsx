import darkM from "@/static/darkMode.jpg";
import lightM from "@/static/lightMode.jpg";
import { Image } from "@heroui/image";
import { useTheme } from "@heroui/use-theme";
import React, { useEffect } from "react";

const ThemeSettingsPage: React.FC = () => {
  const { setTheme } = useTheme();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [setTheme]);

  const handleLightClick = () => {
    setTheme("light");
    localStorage.setItem("theme", "light");
  };

  const handleDarkClick = () => {
    setTheme("dark");
    localStorage.setItem("theme", "dark");
  };

  return (
    <div className="flex flex-row w-full items-start justify-start px-10">
      <div className="flex flex-col gap-y-6 pb-5">
        <h2 className="text-2xl font-semibold">Theme Settings</h2>

        <div className="flex flex-wrap gap-x-5 items-center justify-center">
          <div className="relative group">
            <button
              onClick={handleLightClick}
              className="p-0 m-0 border-none bg-transparent flex items-center justify-center hover:scale-105 transition-transform duration-200"
            >
              <Image
                alt="Light Mode Picture"
                src={lightM}
                width={300}
              />
            </button>
            <span className="absolute bottom-0 left-0 right-0 text-center text-white bg-black bg-opacity-50 px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Light mode
            </span>
          </div>

          <div className="relative group">
            <button
              onClick={handleDarkClick}
              className="p-0 m-0 border-none bg-transparent flex items-center justify-center hover:scale-105 transition-transform duration-200"
            >
              <Image
                alt="Dark Mode Picture"
                src={darkM}
                width={300}
              />
            </button>
            <span className="absolute bottom-0 left-0 right-0 text-center text-white bg-black bg-opacity-50 px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Dark mode
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettingsPage;
