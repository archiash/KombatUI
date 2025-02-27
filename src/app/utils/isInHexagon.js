import { useEffect, useState } from "react";

export const isInHexagon = (x, y, r) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHover, setHover] = useState(false)

  useEffect(() => {
    const setFromEvent = (e) => setPosition({ x: e.clientX, y: e.clientY });
    const setHoverEvent = (e) => {
        setHover(() => {
            let sqrt3 = Math.sqrt(3);

            let dx = (e.clientX - x) / r;
            let dy = (e.clientY - y) / r;
        
            return dy > -sqrt3 / 2
                && dy < sqrt3 / 2
                && sqrt3 * dx + sqrt3 > dy
                && sqrt3 * dx - sqrt3 < dy
                && -sqrt3 * dx + sqrt3 > dy
                && -sqrt3 * dx - sqrt3 < dy
        });
    }
    window.addEventListener("mousemove", setFromEvent);
    window.addEventListener("mousemove", setHoverEvent);

    return () => {
      window.removeEventListener("mousemove", setFromEvent);
      window.removeEventListener("mousemove", setHoverEvent);
    };
  }, []);

  return {position, isHover};
};