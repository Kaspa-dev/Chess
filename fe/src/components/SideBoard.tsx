import React from "react";

type SideBoardPatternProps = {
  position: "left" | "right";
};

const SideBoardPattern2: React.FC<SideBoardPatternProps> = ({ position }) => {
  const columns = 3;
  const squares = Array.from({ length: 66 });

  return (
    <div
  className={`h-full w-full grid grid-cols-3
    ${position === "left" ? "border-r" : "border-l"} border-stone-400 dark:border-zinc-800
    ${position === 'left' ? 'shadow-lg' : 'shadow-xl'} shadow-black`}
>
      {squares.map((_, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        const isBlack = (row + col) % 2 === 1;

        return (
          <div
            key={index}
            className={`w-full aspect-square
              ${isBlack ? "bg-stone-700 dark:bg-zinc-800" : "bg-zinc-100 dark:bg-zinc-900"}`}
          />
        );
      })}
    </div>
  );
};


export default SideBoardPattern2;