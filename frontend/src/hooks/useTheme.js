import { useEffect } from "react";
import { THEME_STORAGE_KEY } from "../data/constants";
import { useLocalStorage } from "./useLocalStorage";

export function useTheme() {
  const [theme, setTheme] = useLocalStorage(THEME_STORAGE_KEY, "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return [theme, setTheme];
}
