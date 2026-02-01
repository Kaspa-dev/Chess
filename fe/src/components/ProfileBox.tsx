import { Input } from "@heroui/react";
import React from "react";

const ProfileBox: React.FC<{label: string; value: string; className?: string; editable?: boolean; onValueChange?: (value: string) => void;}> = 
    ({ label, value, className, editable, onValueChange}) => 
    {
      return (
        <div className={`flex flex-col gap-1 ${className}`}>
          <label className="text-sm text-gray-500 mb-1">{label}</label>
          {editable ? (
            <Input
              className="w-full"
              size="lg"
              variant="bordered"
              radius="lg"
              labelPlacement="outside"
              
              value={value}
              onChange={(e) => onValueChange?.(e.target.value)}
            />
          ) : (
            <Input
              className="w-full"
              size="lg"
              variant="bordered"
              radius="lg"
              labelPlacement="outside"
              value={value}
              isDisabled
            />
          )}
        </div>
      );
    };
  export default ProfileBox;