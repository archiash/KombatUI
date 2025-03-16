import React, { CSSProperties, ReactNode } from "react";
import { UniqueIdentifier, useDroppable } from "@dnd-kit/core";
import { useEffect, createRef, useState } from "react";

export function DroppableHex(props: {id: UniqueIdentifier, row: number, col:number, minion: ReactNode, bomb:String, x:number, y:number
  ,buyableOverlay:boolean, border_color: string, border_up: boolean, border_down: boolean, border_downleft: boolean, border_downright: boolean, border_upleft: boolean, border_upright: boolean
  , price : number ,onBuying: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: props.id,
    data: { row: props.row, col: props.col },
  });
  const [isHover, setHover] = useState(false);
  const style:CSSProperties = {
    transform: `translate(${props.x * 0.75 + props.col * 0  }px, ${
      (Math.sqrt(3) / 2) * props.y + 87 / 2 + props.row *0 
    }px)`,
    pointerEvents: "none",
  };

  const minion = props.minion;

  const [strokeColor, setStrokeColor] = useState("white");
  const [textColor, setTextColor] = useState("fill-white");

  const hexagonPoints = (radius:number) => {
    const halfWidth = (radius * Math.sqrt(3)) / 2;
    return `
      ${0},${halfWidth}
      ${radius / 2},${2 * halfWidth}
      ${(3 * radius) / 2},${2 * halfWidth}
      ${2 * radius}, ${halfWidth}
      ${(3 * radius) / 2},${0}
      ${radius / 2},${0}`;
  };

  const edgeList = (radius:number) => {
    const halfWidth = (radius * Math.sqrt(3)) / 2;
    return [
      [0,halfWidth],
      [radius / 2, 2 * halfWidth],
      [(3 * radius) / 2, 2 * halfWidth],
      [2 * radius, halfWidth],
      [(3 * radius) / 2, 0],
      [radius / 2,0]];
  }

  useEffect(() => {
    if (isOver) {
      setStrokeColor("z-30 fill-[#0E0E0E]");
      setTextColor("fill-[#ff0000]");
    } else if (props.bomb != "?" && props.bomb != "X") {
      if (props.bomb == "0") {
        setStrokeColor(" z-20");
        setTextColor("fill-none");
      } else {
        setStrokeColor(" z-20");
        setTextColor("fill-[#00ff00]");
      }
    } else if (isHover && props.bomb == "?") {
      setStrokeColor(" z-30 fill-[#0E0E0E]");
      setTextColor("fill-[#0000ff]");
    } else if (props.bomb == "X") {
      setStrokeColor(" z-20");
      setTextColor("fill-[#ff0000]");
    } else {
      setStrokeColor(" z-10 fill-[#151515]");
      setTextColor("fill-[#505050]");
    }
  }, [isHover, isOver]);

  const calculateZIndex = (hover:boolean, col:string) => {
    let z = 0;
    if(col !== "#000a"){
      z += 20;
    }
    if(hover){
      z += 10;
    }

    if(z === 0) return `z-0`
    if(z === 10) return `z-10`
    if(z === 20) return `z-20`
    if(z === 30) return `z-30`
    return `z-0`
  }

  return (
    <div
      className={`w-[100px] h-[87px] absolute ${calculateZIndex(isHover || isOver, props.border_color)}`}
      style={style}
      
      //transform={` translate(${10 + props.x * 0.75},${
      //  10 + (Math.sqrt(3) / 2) * props.y + 87 / 2
      //})`}
    > 
      <div className="absolute z-40 w-full h-full p-3 flex justify-center items-center"
        ref={setNodeRef}
      >
        <div style={{pointerEvents: "none", opacity: props.buyableOverlay ? 0.5 : 1}} className="w-full h-full flex justify-center items-center">{minion}</div>
        {props.buyableOverlay && <div className="z-50 absolute" style={{color : "#FFFFFF"}}>{`${props.price} $`}</div>}
      </div>
      <svg
        //ref={setNodeRef}
        style={{ pointerEvents: "none" }}
        className={`justify-center items-center w-[100px] h-[87px] absolute  ${strokeColor}`}
        key={`${props.x}${props.y}`}
      >
        <polygon
          style={{ pointerEvents: "auto" }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          points={hexagonPoints(50)}
          onClick={() => {if(props.buyableOverlay)  props.onBuying()}}
        />
        <polygon
          style={{ pointerEvents: "none", fill: props.border_color, opacity: 0.03 }}
          points={hexagonPoints(50)}
        />

        {props.buyableOverlay && <polygon
          style={{ pointerEvents: "none", fill: props.border_color }}
          className=" opacity-10 z-50 "
          points={hexagonPoints(50)}
        />}
        <line
          style={{ pointerEvents: "auto", strokeDasharray: "100, 350", strokeWidth:1, stroke:`${props.border_downleft ? props.border_color :`#000a`}` }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          x1={edgeList(50)[0][0]}
          x2={edgeList(50)[1][0]}
          y1={edgeList(50)[0][1]}
          y2={edgeList(50)[1][1]}
          onClick={() => console.log(`${props.x},${props.y}`)}
        />
        <line
          style={{ pointerEvents: "auto", strokeDasharray: "100, 350", strokeWidth:1, stroke:`${props.border_down ? props.border_color:`#000a`}` }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          x1={edgeList(50)[1][0]}
          x2={edgeList(50)[2][0]}
          y1={edgeList(50)[1][1]}
          y2={edgeList(50)[2][1]}
          onClick={() => console.log(`${props.x},${props.y}`)}
        />
        <line
          style={{ pointerEvents: "auto", strokeDasharray: "100, 350", strokeWidth:1, stroke:`${props.border_downright ? props.border_color:`#000a`}` }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          x1={edgeList(50)[2][0]}
          x2={edgeList(50)[3][0]}
          y1={edgeList(50)[2][1]}
          y2={edgeList(50)[3][1]}
          onClick={() => console.log(`${props.x},${props.y}`)}
        />  
        <line
          style={{ pointerEvents: "auto", strokeDasharray: "100, 350", strokeWidth:1, stroke:`${props.border_upright ? props.border_color:`#000a`}` }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          x1={edgeList(50)[3][0]}
          x2={edgeList(50)[4][0]}
          y1={edgeList(50)[3][1]}
          y2={edgeList(50)[4][1]}
          onClick={() => console.log(`${props.x},${props.y}`)}
        />    
        <line
          style={{ pointerEvents: "auto", strokeDasharray: "100, 350", strokeWidth:1, stroke:`${props.border_up ? props.border_color:`#000a`}` }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          x1={edgeList(50)[4][0]}
          x2={edgeList(50)[5][0]}
          y1={edgeList(50)[4][1]}
          y2={edgeList(50)[5][1]}
          onClick={() => console.log(`${props.x},${props.y}`)}
        />
        <line
          style={{ pointerEvents: "auto", strokeDasharray: "100, 350", strokeWidth:1, stroke:`${props.border_upleft ? props.border_color:`#000a  `}` }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          x1={edgeList(50)[5][0]}
          x2={edgeList(50)[0][0]}
          y1={edgeList(50)[5][1]}
          y2={edgeList(50)[0][1]}
          onClick={() => console.log(`${props.x},${props.y}`)}
        />
      </svg>
    </div>
  );
}
