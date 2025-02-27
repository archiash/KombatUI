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

export default function Setting() {
  const router = useRouter();

  const dispatch = useDispatch();
  const room = useAppSelector(selectRoom);
  const { sendMessage, subscribe, unsubscribe } = useWebSocket();
  const [userSubscription, setUserSubscription] = useState<StompSubscription>();
  const [roomSubscription, setRoomSubscription] = useState<StompSubscription>();
  interface SettingItem {
    setting: string;
    value: number;
  }

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
      dispatch(setRoom(data));
    }else if(cm === "next"){
      saveSetting();
      router.push("/pages/create");
    }
  };

  const onNextButton = async () => {
    sendMessage(`/room/to-minion-select`, {
      roomId: room.id,
    });
  };

  return (
    <>
      <div className="w-full h-screen flex flex-row gap-5 bg-zinc-900">
        <div className="w-[30%] h-[100%] bg-[#0005] p-10">
          <div className="text-center text-2xl">{room.leader1}</div>
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
                saveSetting(), router.push("/");
              }}
            >
              Back
            </button>
            <button
              className="w-[50%] text-end"
              onClick={() => {
                onNextButton()
              }}
            >
              Next
            </button>
          </div>
        </div>
        <div className="w-[30%] h-[100%] bg-[#0005] p-10">
          <div className="text-center text-2xl">{room.leader2}</div>
        </div>
      </div>
    </>
  );
}
