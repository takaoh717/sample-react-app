import React, { useContext, useState } from 'react';
import AppContext from './AppContext';

function Counter() {

  const { count, setCount } = useContext(AppContext);

  console.log({ count, setCount });
  if (count === undefined || setCount === undefined) {
    return <div>Error: Context not provided</div>;
  }

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