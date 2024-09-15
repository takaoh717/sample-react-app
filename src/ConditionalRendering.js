import React, { useState } from 'react';

function ConditionalRendering() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleLogin = () => {
    setIsLoggedIn(!isLoggedIn);
  };

  return (
    <div>
      <h1>{isLoggedIn ? 'Welcome back!' : 'Please log in.'}</h1>
      <button onClick={toggleLogin}>
        {isLoggedIn ? 'Logout' : 'Login'}
      </button>
    </div>
  );

}

export default ConditionalRendering;