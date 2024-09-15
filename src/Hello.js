import React from 'react';

function Hello(props) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>{props.message}</p>
    </div>
  )
}

export default Hello;