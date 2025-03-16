"use client";
import ControlledTextArea from "@/app/components/ControllTextarea";
import { Minion1, Minion2, Minion3 } from "@/app/components/minion";
import Prev from "@/app/components/Prev";
import { useWebSocket } from "@/hooks/useWebsocket";
import { useAppSelector } from "@/stores/hook";
import {
  selectGame,
  
  receiveBudget,
} from "@/stores/slices/gameSlice";
import {
  selectRoom,
  selectRoomMinion,
  setOtherEditing,
  setMinions,
  setRoom,
} from "@/stores/slices/roomSlice";
import { selectUser } from "@/stores/slices/userSlice";
import { selectWebsocket } from "@/stores/slices/webSocketSlice";
import { Minion } from "@/types/minion";
import { Message, StompSubscription } from "@stomp/stompjs";
import { index } from "d3";
import { i, tr } from "framer-motion/client";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import InputField from "@/app/components/InputFix";
import { useCaretPosition } from "react-use-caret-position";
import { EditingRoom } from "@/types/editingRoom";
import { Button_v5 } from "@/app/components/EButton";
import { Input, InputBlock } from "@/app/components/EInput";
import { data } from "react-router";

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

  const onEditing = async (field:"name" | "defense" | "script" | "none") => {
    console.log("mIndex", currentType)
    sendMessage("/room/minion/edit", {roomId: room.id, index : currentType, field: field});
  }


  const [indexErr, setIndexErr] = useState<number>(-1);
  const [nameErr, setNameErr] = useState<string>("None");
  const [scriptErr, setScriptErr] = useState<string>("None");

  const [removedIndex, setRemovedIndex] = useState<number>(-1);

  const onMinionUpdate = (payload: Message) => {
    const command = payload.headers["command"];
    if (command === "update" || command === "get") {
      const data = JSON.parse(payload.body);
      console.log(data);
      dispatch(setMinions(data));
    }else if(command === "edit"){
      const data = JSON.parse(payload.body)
      console.log(data);
      const other = data.filter((k:EditingRoom) => k["userName"] !== user?.username)
      if(other[0]["mindex"] === currentType){
        if(other[0]["field"] === "name")
        {
          setNameErr("None")
        }
        else if(other[0]["field"] === "script"){
          setScriptErr("None")
        }
      }
      dispatch(setOtherEditing(other[0]))
    }else if(command === "confirm"){
      const data = JSON.parse(payload.body);
      console.log(data)
      dispatch(setRoom(data))
    }else if(command === "next"){
      const data = JSON.parse(payload.body) 
      console.log("NEXT")
      console.log(data)
      dispatch(setMinions(data))
      router.push("/pages/Hexsweeper")
    }else if(command === "err"){
      const data = JSON.parse(payload.body)
      console.log(data)
      console.log(data["index"])
      dispatch(setRoom(data["room"]))
      setIndexErr(data["index"])
      if(data["field"] === "name"){
        setNameErr(data["message"])
      }else if(data["field"] === "script"){
        setScriptErr(data["message"])
      }
    }else if(command === "remove"){
      const data = JSON.parse(payload.body)
      const index = data["index"]
      setNameErr("None")
      setScriptErr("None")
      dispatch(setMinions(data["minions"]))
      setRemovedIndex(index)
    }
  };

  useEffect(() => {
    console.log("Set Removed")
    if(removedIndex !== -1){
      if(removedIndex < currentType){
        console.log("Remove Less Than")
        setCurrentType(currentType - 1)
        loadMinion(currentType - 1)
      }else if(removedIndex === currentType){
        if(roomMinions.minions.length === currentType){
          console.log("Remove Equal")
          setCurrentType(currentType - 1)
          loadMinion(currentType - 1)
        }
      }
    }
  }, [removedIndex])

  useEffect(() => {
    
  }, [room.otherEdit])

  useEffect(() => {
    console.log("Index Err: " + indexErr)
    if(indexErr > -1 && indexErr < 5){
      loadMinion(indexErr);
    }
  }, [indexErr])
  

  useEffect(() => {
    console.log("Dispatch")
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
      if(currentType < roomMinions.minions.length){
        loadMinion(currentType);
      }
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
    sendMessage("/room/minion/remove", {roomId: room.id, index: currentType})
    /* console.log(minionList);
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
    } */
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
    setNameErr("None")
    setScriptErr("None")
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

  const changeMinionName = (e: ChangeEvent<HTMLInputElement>) => {
    setTypeName(e.target.value)
    setNameErr("None")
/*     sendMessage(`/room/minion/name`, {
      roomId: room.id,
      minionName: e.target.value,
      index: currentType,
    }); */
  };


  const sendMinionName = () => {
    sendMessage(`/room/minion/name`, {
      roomId: room.id,
      minionName: typeName,
      index: currentType,
    });
  }

  const sendMinionDefense = () => {
    sendMessage(`/room/minion/defense`, {
      roomId: room.id,
      defense: defense,
      index: currentType,
    });
  }

  const sendMinionScript = () => {
    sendMessage(`/room/minion/script`, {
      roomId: room.id,
      script: strategy,
      index: currentType,
    });
  }
  
  const changeMinionDefense = (e: ChangeEvent<HTMLInputElement>) => {
    setDefense(e.target.valueAsNumber)
/*     console.log("Send Defense");
    sendMessage(`/room/minion/defense`, {
      roomId: room.id,
      defense: e.target.valueAsNumber,
      index: currentType,
    }); */
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
    setStrategy(e.target.value)
    setScriptErr("None")
/*     console.log("Send Script");
    sendMessage(`/room/minion/script`, {
      roomId: room.id,
      script: e.target.value,
      index: currentType,
    }); */
  };

  const [confirm, setConfirm] = useState<boolean>(false)
  const [otherConfirm, setOtherConfirm] = useState<boolean>(false);

  useEffect(() => {
    if(user?.username === room.leader1){
      setConfirm(room.leader1Confirm) 
      setOtherConfirm(room.leader2Confirm)
    }
    if(user?.username === room.leader2){
      setConfirm(room.leader2Confirm)
      setOtherConfirm(room.leader1Confirm)
    }
  }, [room])


  const sendComfirmMessage = (confirmed : boolean) => {
    sendMessage(`/room/minion/confirm`, {roomId: room.id, confirmed: confirmed, username: user?.username})
  }

  return (
    <>
    
      {confirm && <div className="w-screen h-screen bg-[#00000055] flex flex-col gap-5 items-center pt-[30%] justify-center absolute z-10">
        <div className="text-2xl">Waiting for Other Player to Comfirm</div>
        <Button_v5 Icon="Cancle" className="text-xl w-[10rem]" onClick={() => sendComfirmMessage(false)}>Cancle</Button_v5>
      </div>}
    <div className="text-[1.3rem] flex flex-col h-screen px-10 gap-0">
      <div className="flex flex-row h-[90%] gap-0">
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
          <InputBlock variant={'neubrutalism'} className={`${nameErr !== 'None' ? 'border-red-400' : ''} ${room.otherEdit !== undefined && room.otherEdit.field === "name" && room.otherEdit.mindex === currentType ? ` border-emerald-400 border-2` : ""}`} 
          upSection={<div className={`text-base ${nameErr === 'None' ? 'opacity-0' : 'opacity-100 text-red-400'}`}>{nameErr}</div>}
          >
          <Input
            disabled={room.otherEdit !== undefined && room.otherEdit.field === "name" && room.otherEdit.mindex === currentType}
            
            value={typeName}
            onChange={changeMinionName}
            onFocus={() => onEditing("name")}
            onBlur={() => {onEditing("none"), sendMinionName()}}
            style={{ resize: "none" }}
            placeholder="Minion Type Name"
            className={`w-full h-full text-[#fff] `}
          ></Input></InputBlock>
          <InputBlock variant={'neubrutalism'} className={`${room.otherEdit !== undefined && room.otherEdit.field === "defense" && room.otherEdit.mindex === currentType ? `border-emerald-400 border-2` : ""}`}>
          <Input
            value={defense}
            disabled={room.otherEdit !== undefined && room.otherEdit.field === "defense" && room.otherEdit.mindex === currentType}
            onChange={changeMinionDefense}
            onFocus={() => onEditing("defense")}
            onBlur={() => {onEditing("none"), sendMinionDefense()}}
            type="number"
            min={0}
            max={10 ** 9}
            style={{ resize: "none" }}
            placeholder="Minion Defense"
            className={`w-full text-[#fff] `}
          ></Input></InputBlock>
          <Button_v5
            Icon = "  "
            hoverClass="bg-red-400"
            onClick={() => removeMinion()}
            className={removeMinionButtonStyle()}
          >
            Delete
          </Button_v5>
        </div>
        <div className="flex flex-col w-full bg-[#2a2a2a99] m-3 rounded-md p-5 gap-2">
          <div className={`${scriptErr === "None" ? "opacity-0 text-base": "opacity-100 text-base text-red-400"}`}>{scriptErr}</div>
          <textarea
            value={strategy}
            disabled={room.otherEdit !== undefined && room.otherEdit.field === "script" && room.otherEdit.mindex === currentType}
            onFocus={() => onEditing("script")}
            onBlur={() => {onEditing("none"), sendMinionScript()}}
            onChange={changeMinionScript}
            style={{ resize: "none" }}
            autoFocus={true}
            placeholder="Minion Strategy Script"
            className={`h-full text-[#fff] bg-[#52525299] rounded-md p-5 text-[1rem] ${scriptErr === "None" ? "" : "border-2 border-red-400"} ${room.otherEdit !== undefined && room.otherEdit.field === "script" && room.otherEdit.mindex === currentType ? `border-emerald-400 border-2` : ""}`}

          />
          <div className="flex flex-row justify-end gap-10">
            <button onClick={loadPreset}
            disabled={room.otherEdit !== undefined && room.otherEdit.field === "script" && room.otherEdit.mindex === currentType}
            className={`${room.otherEdit !== undefined && room.otherEdit.field === "script" && room.otherEdit.mindex === currentType ? `opacity-0` : ``}`}
            >Load Preset</button>
          </div>
        </div>
      </div>
      <div className="flex flex-row h-[7%] gap-0">
        <button
          onClick={() => router.push("/pages/join")}
          className="w-[20%] bg-[#4F4F4F] rounded-md text-[1.3rem]"
        >
          Back
        </button>
          <div className="w-[60%] text-center">{otherConfirm ? `Other Player has Confirmed` : ``}</div>
          <button
            onClick={() => sendComfirmMessage(true)}
            className="w-[20%] bg-[#8DB177] rounded-md text-[1.3rem]"
          >
            {otherConfirm ? `Next` : `Confirm`}
          </button>
        
      </div>
    </div>
    </>
  );
};

export default Prev(Create);
