import React, { useState } from 'react';

function Counter() {

  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button onClick={() => setCount(0)}>
        Reset
      </button>
    </div>
  );

}

export default Counter;