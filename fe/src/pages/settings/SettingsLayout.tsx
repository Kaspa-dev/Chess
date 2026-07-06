import MainLayout from "@/layouts/main";
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { label: "Password", href: "/settings/password" },
  { label: "Themes", href: "/settings/themes" },
];

const SettingsLayout: React.FC = () => {
  return (
    <MainLayout>
      <section className="flex flex-col">
        <div className="max-w-full h-auto border-none flex flex-row items-center justify-start px-6 py-5">
          <h1 className="text-5xl font-bold">Settings</h1>
        </div>

        <div className="flex flex-wrap space-x-6 border-b border-zinc-300 font-bold justify-start px-6 mb-10">
          {tabs.map((tab) => (
            <NavLink
              key={tab.href}
              to={tab.href}
              className={({ isActive }) =>
                `relative pb-2 font-medium text-xl cursor-pointer ${
                  isActive ? "text-emerald-500" : "text-gray-400 hover:text-emerald-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {tab.label}
                  {isActive && (
                    <div className="absolute left-0 bottom-0 w-full h-[2px] bg-emerald-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="border-none w-full items-center justify-start px-6">
          <Outlet />
        </div>
      </section>
    </MainLayout>
  );
};

export default SettingsLayout;
