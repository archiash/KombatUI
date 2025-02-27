import { useEffect, createRef, useState } from "react";
import { isInHexagon } from "../utils/isInHexagon";

export default function Hex({ x , y, bomb, clickFunc }) {
  const [strokeColor, setStrokeColor] = useState("white");
  const [textColor, setTextColor] = useState("fill-white");
  const [isHover, setHover] = useState(false);
  const hexagonPoints = (radius) => {
    const halfWidth = (radius * Math.sqrt(3)) / 2;
    return `
      ${-radius},0
      ${-radius / 2},${halfWidth}
      ${radius / 2},${halfWidth}
      ${radius}, 0
      ${radius / 2},${-halfWidth}
      ${-radius / 2},${-halfWidth}`;
  };

  useEffect(() => {
    if (bomb != "?" && bomb != "X") {
      if (bomb == "0") {
        setStrokeColor("stroke-none z-20");
        setTextColor("fill-none");
      } else {
        setStrokeColor("stroke-[#00ff00] z-20");
        setTextColor("fill-[#00ff00]");
      }
    } else if (isHover && bomb == "?") {
      setStrokeColor("stroke-[#0000ff] z-30 fill-[#222222]");
      setTextColor("fill-[#0000ff]");
    } else if (bomb == "X") {
      setStrokeColor("stroke-[#ff0000] z-20");
      setTextColor("fill-[#ff0000]");
    } else {
      setStrokeColor("stroke-none z-10 fill-[#151515]");
      setTextColor("fill-[#505050]");
    }
  }, [isHover]);

  const handleEvent = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pos_x = event.clientX - bounds.left;
    const pos_y = event.clientY - bounds.top;
    let sqrt3 = Math.sqrt(3);

    let dx = (pos_x - 50) / 50;
    let dy = (pos_y - 43.3) / 50;

    const inSide =
      dy > -sqrt3 / 2 &&
      dy < sqrt3 / 2 &&
      sqrt3 * dx + sqrt3 > dy &&
      sqrt3 * dx - sqrt3 < dy &&
      -sqrt3 * dx + sqrt3 > dy &&
      -sqrt3 * dx - sqrt3 < dy;

    if (!inSide && pos_x < 25) {
      setStrokeColor("stroke-none z-0 fill-[#151515]");
      setTextColor("fill-[#505050]");
      setHover(false);
    }

    setHover(inSide);
  };

  return (
    <svg
      style={{ pointerEvents: "stroke" }}
      onMouseMove={handleEvent}
      onMouseLeave={() => setHover(false)}
      transform={`translate(${x * 0.75},${(Math.sqrt(3) / 2) * y})`}
      className={`overflow-visible justify-center items-center w-[100px] h-[87px] absolute ${strokeColor}`}
      //ref={ref}
      key={`${x}${y}`}
      //onClick={click}
    >
      <polygon
        transform={`translate(${50},${87 / 2})`}
        points={hexagonPoints(50)}
        //onClick={() => console.log(`${x},${y}`)}
      />
      <text
        className={`stroke-none ${textColor}`}
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
      >
        
      </text>
    </svg>
  );
}
