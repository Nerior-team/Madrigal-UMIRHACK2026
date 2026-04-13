import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { ProfileDashboardResponse } from "../core";
import { bootstrapAuthSession, terminateAuthSession } from "../app/auth-session";

export type PlatformSessionStatus = "loading" | "authenticated" | "guest";

type PlatformSessionContextValue = {
  status: PlatformSessionStatus;
  profile: ProfileDashboardResponse | null;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  setGuest: () => void;
};

const PlatformSessionContext = createContext<PlatformSessionContextValue | null>(null);

type PlatformSessionProviderProps = PropsWithChildren<{
  initialStatus?: PlatformSessionStatus;
  initialProfile?: ProfileDashboardResponse | null;
  disableBootstrap?: boolean;
}>;

export function PlatformSessionProvider({
  children,
  initialStatus = "loading",
  initialProfile = null,
  disableBootstrap = false,
}: PlatformSessionProviderProps) {
  const [status, setStatus] = useState<PlatformSessionStatus>(initialStatus);
  const [profile, setProfile] = useState<ProfileDashboardResponse | null>(initialProfile);

  const refreshSession = useCallback(async () => {
    setStatus("loading");
    const session = await bootstrapAuthSession();
    if (session) {
      setProfile(session);
      setStatus("authenticated");
      return;
    }

    setProfile(null);
    setStatus("guest");
  }, []);

  const signOut = useCallback(async () => {
    await terminateAuthSession();
    setProfile(null);
    setStatus("guest");
  }, []);

  const setGuest = useCallback(() => {
    setProfile(null);
    setStatus("guest");
  }, []);

  useEffect(() => {
    if (disableBootstrap) {
      return;
    }
    void refreshSession();
  }, [disableBootstrap, refreshSession]);

  const value = useMemo<PlatformSessionContextValue>(
    () => ({
      status,
      profile,
      refreshSession,
      signOut,
      setGuest,
    }),
    [profile, refreshSession, setGuest, signOut, status],
  );

  return <PlatformSessionContext.Provider value={value}>{children}</PlatformSessionContext.Provider>;
}

export function usePlatformSession(): PlatformSessionContextValue {
  const context = useContext(PlatformSessionContext);
  if (!context) {
    throw new Error("usePlatformSession must be used within PlatformSessionProvider");
  }
  return context;
}
