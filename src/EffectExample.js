import { useEffect, useState } from "react";

function EffectExample() {
  const [count, setCount] = useState(0);

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
