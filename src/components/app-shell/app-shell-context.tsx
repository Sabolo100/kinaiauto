"use client";

import { createContext, useContext } from "react";

export type AppShellCtx = {
  moreOpen: boolean;
  openMore: () => void;
  closeMore: () => void;
  isStandalone: boolean;
};

export const AppShellContext = createContext<AppShellCtx>({
  moreOpen: false,
  openMore: () => {},
  closeMore: () => {},
  isStandalone: false,
});

export function useAppShell() {
  return useContext(AppShellContext);
}

/** Custom event the "Telepítés" tile fires; InstallPrompt listens for it. */
export const INSTALL_EVENT = "kinai:install";
