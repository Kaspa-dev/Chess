import type { ReactNode } from "react";

import MainLayout from "@/layouts/main";

interface GameBoardShellProps {
  header?: ReactNode;
  resultBanner?: ReactNode;
  board: ReactNode;
  actions: ReactNode;
}

export function GameBoardShell({
  header,
  resultBanner,
  board,
  actions,
}: GameBoardShellProps) {
  return (
    <MainLayout>
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          {header}
          {resultBanner}
          <div className="w-[800px] border-5 border-zinc-400">{board}</div>
          {actions}
        </div>
      </div>
    </MainLayout>
  );
}
