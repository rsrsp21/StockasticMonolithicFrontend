import React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      storageKey="stockastic-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

