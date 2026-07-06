import PasswordInput from "@/components/PasswordInput";
import { changePassword } from "@/services/authApi";
import {
  addToast,
  Button,
  ToastProvider,
} from "@heroui/react";
import React from "react";
import {
  validatePassword,
  validatePasswordLength,
  validatePasswordMatch,
} from "@/utils/login";

const PasswordSettingsPage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = React.useState<string>("");
  const [newPassword, setNewPassword] = React.useState<string>("");
  const [newPasswordConfirm, setNewPasswordConfirm] = React.useState<string>("");

  const createError = (
    title: string,
    color: "danger" | "success",
    description?: string,
  ) => {
    addToast({
      title,
      description,
      timeout: 5000,
      shouldShowTimeoutProgress: true,
      color,
      variant: "solid",
      radius: "md",
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      createError("All fields are required", "danger");
      setIsLoading(false);
      return;
    }

    const newPasswordLenght: boolean = validatePasswordLength(newPassword);
    if (!newPasswordLenght) {
      createError(
        "New password lenght is too long (exceeding 32 characters)",
        "danger",
      );
      setIsLoading(false);
      return;
    }

    const newPasswordValid: boolean = validatePassword(newPassword);
    if (!newPasswordValid) {
      createError(
        "New password is not secure enough",
        "danger",
        "A safe password should contain atleast 8 characters, including atleast one uppercase, lowercase letters, special character and a number",
      );
      setIsLoading(false);
      return;
    }

    const newPasswordsMatch: boolean = validatePasswordMatch(
      newPassword,
      newPasswordConfirm,
    );
    if (!newPasswordsMatch) {
      createError("New password fields didn't match", "danger");
      setIsLoading(false);
      return;
    }

    try {
      const response = await changePassword({
        oldPassword: currentPassword,
        newPassword,
      });

      createError("Success", "success", response.data.message);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (e: any) {
      createError(
        "Error",
        "danger",
        e.response.data.message || "An internal server error occured",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-row w-full items-start justify-start px-10">
      <div className="flex flex-col gap-y-5 items-center justify-center pb-5 w-full md:w-1/2 lg:w-1/3">
        <h2 className="w-full text-2xl font-semibold">Password Settings</h2>

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

        <ToastProvider placement="bottom-center" toastOffset={60} />
      </div>
    </div>
  );
};

export default PasswordSettingsPage;
