import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // Mode lựa chọn: 'light' | 'dark' | 'system'
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem("elderly_ai_theme_mode") || "system";
  });

  // Theme thực tế đang áp dụng: 'light' | 'dark'
  const [activeTheme, setActiveTheme] = useState("light");

  useEffect(() => {
    const applyTheme = () => {
      let selectedTheme = themeMode;

      if (themeMode === "system") {
        const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        selectedTheme = isSystemDark ? "dark" : "light";
      }

      setActiveTheme(selectedTheme);
      document.documentElement.setAttribute("data-bs-theme", selectedTheme);
      document.documentElement.classList.remove("light-theme", "dark-theme");
      document.documentElement.classList.add(`${selectedTheme}-theme`);

      // Cập nhật background body
      if (selectedTheme === "dark") {
        document.body.style.backgroundColor = "#0f172a";
        document.body.style.color = "#f8fafc";
      } else {
        document.body.style.backgroundColor = "#f8fafc";
        document.body.style.color = "#1e293b";
      }
    };

    applyTheme();
    localStorage.setItem("elderly_ai_theme_mode", themeMode);

    // Lắng nghe sự thay đổi của Hệ thống OS nếu chọn mode 'system'
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (themeMode === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, [themeMode]);

  const changeThemeMode = (mode) => {
    setThemeMode(mode);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, activeTheme, changeThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme phải được dùng bên trong ThemeProvider");
  }
  return context;
};
