import type { ReactNode } from "react";

import MainLayout from "@/layouts/main";

interface GameBoardShellProps {
  header?: ReactNode;
  resultBanner?: ReactNode;
  board: ReactNode;
  sidebar?: ReactNode;
  actions: ReactNode;
}

export function GameBoardShell({
  header,
  resultBanner,
  board,
  sidebar,
  actions,
}: GameBoardShellProps) {
  return (
    <MainLayout>
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-[1240px] flex-col items-center gap-6">
          {header}
          {resultBanner}
          <div className="flex w-full flex-wrap items-start justify-center gap-6">
            <div className="flex w-full max-w-[800px] flex-col items-center">
              <div className="w-full max-w-[800px] border-5 border-zinc-400">{board}</div>
              {actions}
            </div>
            {sidebar}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
