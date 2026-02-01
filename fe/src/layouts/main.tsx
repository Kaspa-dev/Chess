import { Navbar } from "../components/navbar";
import SideBoardPattern2 from "../components/SideBoard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col overflow-hidden dark:bg-zinc-800">
      {/* Navbar stays on top */}
      <Navbar />

      {/* Main layout area with sidebars + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="hidden lg:block w-1/6 h-full">
          <SideBoardPattern2 position="left" />
        </div>

        {/* Main Content */}
        <main className="w-full lg:w-4/6 px-4 py-4 overflow-y-auto">
          {children}
        </main>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-1/6 h-full">
          <SideBoardPattern2 position="right" />
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-3 bg-gradient-to-r from-zinc-300 to-zinc-200 text-center font-semibold text-black
          dark:from-zinc-900 dark:to-zinc-800 dark:text-white
      ">
        Inkvizitoriai © 2025
      </footer>
    </div>
  );
}
