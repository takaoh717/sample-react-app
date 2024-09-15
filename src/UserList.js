import { useEffect, useState } from "react";
import useFetch from "./useFetch";

function UserList() {
  // const [users, setUsers] = useState([]);
  const { data: users, loading, error} = useFetch('https://jsonplaceholder.typicode.com/users');

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  // useEffect(() => {
  //   fetch('https://jsonplaceholder.typicode.com/users')
  //   .then(response => response.json())
  //   .then(data => setUsers(data))
  //   .catch(error => console.error('Error fetching data:', error));
  // }, []);

  return (
    <div>
      <h2>User List</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name} ({user.email})</li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;