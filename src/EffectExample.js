import { useContext, useEffect, useState } from "react";
import AppContext from "./AppContext";

function EffectExample() {
  const {count, setCount} = useContext(AppContext);

  useEffect (() => {
    document.title = `You clicked ${count} times`;

    return () => {
      console.log("Cleanup on unmount or before the next effect.");
    };
  }, [count]);

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}

export default EffectExample;
