import { useContext } from "react";
import AppContext from "./AppContext";

function UserProfile() {
  const { user, setUser } = useContext(AppContext);

  const handleLogin = () => {
    setUser({ name: 'John san' });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div>
      <h2>User Profile</h2>
      {user ? (
        <div>
          <p>Welcome, {user.name}!!!</p>
          <button onClick={handleLogout}>Logout!!!</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login!!!</button>
      )}
    </div>
  );
}

export default UserProfile;