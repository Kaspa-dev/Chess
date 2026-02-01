import { EyeFilledIcon, EyeSlashFilledIcon } from "@/static/PasswordEye";
import { Input } from "@heroui/react";
import React from "react";

const PasswordInput: React.FC<{label: string; placeholder: string; value: string; className?: string; onValueChange: (value: string) => void;}> = 
    ({ label, placeholder, value, className, onValueChange }) => 
    {
    const [isVisible, setIsVisible] = React.useState(false);
    const toggleVisibility = () => setIsVisible(!isVisible);
  
    return (
      <Input
        label={label}
        placeholder={placeholder}
        className={className}
        type={isVisible ? "text" : "password"}
        size="md"
        variant="bordered"
        radius="md"
        labelPlacement="inside"
        value={value}
        onValueChange={onValueChange}
        endContent={
          <button
            aria-label="toggle password visibility"
            className="focus:outline-none"
            type="button"
            onClick={toggleVisibility}
          >
            {isVisible ? (
              <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
            ) : (
              <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
            )}
          </button>
        }
      />
    );
  };

  export default PasswordInput;