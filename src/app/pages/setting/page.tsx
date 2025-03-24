"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setSettings } from "@/stores/slices/gameSlice";
import { TextFade } from "@/app/components/FadeUp";
import { Input, InputBlock } from "@/app/components/EInput";
import { useAppSelector } from "@/stores/hook";
import {
  changeConfig,
  selectRoom,
  setConfig,
  setRoom,
} from "@/stores/slices/roomSlice";
import { useWebSocket } from "@/hooks/useWebsocket";
import { Message, StompSubscription } from "@stomp/stompjs";
import { sub } from "framer-motion/client";
import Stomp from "stompjs";
import { Button_v5 } from "@/app/components/EButton";
import { selectUser } from "@/stores/slices/userSlice";
import { useKeyboard } from "@/hooks/useKeyboard";
import useFocus from "@/hooks/useFocus";

export default function Setting() {
  const router = useRouter();

  const dispatch = useDispatch();
  const room = useAppSelector(selectRoom);
  const user = useAppSelector(selectUser)
  const { sendMessage, subscribe, unsubscribe } = useWebSocket();
  const [userSubscription, setUserSubscription] = useState<StompSubscription>();
  const [roomSubscription, setRoomSubscription] = useState<StompSubscription>();
  
  interface SettingItem {
    setting: string;
    value: number;
  }
  
  const [confirm, setConfirm] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true);
  const [settings, setSetting] = useState<SettingItem[]>([]);

  useEffect(() => {
    setUserSubscription(userSubscription);
    return () => {
      if (userSubscription) {
        unsubscribe(userSubscription);
      }
    };
  }, [userSubscription]);

  useEffect(() => {
    setRoomSubscription(roomSubscription);
    return () => {
      if (roomSubscription) {
        unsubscribe(roomSubscription);
      }
    };
  }, [roomSubscription]);

  useEffect(() => {
    let data = setTimeout(() => {
      const sub = subscribe(`/topic/gamesConfig`, onSettingChange);
      const roomSub = subscribe(`/topic/room-${room?.id}`, onRoomUpdate);
      setUserSubscription(sub);
      setRoomSubscription(roomSub);
      const st: SettingItem[] = [];
      for (const cf in room.config) {
        st.push({ setting: cf, value: room.config[cf] });
      }
      setSetting(st);
    }, 0);
    return () => clearTimeout(data);
  }, []);

  useEffect(() => {
    const st: SettingItem[] = [];
    for (const cf in room.config) {
      st.push({ setting: cf, value: room.config[cf] });
    }
    setSetting(st);
  }, [room.config]);

  const onSettingChange = (payload: Stomp.Message) => {
    const config = JSON.parse(payload.body);
    dispatch(setConfig(config));
  };

  useEffect(() => {
    setLoading(settings.length === 0);
  }, [settings]);
  
  const saveSetting = () => {
    let config: Record<string, number> = {};
    for (const setting in room.config) {
    }
    settings.map((x) => (config[x.setting] = x.value));
    dispatch(setSettings(config));
  };

  const changeSetting = (key: string, value: number) => {
    console.log(key, value);
    const ls = settings.map((x) => {
      if (x.setting === key) {
        if (value > 9223372036854775000) value = 9223372036854775000;
        const element: SettingItem = { setting: key, value: value };
        sendMessage(`/room/editConfig`, {
          roomId: room.id,
          setting: key,
          value: value,
        });
        return element;
      } else {
        const element: SettingItem = { setting: x.setting, value: x.value };
        return element;
      }
    });
    setSetting([...ls]);
  };

  
  const onRoomUpdate = (payload: Stomp.Message) => {
    const cm = eval(`payload.headers.command`);
    if (cm === "update") {
      const data = JSON.parse(payload.body);
      console.log(data)
      dispatch(setRoom(data));
    }else if(cm === "next"){
      const data = JSON.parse(payload.body)
      saveSetting();
      dispatch(setRoom(data));
      router.push("/pages/create");
    }
  };

  useEffect(() => {
    if(user?.username === room.leader1){
     setConfirm(room.leader1Confirm) 
    }
    if(user?.username === room.leader2){
      setConfirm(room.leader2Confirm)
    }
  }, [room])


  const onNextButton = async () => {
    sendMessage(`/room/to-minion-select`, {
      roomId: room.id,
    });
  };

  const sendComfirmMessage = () => {
    sendMessage(`/room/confirmConfig`, {roomId : room.id, username : user?.username, confirmed: !confirm})
  }

  const [keyCommand, setKeyCommand] = useState<string>("")
  const [commandErr, setCommandErr] = useState<string>("")
  const k = useKeyboard()

  const roomInput = useFocus<HTMLInputElement>()

  useEffect(() => {
    console.log(k)
    if(k !== "" && !isFocus){
      setCommandErr("")
      if(k === "Enter"){
        if(keyCommand === "next"){
          if(!confirm) sendComfirmMessage()
          setKeyCommand("")
          return
        }else if(keyCommand === "cancle"){
          if(confirm) sendComfirmMessage()
          setKeyCommand("")
          return
        }
        for (const cf in room.config) {
          const regex = new RegExp(cf + " (\\d+)")
          console.log(regex)
          if(keyCommand.match(regex)){
            const val = keyCommand.split(' ')[1]
            changeSetting(cf, Number(val))
            setKeyCommand("")
            return
          }
        }
        setCommandErr("Don't have this command")
      }else if(k === "Backspace")
      {
        setKeyCommand(keyCommand.slice(0, -1))
      }
      else if(k?.length === 1 && (k?.match(/[a-z]/i) || k.match(/[0-9]/)) || k === " " || k === "_"){
        setKeyCommand(keyCommand + k)
      }

    }
  }, [k])

  const [isFocus, setFocus] = useState<boolean>(false);

  return (
    <>
      <div className="absolute pointer-events-none text-center py-2 h-screen w-screen flex flex-col-reverse">
        <div className={`w-full bg-[#0005] h-6 ${commandErr === "" ? `text-white` : `text-red-500`}`}>{commandErr === "" ? keyCommand : commandErr}</div>
      </div>
      {confirm && <div className="w-screen h-screen bg-[#00000055] flex flex-col gap-5 items-center pt-[30%] justify-center absolute z-10">
        <div className="text-2xl">Waiting for Other Player to Comfirm</div>
        <Button_v5 Icon="Cancle" className="text-xl w-[10rem]" onClick={() => {sendComfirmMessage()}}>Cancle</Button_v5>
      </div>}
      <div className="w-full h-screen flex flex-row gap-5 bg-zinc-900">
        <div className="w-[30%] h-[100%] bg-[#0005] p-10">
          <div className={`text-center text-2xl ${room.leader1Confirm ? `text-emerald-700` :  `text-zinc-300`}`}>{room.leader1}</div>
        </div>
        <div className="text-[1.3rem] flex flex-col h-screen w-full px-10 py-10 gap-0">
          <div className=" flex flex-col w-[100%] h-[100%] p-5 gap-5 items-center bg-[#2a2a2a99] m-3 rounded-md">
            <div className="w-full">{`Room Id: ${room.id}`}</div>
            <TextFade
              isShow={!loading}
              direction="up"
              className="flex flex-col w-[100%] h-[100%] gap-5"
            >
              {settings.map((element) => (
                <div
                  key={`setting_${element.setting}`}
                  className="w-full flex flex-row"
                >
                  <div className="w-[30%]">{element.setting}</div>
                  <InputBlock variant={"neubrutalism"} className="bg-[#0005]">
                    <Input
                      min={0}
                      max={"9223372036854775807"}
                      className="text-end"
                      value={element.value}
                      type="number"
                      onFocus={() => setFocus(true)}
                      onBlur={()=> setFocus(false)}
                      onChange={(e) =>
                        changeSetting(element.setting, e.target.valueAsNumber)
                      }
                    />
                  </InputBlock>
                </div>
              ))}
            </TextFade>
          </div>
          <div className="flex flex-row flex-1 px-5 gap-5">
            <button
              className="w-[50%] text-start"
              onClick={() => {
                saveSetting(), router.push("/pages/join");
              }}
            >
              Back
            </button>
            <button
              className="w-[50%] text-end"
              onClick={() => { 
                sendComfirmMessage()
/*                 onNextButton() */
              }}
            >
              Next
            </button>
          </div>
        </div>
        <div className="w-[30%] h-[100%] bg-[#0005] p-10">
          <div className={`text-center text-2xl ${room.leader2Confirm ? `text-emerald-700`: `text-zinc-300`}`}>{room.leader2}</div>
        </div>
      </div>
    </>
  );
}
