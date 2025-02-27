"use client";
import { useEffect, useRef, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { Draggable } from "@/app/components/DND/Draggable";
import { Droppable } from "@/app/components/DND/Droppable";
import { DroppableHex } from "@/app/components/DND/DroppableHex";
import { IoSend } from "react-icons/io5";
import Hex from "@/app/components/Hex2";
import { range } from "@/app/utils/Range";
import { Minion1, Minion2, Minion3 } from "@/app/components/minion";
import { useAppSelector } from "@/stores/hook";
import {
  selectGame,
  nextTurn,
  receiveBudget,
  setGridCellOwner,
} from "@/stores/slices/gameSlice";
import { Button_v5, Button_v6 } from "@/app/components/EButton";
import { useMotionValue, animate, motion } from "framer-motion";
import NumberFlow, { continuous } from "@number-flow/react";
import { useDispatch } from "react-redux";
import { TextFade } from "@/app/components/FadeUp";
import { Separator } from "@/app/components/Seperator";

export default function Home() {
  const cols = 8;
  const rows = 8;

  const game = useAppSelector(selectGame);
  const dispatch = useDispatch();

  const getAdjacentPos = ({
    row,
    col,
    dir,
  }: {
    row: number;
    col: number;
    dir: "up" | "down" | "upleft" | "upright" | "downleft" | "downright";
  }) => {
    switch (dir) {
      case "up":
        return { row: row - 1, col: col };
      case "down":
        return { row: row + 1, col: col };
      case "upleft":
        return { row: row + ((col + 1) % 2) - 1, col: col - 1 };
      case "upright":
        return { row: row + ((col + 1) % 2) - 1, col: col + 1 };
      case "downleft":
        return { row: row + ((col + 1) % 2), col: col - 1 };
      case "downright":
        return { row: row + ((col + 1) % 2), col: col + 1 };
      default:
        return { row: -1, col: -1 };
    }
  };

  const owner = ({ row, col }: { row: number; col: number }) => {
    if (row < 0 || row > 7 || col < 0 || col > 7) return 0;
    return game.grid[row][col];
  };

  const [gameState, setState] = useState<
    "spawning" | "buying" | "executing" | "other" | "first_spawning"
  >("first_spawning");

  const stateButton = () => {
    if (gameState === "spawning") {
      return "End Turn";
    } else if (gameState === "buying") {
      return "Skip";
    } else if (gameState === "first_spawning") {
      return "Spawn First Minion";
    } else {
      return "";
    }
  };

  const [onInfo, showInfo] = useState<number>(-1);

  const [minionList, setMinionList] = useState<number[][]>(
    range(0, 7).map((i) => range(0, 7).map((j) => -1))
  );

  const availableMinion = [Minion1, Minion2, Minion3];

  const generateBomb = () => {
    let grid = [];
    for (let i = 0; i < rows; i++) {
      let hex: boolean[] = [];
      for (let j = 0; j < cols; j++) {
        hex.push(Math.random() >= 0.85);
      }
      grid.push(hex);
    }
    return grid;
  };
  const [bomb, setBomb] = useState<boolean[][]>(generateBomb());

  useEffect(() => {
    dispatch(setGridCellOwner({ row: 7, col: 7, owner: 1 }));
    dispatch(setGridCellOwner({ row: 7, col: 6, owner: 1 }));
    dispatch(setGridCellOwner({ row: 7, col: 5, owner: 1 }));
    dispatch(setGridCellOwner({ row: 6, col: 7, owner: 1 }));
    dispatch(setGridCellOwner({ row: 6, col: 6, owner: 1 }));
  }, []);

  const generateHex = () => {
    let grid = [];
    for (let i = 0; i < rows; i++) {
      let hex: String[] = [];
      for (let j = 0; j < cols; j++) {
        hex.push("?");
      }
      grid.push(hex);
    }
    return grid;
  };

  const [hex, setHex] = useState<String[][]>(generateHex);
  const [changed, setChange] = useState(false);

  const clickCell = (row: number, col: number) => () => {
    console.log(row, col);
    const newHex = hex;
    row--;
    col--;
    newHex[row][col] = bomb[row][col]
      ? "X"
      : (() => {
          let count = 0;
          if (row > 0 && bomb[row - 1][col]) count++;
          if (row < rows - 1 && bomb[row + 1][col]) count++;
          if (col % 2 == 1) {
            if (row > 0 && col > 0 && bomb[row - 1][col - 1]) count++;
            if (col > 0 && bomb[row][col - 1]) count++;
            if (row > 0 && col < cols - 1 && bomb[row - 1][col + 1]) count++;
            if (col < cols - 1 && bomb[row][col + 1]) count++;
          } else {
            if (col > 0 && bomb[row][col - 1]) count++;
            if (col < cols - 1 && bomb[row][col + 1]) count++;
            if (row < rows - 1) {
              if (col > 0 && bomb[row + 1][col - 1]) count++;
              if (col < cols - 1 && bomb[row + 1][col + 1]) count++;
            }
          }
          return count.toString();
        })();
    setHex(newHex);
    setChange(!changed);
  };

  const getHeight = () => Math.sqrt(3) * (cols + 0.5) * 50;
  const getWidth = () => 1.5 * 50 * rows + 0.5 * 50;

  function handleDragEnd({ active, over }: { active: any; over: any }) {
    {
      active ? console.log(active.data.current["minion"], active.id) : "";
    }
    {
      over
        ? console.log(
            over.data.current["row"],
            over.data.current["col"],
            over.id
          )
        : "";
    }

    if (active && over) {
      const row = over.data.current["row"] - 1;
      const col = over.data.current["col"] - 1;
      if (game.grid[row][col] == 1) {
        const minion = active.data.current["minion"];
        const ls = minionList.map((r, i) =>
          r.map((e, j) => (i == row && j == col ? minion : e))
        );
        if (gameState === "first_spawning") {
          setState("spawning");
        } else {
          setState("buying");
        }
        setMinionList(ls);
      }
    }
  }

  const nextState = () => {
    if (gameState == "buying") {
      setState("spawning");
    } else if (gameState == "spawning") {
      dispatch(nextTurn()),
        dispatch(receiveBudget(game.settings["turn_budget"]));
      setState("buying");
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="h-screen w-full flex flex-col">
        <div className="static h-screen w-full flex flex-row bg-[#2a2a2a99] items-center my-auto">
          <div className="w-[15%] text-[#bbb] pt-5 bg-[#00000088] h-[100%] flex flex-col">
            <NumberFlow
              prefix="Turn: "
              value={game.turn}
              className="text-center text-[1.3rem]"
            ></NumberFlow>
          </div>
          <div
            style={{ minWidth: getWidth() }}
            className="flex justify-center w-full"
          >
            {/*           <Droppable id="droppable" className = "h-fit">
            {parent === "droppable" ? draggable : "Drop here"}
          </Droppable> */}
            <div
              style={{
                height: getHeight(),
                width: getWidth(),
                translate: -0.75 * 50,
              }}
            >
              {range(1, cols).map((col) =>
                range(1, rows).map((row) => (
                  <DroppableHex
                    border_up={
                      owner({ row: row - 1, col: col - 1 }) !=
                      owner(
                        getAdjacentPos({
                          row: row - 1,
                          col: col - 1,
                          dir: "up",
                        })
                      )
                    }
                    border_down={
                      owner({ row: row - 1, col: col - 1 }) !=
                      owner(
                        getAdjacentPos({
                          row: row - 1,
                          col: col - 1,
                          dir: "down",
                        })
                      )
                    }
                    border_downleft={
                      owner({ row: row - 1, col: col - 1 }) !=
                      owner(
                        getAdjacentPos({
                          row: row - 1,
                          col: col - 1,
                          dir: "downleft",
                        })
                      )
                    }
                    border_downright={
                      owner({ row: row - 1, col: col - 1 }) !=
                      owner(
                        getAdjacentPos({
                          row: row - 1,
                          col: col - 1,
                          dir: "downright",
                        })
                      )
                    }
                    border_upleft={
                      owner({ row: row - 1, col: col - 1 }) !=
                      owner(
                        getAdjacentPos({
                          row: row - 1,
                          col: col - 1,
                          dir: "upleft",
                        })
                      )
                    }
                    border_upright={
                      owner({ row: row - 1, col: col - 1 }) !=
                      owner(
                        getAdjacentPos({
                          row: row - 1,
                          col: col - 1,
                          dir: "upright",
                        })
                      )
                    }
                    x={(col - 1) * 100}
                    y={(row - 1) * 100 - (col % 2 ? 0 : 50)}
                    row={row}
                    col={col}
                    key={`h${row}${col}`}
                    clickFunc={clickCell(row, col)}
                    bomb={hex[row - 1][col - 1]}
                    id={`drop_hex${col},${row}`}
                    className="w-[100px] h-[87px] absolute"
                    style={{ transform: `translateX(100px)` }}
                    minion={
                      minionList[row - 1][col - 1] < 0
                        ? ""
                        : game.minions[minionList[row - 1][col - 1]].imageId({
                            col: "#e55451",
                            scale: 0.8,
                          })
                    }
                  />
                ))
              )}
            </div>
          </div>

          <div className="w-[100%] bg-[#00000033] h-[100%] flex flex-row">
            <motion.div
              key={`Minion Store`}
              className="w-[50%] pt-10 relative bg-[#00000022] px-5 h-[100%] items-center gap-5 flex flex-col"
            >
              <div
                style={{
                  pointerEvents: gameState === "spawning" || gameState === "first_spawning" ? "all" : "none",
                }}
                className="absolute w-full h-full px-5 items-center gap-5 flex flex-col"
              >
                <TextFade
                  isShow={gameState === "spawning" || gameState === "first_spawning"}
                  className="w-full flex-col flex gap-2"
                  direction="down"
                >
                  <div className="text-center text-[1.4rem] w-full h-[2rem]">
                    Minion Store
                  </div>
                  <Separator className="w-full" gradient={true} />
                  <div className="text-center w-full text-[1.1rem]">{`Price: ${game.settings["spawn_cost"]}`}</div>
                </TextFade>
                <TextFade
                  isShow={gameState === "spawning" || gameState === "first_spawning"}
                  direction="up"
                  childClass="w-full h-[15%] flex flex-row gap-5"
                  className="w-full h-full flex flex-col items-center gap-5"
                >
                  {game.minions.map((x, i) => (
                    <div
                      key={`minnion${i}`}
                      className="w-full h-full flex flex-row gap-5"
                    >
                      <div className="w-[6rem] bg-[#0003] rounded-md flex justify-center items-center h-full">
                        <Draggable
                          disabled={gameState !== "spawning" && gameState !== "first_spawning"}
                          minion={i}
                          id={`minnion_${i}`}
                        >
                          {x.imageId({ col: "#e55451", scale: 1 })}
                        </Draggable>
                      </div>
                      <div className="w-[60%] h-full flex flex-col">
                        <div className=" rounded-md h-fit text-[1.2rem] w-full">
                          {x.name}
                        </div>
                        <div className=" rounded-md h-fit text-[1.0rem] w-full">
                          Defense
                        </div>
                        <div className="bg-[#2f2e2e] rounded-md h-fit text-[1.1rem] w-full px-2">
                          {x.defense}
                        </div>
                        <Button_v6
                          onClick={() => {
                            showInfo(i);
                          }}
                          className="mt-2 rounded-md text-[1.1rem]"
                        >
                          Info
                        </Button_v6>
                      </div>
                    </div>
                  ))}
                </TextFade>
              </div>
              <div
                style={{
                  pointerEvents: gameState === "buying" ? "all" : "none",
                }}
                className="absolute w-full h-full px-5 items-center gap-5 flex flex-col"
              >
                <TextFade
                  isShow={gameState === "buying"}
                  direction="down"
                  className="w-full flex flex-col gap-2"
                >
                  <div className="text-center text-[1.4rem] w-full h-[2rem]">
                    Conquering Hex
                  </div>
                  <Separator className="w-full" gradient={true} />
                  <div className="text-center w-full text-[1.1rem]">{`Price: ${game.settings["hex_purchase_cost"]}`}</div>
                </TextFade>
              </div>
              {/* </>:""} */}
            </motion.div>
            <div className="w-full p-5 flex flex-col gap-2">
              {onInfo < 0 ? (
                ""
              ) : (
                <>
                  <Button_v6
                    onClick={() => showInfo(-1)}
                    className="absolute w-[5rem] top-4 right-5"
                  >
                    X
                  </Button_v6>
                  {/*                   <button
                    onClick={() => showInfo(-1)}
                    className="absolute bo top-4 right-5 bg-red-400 p-3 rounded-md px-5"
                  >
                    X
                  </button> */}
                  <div className="text-[1.5rem] text-center">Minion Detail</div>

                  {game.minions[onInfo].imageId({ col: "#e55451", scale: 1 })}
                  <div className="text-[2rem] text-center">
                    {game.minions[onInfo].name}
                  </div>
                  <div className="text-[1.2rem] text-center">{`Defense: ${game.minions[onInfo].defense}`}</div>
                  <textarea
                    style={{ resize: "none" }}
                    disabled={true}
                    value={game.minions[onInfo].script}
                    className="h-full text-[#fff] bg-[#52525299] rounded-md p-5 text-[1rem]"
                  ></textarea>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-5 text-[1.3rem] origin-bottom items-center px-5 pl-10 h-[10%] bg-[#0e0d0d]">
          <div className="w-[70%] flex flex-row gap-10 items-center">
            <div className="w-[20rem] items-center justify-start flex bg-[#1e1e1e] px-2 rounded-sm">
              <NumberFlow
                prefix={"budget: "}
                format={{ useGrouping: false }}
                transformTiming={{ duration: 750, easing: "ease-out " }}
                plugins={[continuous]}
                suffix={` / ${game.settings["max_budget"]}`}
                value={game.budget}
                className="text-[1.1rem] text-center"
              ></NumberFlow>
            </div>
            <div className="text-[1.1rem] text-center">Minion: 2/10</div>
            <div className="text-[1.1rem] text-center">Hex: 5/20</div>
          </div>
          <div className="flex h-full flex-row justify-end items-center w-full px-10">
            <Button_v5
              onClick={() => {
                nextState();
              }}
              disabled={gameState === "first_spawning"}
              Icon={stateButton()}
              className="w-[12rem] text-[1.1rem] py-6 px-10"
            >
              {stateButton()}
            </Button_v5>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
