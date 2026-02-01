import PasswordInput from "@/components/PasswordInput";
import MainLayout from "@/layouts/main";
import { EyeFilledIcon, EyeSlashFilledIcon } from "@/static/PasswordEye";
import { validatePassword, validatePasswordLength, validatePasswordMatch } from "@/utils/login";
import { addToast, Button, Input, ToastProvider} from "@heroui/react";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {Image} from "@heroui/image";
import { useTheme } from "@heroui/use-theme";
import darkM from '@/static/darkMode.jpg';
import lightM from '@/static/lightMode.jpg';


const Settings: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs: string[] = ["Password", "Themes"];
    const [currentTab, setCurrentTab] = React.useState<string>(tabs[0]);

    React.useEffect(() => {
      let newTab: string = location.pathname.split("/")[2];
      console.log(newTab);

      const tabExists: boolean = tabs.some((tab) => tab.toLowerCase() === newTab);

      if (!newTab || !tabExists){
        navigate("/settings/password");
      }
      else setCurrentTab(newTab);
    }, [location]);

    const renderTab = () => {
      switch(currentTab) {
        case "password":
          return <PasswordChange/>;
        case "themes":
          return <ThemeChange/>;
        default:
          return <h6>404</h6>
      }
    }
    
    return (
      <MainLayout>
        <section className="flex flex-col">
          {/* Header */}
          <div className="max-w-full h-auto border-none flex flex-row items-center justify-start px-6 py-5">
            <h1 className="text-5xl font-bold">Settings</h1>
          </div>
  
          {/* Navigation Tabs */}
          <div className="flex flex-wrap space-x-6 border-b border-zinc-300 font-bold justify-start px-6 mb-10">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.toLowerCase();
              return (
                <div
                  key={tab}
                  onClick={() => navigate(`/settings/${tab.toLowerCase()}`)}
                  className={`relative pb-2 font-medium text-xl cursor-pointer ${
                    isActive ? "text-emerald-500" : "text-gray-400 hover:text-emerald-500"  
                  }`}
                >
                  {tab}
                  {isActive && (
                    <div className="absolute left-0 bottom-0 w-full h-[2px] bg-emerald-400"></div>
                  )}
                </div>
              );
            })}
          </div>
  
          {/* Content Section */}
          <div className="border-none w-full items-center justify-start px-6">
            {renderTab()}
          </div>
        </section>
      </MainLayout>
    );
};

export default Settings;
 
interface Response{
  message:string;
}

const PasswordChange: React.FC = () => {

  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const [currentPassword, setCurrentPassword] = React.useState<string>("");
  const [newPassword, setNewPassword] = React.useState<string>("");
  const [newPasswordConfirm, setNewPasswordConfirm] = React.useState<string>("");

  const createError = (title: string, color:"danger"|"success", description?: string) => {
    addToast({
      title:title,
      description:description,
      timeout:5000,
      shouldShowTimeoutProgress: true,
      color:color,
      variant:"solid",
      radius:"md"
    });
  };


  const handleSubmit = async (e: any) => {
    setIsLoading(true);

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      createError("All fields are required", "danger");
      setIsLoading(false);
      return;
    }
    const newPasswordLenght: boolean = validatePasswordLength(newPassword);
    if (!newPasswordLenght){
      createError("New password lenght is too long (exceeding 32 characters)", "danger")
      setIsLoading(false);
      return;
    }

    const newPasswordValid: boolean = validatePassword(newPassword)
    if(!newPasswordValid) {
      createError("New password is not secure enough", "danger", "A safe password should contain atleast 8 characters, including atleast one uppercase, lowercase letters, special character and a number");
      setIsLoading(false);
      return;
    }

    const newPasswordsMatch: boolean = validatePasswordMatch(newPassword,newPasswordConfirm);
    if(!newPasswordsMatch){
      createError("New password fields didn't match", "danger");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("JWT");
      const response = await axios.patch<Response>("http://localhost:8000/authentication/changepassword",
          {
            oldPassword:currentPassword,
            newPassword:newPassword,
          },
          {
            headers: {
              Authorization: 'Bearer ' + token,
            },
          }
      );

      createError("Success","success",response.data.message);
      setIsLoading(false);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");

    } catch (e: any) {
      createError("Error","danger",e.response.data.message || "An internal server error occured");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-row w-full items-start justify-start px-10">
      <div className="flex flex-col gap-y-5 items-center justify-center pb-5 w-full md:w-1/2 lg:w-1/3">
        <PasswordInput
          label="Current password"
          placeholder="Enter your current password"
          value={currentPassword}
          onValueChange={setCurrentPassword}
        />

        <PasswordInput
          label="New password"
          placeholder="Enter your new desired password"
          value={newPassword}
          onValueChange={setNewPassword}
        />

        <PasswordInput
          label="Confirm new password"
          placeholder="Confirm your new password"
          value={newPasswordConfirm}
          onValueChange={setNewPasswordConfirm}
        />

        <Button

          radius="lg"
          className="font-semibold text-white shadow-lg bg-gradient-to-tr from-stone-700 to-green-500 w-full md:w-1/2"
          isLoading={isLoading}
          disabled={isLoading}
          onPress={handleSubmit}
        >
          Change password
        </Button>

        <ToastProvider placement="bottom-center" toastOffset={60}/>
      </div>
    </div>
  );
}


const ThemeChange: React.FC = () => {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
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
      <div className="flex flex-wrap gap-x-5 items-center justify-center pb-5">
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
          {/* Hover text */}
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
          {/* Hover text */}
          <span className="absolute bottom-0 left-0 right-0 text-center text-white bg-black bg-opacity-50 px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Dark mode
          </span>
        </div>
      </div>
    </div>
  );
}