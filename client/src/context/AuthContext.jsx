import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load, restore the session if a token exists
  useEffect(() => {
    if (!localStorage.getItem("token")) return setLoading(false);
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, user }) => {
    localStorage.setItem("token", token);
    setUser(user);
  };

  const login = async (email, password) =>
    saveSession((await api.post("/auth/login", { email, password })).data.data);

  const register = async (name, email, password) =>
    saveSession((await api.post("/auth/register", { name, email, password })).data.data);

  // JWTs are stateless: logging out just means forgetting the token
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
