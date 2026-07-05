import { CountryDropdown } from "@/components/DropDownList";
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
import { editProfile } from "@/services/authApi";
import { getMyProfile, uploadAvatar } from "@/services/profileApi";

const EditProfile: React.FC = () => {
    const [nickname, setNickname] = React.useState<string>("");
    const [country, setCountry] = React.useState<string>("");
    const [input, setInput] = React.useState<string>("");
    const [, setIsLoading] = React.useState<boolean>(false);
    const [image, setImage] = React.useState<File | null>(null);
    const [avatar, setAvatar] = React.useState<string>("null");

    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await getMyProfile();

                if (response?.data?.profile) {
                    setNickname(response.data.profile.nickname);
                    setInput(response.data.profile.nickname);
                    const retrievedCountry = response.data.profile.country || "Unknown country";
                    setCountry(retrievedCountry);
                    setAvatar(response.data.profile.avatar);

                    try {
                        const countryResponse = await axios.get<any | undefined>(`https://restcountries.com/v3.1/name/${retrievedCountry}`);

                        if (!countryResponse.data) {
                            console.log("Ivyko klaida del veliavos gavimo: " + countryResponse);
                        }
                    }
                    catch (error: any) {
                        console.log(error.response?.data?.message);
                    }
                } else {
                    console.log("Ivyko klaida del profilio: " + response?.data?.message);
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };

        void fetchProfile();
    }, []);
    
    const handleSaveAndNavigate = async () => {
        console.log("Attempting to save profile...");
        console.log("Nickname (input):", input);
        console.log("Country (selected):", country);
      
        if (input || country || image) {
          setIsLoading(true);
          try {
            const updatedData: Record<string, unknown> = {};
            
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
      
              const avatarResponse = await uploadAvatar(formData);
      
              console.log("Avatar upload response:", avatarResponse.data);
            }
      
            const response = await editProfile(updatedData);
      
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
  <div className="w-full max-w-2xl mb-6 flex justify-center">
    <h1 className={title()}>Edit profile</h1>
  </div>

  <div className="w-full max-w-5xl flex flex-col lg:flex-row justify-between gap-6 text-black dark:text-white">
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

    <div className="hidden lg:block h-auto w-px bg-gradient-to-t from-zinc-200 dark:from-zinc-700 to-zinc-500 dark:to-black-900 mx-4" />

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
