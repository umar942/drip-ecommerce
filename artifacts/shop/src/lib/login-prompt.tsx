import React, { createContext, useContext, useState, ReactNode } from "react";

const SESSION_FLAG = "drip_login_prompt_shown";

interface LoginPromptContextType {
  open: boolean;
  maybePrompt: () => void;
  close: () => void;
}

const LoginPromptContext = createContext<LoginPromptContextType | undefined>(undefined);

export function LoginPromptProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const maybePrompt = () => {
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    sessionStorage.setItem(SESSION_FLAG, "1");
    setOpen(true);
  };

  const close = () => setOpen(false);

  return (
    <LoginPromptContext.Provider value={{ open, maybePrompt, close }}>
      {children}
    </LoginPromptContext.Provider>
  );
}

export function useLoginPrompt() {
  const context = useContext(LoginPromptContext);
  if (context === undefined) {
    throw new Error("useLoginPrompt must be used within a LoginPromptProvider");
  }
  return context;
}
