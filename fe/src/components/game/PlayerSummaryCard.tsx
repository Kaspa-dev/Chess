import { Avatar } from "@heroui/avatar";

import { ProfileLogo } from "@/components/icons";

interface PlayerSummaryCardProps {
  label: string;
  nickname: string;
  avatar: string;
  rating?: number;
  country?: string;
  colorText?: string;
  align?: "left" | "right";
}

export function PlayerSummaryCard({
  label,
  nickname,
  avatar,
  rating,
  country,
  colorText,
  align = "left",
}: PlayerSummaryCardProps) {
  const details = (
    <div>
      <p className={`font-semibold ${align === "right" ? "text-right" : ""}`}>
        {label}: {nickname}
      </p>
      <div className={`flex gap-2 text-sm ${align === "right" ? "justify-end" : ""}`}>
        {rating !== undefined && <span>Rating: {rating}</span>}
        {country && <span>| {country}</span>}
      </div>
      {colorText && <p className={`text-sm ${align === "right" ? "text-right" : ""}`}>{colorText}</p>}
    </div>
  );

  const avatarNode = (
    <div className="w-12 h-12">
      {avatar === "null" ? (
        <ProfileLogo className="w-full h-full" />
      ) : (
        <Avatar className="w-full h-full" src={avatar} alt={`${label} Avatar`} showFallback isBordered />
      )}
    </div>
  );

  return (
    <div className="flex items-center gap-4">
      {align === "right" ? (
        <>
          {details}
          {avatarNode}
        </>
      ) : (
        <>
          {avatarNode}
          {details}
        </>
      )}
    </div>
  );
}
