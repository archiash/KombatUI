"use client";
import { Button_v5 } from "@/app/components/EButton";
import { Input, InputBlock } from "@/app/components/EInput";
import { useWebSocket } from "@/hooks/useWebsocket";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { selectUser, setUser } from "@/stores/slices/userSlice";
import { useEffect, useState } from "react";
import { setRoom, } from "@/stores/slices/roomSlice";
import { Message, StompSubscription } from "@stomp/stompjs";
import { useAppSelector } from "@/stores/hook";

export default function Home() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [userSubscription, setUserSubscription] = useState<StompSubscription>();
  const { sendMessage, subscribe, unsubscribe } = useWebSocket();
  const [roomIdToJoin, setRoomIdToJoin] = useState<string>("");

  useEffect(() => {
    setUserSubscription(userSubscription);
    return () => {
      if (userSubscription) {
        unsubscribe(userSubscription);
      }
    };
  }, [userSubscription]);

  const onGameCreated = (payload: Message) => {
    const room = JSON.parse(payload.body);
    console.log("Get Room");
    console.log(room);
    dispatch(setRoom(room));
    router.push("/pages/setting");
  };

  const user = useAppSelector(selectUser);

  useEffect(() => {
    let data = setTimeout(() => {
      if(user === null){
        router.push('/')
      }
    }, 0);
    return () => clearTimeout(data);
  }, []);

  const createGameHandle = async () => {
    try {
      const roomCreation = subscribe(`/topic/games-create-${user?.username}`, onGameCreated);
      setUserSubscription(roomCreation);
      sendMessage(`/game/create`, {});
    } catch (er) {
      console.log("Error");
    }
  };

  const onJoinGame = (payload: Message) => {
    const room = JSON.parse(payload.body);
    console.log("Get Room");
    console.log(room);
    if(room["id"] === "ER-FULL"){
      setJoinAlert("Room is already full")
      console.log("Room already full")
      return
    }else if(room["id"] === "ER-NONE"){
      setJoinAlert("Room doesn't exist")
      console.log("Room doesn't exist")
      return
    }
    dispatch(setRoom(room));
    router.push("/pages/setting");
  };

  
  const [joinAlert, setJoinAlert] = useState<string>("None")

  const joinGameHandle = async () => {
    try {
      const roomJoin = subscribe(`/topic/games-join-${user?.username}`, onJoinGame);
      setUserSubscription(roomJoin);
      sendMessage(`/game/join`, { roomId: roomIdToJoin });
    } catch (er) {
      console.log("Error");
    }
  };

  const roomElement = (roomName:string, roomId:string, roomMode:string) => {
    return (
      <div className="w-full bg-zinc-700 p-3 rounded-sm flex flex-row">
      <div className="w-[50%]">{roomId}</div>
      <div className="w-[50%]">{roomName}</div>
      <div className="w-full text-end">{roomMode}</div>
      <button className="ml-5 w-[50%] h-full bg-zinc-900">Join</button>
    </div>
    )
  }

  return (
    <>
      <div className="w-screen bg-[#151515] h-screen flex justify-center">
        <div className="w-[80%] gap-5 p-10 h-screen flex flex-col items-center justify-center">
          <div className="w-[100%] flex flex-row justify-end items-end h-fit gap-5 ">
            <div className="text-xl w-[15%] flex flex-row justify-center items-center">
              Room Id
            </div>
            <InputBlock  upSection={<div style={{opacity: joinAlert === 'None'? 0 : 1}} className="text-red-400" >{joinAlert}</div>} className={`origin-bottom ${joinAlert !== "None" ? "border-red-400 dark:shadow-red-500" : ""}`} variant={"neubrutalism"}>
              <Input
                value={roomIdToJoin}
                onChange={(e) => {setRoomIdToJoin(e.target.value), setJoinAlert("None")}}
              />
            </InputBlock>
            <Button_v5 onClick={joinGameHandle} className="w-[15%]" Icon="Join">
              Join
            </Button_v5>
            <Button_v5
              onClick={createGameHandle}
              className="w-[15%]"
              Icon="Create"
            >
              Create
            </Button_v5>
          </div>

          <div className=" h-full w-full bg-[#0009] rounded-md flex flex-col p-10 gap-3">
            {roomElement("Archiash's room", "AA00000", "Duel")}
          </div>
        </div>
      </div>
    </>
  );
}
