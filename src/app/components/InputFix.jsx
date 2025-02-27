import { useState, ChangeEvent, useRef, useLayoutEffect } from "react";

export default function InputField() {
  const position = useRef({
    beforeStart: 0,
    beforeEnd: 0
  });
  const [val, setVal] = useState("hello");
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    inputRef.current.setSelectionRange(
      position.current.beforeStart,
      position.current.beforeEnd
    );
  }, [val]);

  const onChange = (e) => {
    console.log(e);

    const beforeStart = e.target.selectionStart;
    const beforeEnd = e.target.selectionEnd;

    position.current = {
      beforeStart,
      beforeEnd
    };

    setVal(e.currentTarget.value.toUpperCase());

    // setTimeout(() => {
    //   inputRef.current.setSelectionRange(beforeStart, beforeEnd);
    // }, 0);
  };

  return (
    <>
      <textarea ref={inputRef} value={val} onChange={onChange} />
    </>
  );
}
