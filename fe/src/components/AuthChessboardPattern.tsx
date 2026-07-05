import React from "react";

const AuthChessboardPattern: React.FC = () => {
  const squares = Array.from({ length: 64 });

  return (
    <div className="absolute top-0 left-0 grid h-full grid-cols-8 grid-rows-8">
      {squares.map((_, index) => {
        const isBlack = (Math.floor(index / 8) + index) % 2 === 1;

        return (
          <div
            key={index}
            className={`aspect-square ${isBlack ? "bg-stone-700 dark:bg-zinc-800" : "bg-zinc-100 dark:bg-zinc-900"}`}
          />
        );
      })}
    </div>
  );
};

export default AuthChessboardPattern;
