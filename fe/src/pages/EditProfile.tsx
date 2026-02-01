import {CountryDropdown, Country} from "@/components/DropDownList";
import { Button } from "@heroui/button";
import React from "react";
import axios from "axios";
import { title } from "@/components/primitives";
import { ProfileLogo } from "@/components/icons";
import MainLayout from "@/layouts/main";
import "../styles/globals.css";
import { useNavigate } from "react-router-dom";
import ProfileBox from "@/components/ProfileBox";
import { Avatar } from "@heroui/avatar";
import { Input } from "@heroui/input";

interface ProfileResponse {
    message: string,
    profile?: any,
}

const EditProfile: React.FC = () => {
    const [nickname, setNickname] = React.useState<string>("");
    const [country, setCountry] = React.useState<string>("");
    const [flag, setFlag] = React.useState<string>("");
    const [input, setInput] = React.useState<string>("");
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [image, setImage] = React.useState<File | null>(null);
    const [avatar, setAvatar] = React.useState<string>("null");

    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem("JWT");
            try {
                const response = await axios.get<ProfileResponse | undefined>("http://localhost:8000/profiles/myprofile", {
                    headers: {
                        Authorization: 'Bearer ' + token,
                    }
                });

                if (response?.data?.profile) {
                    setNickname(response.data.profile.nickname);
                    setInput(response.data.profile.nickname); // <-- pridėk šitą eilutę
                    const retrievedCountry = response.data.profile.country || "Unknown country";
                    setCountry(retrievedCountry);
                    setAvatar(response.data.profile.avatar);

                    try {
                        const countryResponse = await axios.get<any | undefined>(`https://restcountries.com/v3.1/name/${retrievedCountry}`);

                        console.log(countryResponse);

                        if (response.data) {
                            const code = countryResponse.data[0].cca2.toUpperCase();
                            setFlag(`https://flagsapi.com/${code}/shiny/48.png`);
                        } else {
                            console.log("Ivyko klaida dėl vėliavos gavimo: " + countryResponse);
                        }
                    }
                    catch (error: any) {
                        console.log(error.response?.data?.message);
                    }
                } else {
                    console.log("Ivyko klaida dėl profilio: " + response?.data?.message);
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };

        fetchProfile();
    }, []);
    
    const handleSaveAndNavigate = async () => {
        console.log("Attempting to save profile...");
        console.log("Nickname (input):", input);
        console.log("Country (selected):", country);
      
        if (input || country || image) {
          setIsLoading(true);
          try {
            const token = localStorage.getItem("JWT");
            const updatedData: any = {};
            

            if (input) {
              if (input.length < 3) {
                alert("Nickname is too short (must be >= 3)");
                setIsLoading(false);
                return;
              } else if (input.length > 30) {
                alert("Nickname is too long (must be <=30)");
                setIsLoading(false);
                  return;
              } else {
                updatedData.newUserName = input;
              }
            }

            if (country) updatedData.newCountry = country;
      
            if (image) {
              const formData = new FormData();
              formData.append("image", image);
      
              const avatarResponse = await axios.patch("http://localhost:8000/profiles/uploadavatar", formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  Authorization: 'Bearer ' + token,
                },
              });
      
              console.log("Avatar upload response:", avatarResponse.data);
            }
      
            const response = await axios.patch(
              "http://localhost:8000/authentication/editprofile",
              updatedData,
              {
                headers: {
                  Authorization: 'Bearer ' + token,
                },
              }
            );
      
            console.log(response.data);
            navigate("/myprofile");
            alert("Profile updated successfully!");
      
          } catch (error: any) {
            console.error("Error updating profile:", error);
            alert("Error updating profile. Please try again.");
          } finally {
            setIsLoading(false);
          }
        } else {
          alert("Please enter a valid username, country or image.");
        }
      };

    return (
<MainLayout>
    <section className="flex flex-col items-center justify-center px-4 py-6 w-full">
  {/* Title */}
  <div className="w-full max-w-2xl mb-6 flex justify-center">
    <h1 className={title()}>Edit profile</h1>
  </div>

  {/* Main content area */}
  <div className="w-full max-w-5xl flex flex-col lg:flex-row justify-between gap-6 text-black dark:text-white">
    {/* Left side: profile input area */}
    <div className="flex-1 flex flex-col gap-4">
      <ProfileBox label="NICKNAME" value={nickname}  />
      <ProfileBox
        label="NEW NICKNAME"
        value={input}
        editable
        onValueChange={setInput}
      />
      <CountryDropdown setCountry={setCountry} />
    </div>

    {/* Divider (hidden on small screens) */}
    <div className="hidden lg:block h-auto w-px bg-gradient-to-t from-zinc-200 dark:from-zinc-700 to-zinc-500 dark:to-black-900 mx-4" />

    {/* Right side: avatar preview */}
    <div className="flex-1 flex justify-start items-start ml-4 mt-8">
      <div className="rounded-lg border-2 w-52 h-52">
        {avatar === "null" ? (
          <ProfileLogo className="w-full h-full" />
        ) : (
          <Avatar
            className="w-full h-full rounded-none"
            src={avatar}
            alt="Avatar"
            showFallback
            isBordered
          />
        )}
      </div>
    </div>
  </div>

  {/* Button section */}
  <div className="mt-8 w-full max-w-3xl flex flex-wrap justify-center gap-4">
    <Button
      size="lg"
      radius="lg"
      className="font-semibold text-white shadow-lg bg-gradient-to-tr from-stone-700 to-green-500"
      onPress={handleSaveAndNavigate}
    >
      Save
    </Button>

    <Button
      size="lg"
      radius="lg"
      className="font-semibold text-white shadow-lg bg-gradient-to-tr from-stone-700 to-green-500"
      onPress={() => navigate("/myprofile")}
    >
      Cancel
    </Button>

    <Button
      size="lg"
      radius="lg"
      className="font-semibold text-white shadow-lg bg-gradient-to-tr from-stone-700 to-green-500"
      onPress={() => document.getElementById("fileInput")?.click()}
    >
      Upload Picture
    </Button>

    <input
      id="fileInput"
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        if (e.target.files && e.target.files[0]) {
          setImage(e.target.files[0]);
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              setAvatar(reader.result as string);
            }
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      }}
    />
  </div>
</section>
</MainLayout>
    );

}

export default EditProfile;