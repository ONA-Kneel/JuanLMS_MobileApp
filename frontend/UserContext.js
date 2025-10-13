// // UserContext.js
// import React, { createContext, useContext, useState, useEffect } from 'react';

// const UserContext = createContext();

// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState({ role: "Student", name: "Juan Dela Cruz" }); // default role for testing

//   // Fetch user from backend (or session) on login
//   useEffect(() => {
//     // Simulating a login with a role
//     // You should replace this with real login logic
//     const loggedInUser = { role: "Student", name: "Juan Dela Cruz" }; // Example
//     setUser(loggedInUser);
//   }, []);

//   return (
//     <UserContext.Provider value={{ user, setUser }}>
//       {children}
//     </UserContext.Provider>
//   );
// };

// export const useUser = () => useContext(UserContext);
