"use client";
import ControlledTextArea from "@/app/components/ControllTextarea";
import { Minion1, Minion2, Minion3 } from "@/app/components/minion";
import Prev from "@/app/components/Prev";
import { useWebSocket } from "@/hooks/useWebsocket";
import { useAppSelector } from "@/stores/hook";
import {
  selectGame,
  addMinionToGame,
  receiveBudget,
} from "@/stores/slices/gameSlice";
import {
  selectRoom,
  selectRoomMinion,
  setMinions,
} from "@/stores/slices/roomSlice";
import { selectUser } from "@/stores/slices/userSlice";
import { selectWebsocket } from "@/stores/slices/webSocketSlice";
import { Minion } from "@/types/minion";
import { Message, StompSubscription } from "@stomp/stompjs";
import { index } from "d3";
import { i } from "framer-motion/client";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import InputField from "@/app/components/InputFix";
import { useCaretPosition } from "react-use-caret-position";

interface MinionSelectItem {
  minionTypeName: string;
  defenseFactor: number;
  script: string;
  image: number;
}

const Create = () => {
  const dispatch = useDispatch();
  const game = useAppSelector(selectGame);
  const { subscribe, sendMessage, unsubscribe } = useWebSocket();

  const [minionList, setMinionList] = useState<MinionSelectItem[]>([
    { minionTypeName: "", defenseFactor: 0, script: "", image: 0 },
  ]);

  const [roomSubscription, setRoomSubscription] = useState<StompSubscription>();

  useEffect(() => {
    setRoomSubscription(roomSubscription);
    return () => {
      if (roomSubscription) {
        unsubscribe(roomSubscription);
      }
    };
  }, [roomSubscription]);

  const minionImage = [Minion1, Minion2, Minion3];
  const user = useAppSelector(selectUser);
  const room = useAppSelector(selectRoom);
  const roomMinions = useAppSelector(selectRoomMinion);

  const addMinion = () => {
    saveMinion(currentType);
    setMinionList([
      ...minionList,
      {
        minionTypeName: "",
        defenseFactor: 0,
        script: "",
        image: 0,
      },
    ]);
    setCurrentType(minionList.length);
  };

  const onMinionUpdate = (payload: Message) => {
    const command = payload.headers["command"];
    if (command === "update" || command === "get") {
      const data = JSON.parse(payload.body);
      console.log(data);
      dispatch(setMinions(data));
    }
  };

  useEffect(() => {
    let data = setTimeout(() => {
      const roomSub = subscribe(
        `/topic/room-minions-${room?.id}`,
        onMinionUpdate
      );
      setRoomSubscription(roomSub);
      sendMessage("/room/minion/get", { roomId: room.id });
    }, 0);
    return () => clearTimeout(data);
  }, []);

  useEffect(() => {
    let data = setTimeout(() => {
      loadMinion(currentType);
    }, 100);
    return () => clearTimeout(data);
  }, [roomMinions.minions]);

  /*   useEffect(()=>{
      loadMinion(currentType)
  },[minionList]) */

  const addMinionButtonStyle = () =>
    `w-[6rem] h-[6rem] border-[#8DB177] border-2 text-[#8DB177] rounded-md ${
      roomMinions.minions.length >= 5 ? "invisible" : "visible"
    }`;

  const removeMinionButtonStyle = () =>
    `w-full bg-[#d65959] h-[5%] ${
      roomMinions.minions.length <= 1 ? "invisible" : "visible"
    }`;

  const [strategy, setStrategy] = useState("");
  const [typeName, setTypeName] = useState("");
  const [defense, setDefense] = useState(0);

  const router = useRouter();
  const [currentType, setCurrentType] = useState(0);

  const removeMinion = () => {
    console.log(minionList);
    const indexToRemove = currentType;
    console.log(minionList.length);
    setMinionList((minionList) =>
      minionList.filter((m, i) => i !== indexToRemove)
    );
    console.log(minionList.length);
    if (indexToRemove === minionList.length - 1) {
      setCurrentType(minionList.length - 2);
    } else {
      setCurrentType(indexToRemove);
    }
  };

  const loadMinion = (index: number) => {
    if (index - 1 > roomMinions.minions.length) {
      return;
    }
    
    setCurrentType(index);
    const m = roomMinions.minions[index];
    console.log(roomMinions);

    setStrategy(m.script);
    
    setTypeName(m.name);
    setDefense(m.defense);
    setMinionImage(index, m.imageId);
  };

  const selectMinion = (index: number) => {
    /* saveMinion(currentType); */
    loadMinion(index);
  };

  const saveMinion = (index: number) => {
    minionList[index].script = strategy;
    minionList[index].defenseFactor = defense;
    minionList[index].minionTypeName = typeName;
  };

  const setMinionImage = (index: number, imageId: number) => {
    /* saveMinion(index); */
    const ls = minionList.map((m, i) => {
      if (i != index) return m;
      const nm: MinionSelectItem = { ...m };
      nm.image = imageId;
      if (nm.image > 2) nm.image = 0;
      if (nm.image < 0) nm.image = 2;
      return nm;
    });
    setMinionList(ls);
  };

  const loadPreset = () => {
    console.log("Load Preset");
    sendMessage(`/room/minion/preset`, { roomId: room.id, index: currentType });
  };

  const nextButtonHandle = () => {
    /* saveMinion(currentType); */
    minionList.map((m) => {
      dispatch(
        addMinionToGame({
          name: m.minionTypeName,
          imageId: minionImage[m.image],
          defense: m.defenseFactor,
          script: m.script,
        })
      );
    });
    dispatch(receiveBudget(game.settings["init_budget"]));
    router.push("/pages/Hexsweeper");
  };

  const changeMinionName = (e: ChangeEvent<HTMLInputElement>) => {
    sendMessage(`/room/minion/name`, {
      roomId: room.id,
      minionName: e.target.value,
      index: currentType,
    });
  };

  const changeMinionDefense = (e: ChangeEvent<HTMLInputElement>) => {
    console.log("Send Defense");
    sendMessage(`/room/minion/defense`, {
      roomId: room.id,
      defense: e.target.valueAsNumber,
      index: currentType,
    });
  };

  const changeMinionImage = (change: number) => () => {
    console.log("Send Images");
    sendMessage(`/room/minion/image`, {
      roomId: room.id,
      imageId: roomMinions.minions[currentType].imageId + change,
      index: currentType,
    });
  };

  const onAddMinion = () => {
    console.log("Add Minion");
    sendMessage(`/room/minion/add`, { roomId: room.id });
  };

  const changeMinionScript = (e: ChangeEvent<HTMLTextAreaElement>) => {
    console.log("Send Script");
    sendMessage(`/room/minion/script`, {
      roomId: room.id,
      script: e.target.value,
      index: currentType,
    });
  };

  return (
    <div className="text-[1.3rem] flex flex-col h-screen px-10 gap-0">
      <div className="flex flex-row h-[85%] gap-0">
        <div className=" flex flex-col w-[8rem] p-5 gap-5 items-center bg-[#2a2a2a99] m-3 rounded-md">
          {roomMinions.minions.map((x: Minion, index) => (
            <button
              key={`minion-${index}`}
              onClick={() => selectMinion(index)}
              className="w-[6rem] h-[6rem] bg-[#8DB177] rounded-md"
            >
              {index + 1}
            </button>
          ))}
          <button onClick={onAddMinion} className={addMinionButtonStyle()}>
            +
          </button>
        </div>
        <div className="flex flex-col w-[25%] bg-[#2a2a2a99] m-3 rounded-md gap-3 p-5">
          <div className="text-center">{currentType + 1}</div>
          <div className="h-[70%] w-full bg-[#52525299] rounded-md justify-center flex p-5">
            {roomMinions.minions[currentType] &&
              (roomMinions.minions[currentType].imageId == 0 ? (
                <Minion1 col="#8DB177" scale={1} />
              ) : roomMinions.minions[currentType].imageId == 1 ? (
                <Minion2 scale={1} col="#8DB177" />
              ) : (
                <Minion3 scale={1} col="#8DB177" />
              ))}
          </div>
          <div className="flex h-[5%] flex-row w-full gap-2">
            <button
              onClick={changeMinionImage(-1)}
              className="bg-[#52525299] h-full w-full"
            >
              {" "}
              {"<<"}{" "}
            </button>
            <button
              onClick={changeMinionImage(1)}
              className="bg-[#52525299] h-full w-full"
            >
              {" "}
              {">>"}
            </button>
          </div>
          <input
            value={typeName}
            onChange={changeMinionName}
            style={{ resize: "none" }}
            placeholder="Minion Type Name"
            className="w-full h-[5%] text-[#fff] bg-[#52525299] rounded-md px-5"
          ></input>
          <input
            value={defense}
            onChange={changeMinionDefense}
            type="number"
            min={0}
            max={10 ** 9}
            style={{ resize: "none" }}
            placeholder="Minion Defense"
            className="w-full h-[5%] text-[#fff] bg-[#52525299] rounded-md px-5"
          ></input>
          <button
            onClick={() => removeMinion()}
            className={removeMinionButtonStyle()}
          >
            Delete
          </button>
        </div>
        <div className="flex flex-col w-full bg-[#2a2a2a99] m-3 rounded-md p-5 gap-2">
          <textarea
            value={strategy}
            onFocus={() => console.log("Focus")}
            onBlur={() => console.log("Unfocus")}
            onChange={changeMinionScript}
            style={{ resize: "none" }}
            autoFocus={true}
            placeholder="Minion Strategy Script"
            className="h-full text-[#fff] bg-[#52525299] rounded-md p-5 text-[1rem]"
          />
          <div className="flex flex-row justify-end gap-10">
            <button onClick={loadPreset}>Load Preset</button>
          </div>
        </div>
      </div>
      <div className="flex flex-row h-[10%] gap-0">
        <button
          onClick={() => router.push("/")}
          className="w-[20%] bg-[#4F4F4F] rounded-md text-[1.3rem]"
        >
          Back
        </button>
        <div className=" w-full h-full flex flex-row-reverse">
          <button
            onClick={() => nextButtonHandle()}
            className="w-[20%] bg-[#8DB177] rounded-md text-[1.3rem]"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Prev(Create);
