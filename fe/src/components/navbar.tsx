import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
  } from "@heroui/dropdown";

import { useState } from "react";
import { Link } from "@heroui/link";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";

import { siteConfig } from "../config/chessSite";
import { ChessLogo,
         ProfileLogo
 } from "../components/icons";
 import { useUserContext } from "@/contexts/UserContext";
 import { Avatar } from "@heroui/avatar";

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { avatarUrl } = useUserContext();

  return (
    <HeroUINavbar maxWidth="xl" position="sticky" >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand className="gap-3 max-w-fit">
          <Link
            className="flex items-center justify-start gap-1"
            color="foreground"
            href="/"
          >
            <ChessLogo />
            <span className="text-4xl font-bold text-emerald-500">Chess</span>
          </Link>
        </NavbarBrand>
        <div className="justify-start hidden gap-4 ml-2 lg:flex">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <Link
                className={clsx(
                  linkStyles({ color: "foreground" }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium"
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </div>
      </NavbarContent>  
      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
        >
            <NavbarItem className="hidden md:flex">
            <Dropdown  
            placement="bottom-end" 
            isOpen={isOpen} 
            onOpenChange={setIsOpen}>
                <DropdownTrigger asChiled>
                <div
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                >
                    {avatarUrl || avatarUrl == "null"?
                        <Avatar
                            className="w-10 h-10"
                            src={avatarUrl}
                            showFallback
                            isBordered
                        /> :
                        <ProfileLogo className="w-10 h-10"/> }
                </div>
                </DropdownTrigger>
                <DropdownMenu 
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                aria-label="Link Actions">
                <DropdownItem key="myprofile" href="/myprofile">
                    My profile
                 </DropdownItem>
                <DropdownItem key="about" href="/settings">
                    Settings
                </DropdownItem>
                <DropdownItem key="logout" href="/logout">
                    Logout
                </DropdownItem>
                </DropdownMenu>
            </Dropdown>
            </NavbarItem>          
        </NavbarContent>
    </HeroUINavbar>
  );
};
