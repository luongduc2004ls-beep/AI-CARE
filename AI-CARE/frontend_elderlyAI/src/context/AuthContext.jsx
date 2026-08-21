import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

const API_BASE_URL = window.location.hostname.includes("serveousercontent.com") || window.location.protocol === "https:"
  ? "https://3318293df04c7371-171-255-66-135.serveousercontent.com/api"
  : `http://${window.location.hostname || "localhost"}:5000/api`;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("elderly_ai_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("elderly_ai_token") || null;
  });

  const [loading, setLoading] = useState(false);

  // Đăng xuất
  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem("elderly_ai_user");
    localStorage.removeItem("elderly_ai_token");
  };

  // Xác thực token với máy chủ khi tải trang
  useEffect(() => {
    const verifySavedToken = async () => {
      const storedToken = localStorage.getItem("elderly_ai_token");
      if (storedToken) {
        try {
          const res = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (res.data && res.data.success) {
            setCurrentUser(res.data.user);
            localStorage.setItem("elderly_ai_user", JSON.stringify(res.data.user));
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
    };
    verifySavedToken();
  }, []);

  // Đăng nhập tài khoản
  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
      if (res.data && res.data.success) {
        const userData = res.data.user;
        const authToken = res.data.token;

        setCurrentUser(userData);
        setToken(authToken);

        localStorage.setItem("elderly_ai_user", JSON.stringify(userData));
        localStorage.setItem("elderly_ai_token", authToken);

        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || "Đăng nhập thất bại" };
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || "Tên đăng nhập hoặc mật khẩu không chính xác!";
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký tài khoản mới
  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      if (res.data && res.data.success) {
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || "Đăng ký thất bại" };
    } catch (err) {
      const msg = err.response?.data?.message || "Đăng ký không thành công!";
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!currentUser,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
};
