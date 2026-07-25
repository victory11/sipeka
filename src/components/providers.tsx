"use client";

import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cx } from "@/lib/utils";
import { getToken, setToken, apiFetch } from "@/lib/client";
import type { SanitizedAdmin } from "@/lib/types";

/* ================= Toast ================= */

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastCtx {
  push: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastCtx>({ push: () => {} });
export const useToast = () => useContext(ToastContext);

function ToastHost({
  toasts,
  remove,
}: {
  toasts: ToastItem[];
  remove: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((t) => {
        const Icon =
          t.kind === "success"
            ? CheckCircle2
            : t.kind === "error"
              ? AlertCircle
              : Info;
        return (
          <div
            key={t.id}
            role="status"
            className={cx(
              "animate-toast-in pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-white p-3.5 shadow-pop",
              t.kind === "success" && "border-medic-500/30",
              t.kind === "error" && "border-red-300",
              t.kind === "info" && "border-primary-200",
            )}
          >
            <Icon
              size={18}
              className={cx(
                "mt-0.5 shrink-0",
                t.kind === "success" && "text-medic-600",
                t.kind === "error" && "text-red-600",
                t.kind === "info" && "text-primary-700",
              )}
            />
            <p className="flex-1 text-sm font-medium leading-snug text-ink-800">
              {t.message}
            </p>
            <button
              onClick={() => remove(t.id)}
              aria-label="Tutup notifikasi"
              className="cursor-pointer rounded p-0.5 text-ink-400 transition hover:text-ink-700"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ================= Auth ================= */

interface AuthCtx {
  admin: SanitizedAdmin | null;
  initializing: boolean;
  setSession: (token: string, admin: SanitizedAdmin) => void;
  updateAdmin: (admin: SanitizedAdmin) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  admin: null,
  initializing: true,
  setSession: () => {},
  updateAdmin: () => {},
  logout: () => {},
});
export const useAuth = () => useContext(AuthContext);

/* ================= Providers ================= */

export function Providers({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-3), { id, kind, message }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove],
  );

  const [admin, setAdmin] = useState<SanitizedAdmin | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const token = getToken();
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const data = await apiFetch<{ admin: SanitizedAdmin }>("/api/admin/me");
        if (!cancelled) setAdmin(data.admin);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const toastValue = useMemo(() => ({ push }), [push]);
  const authValue = useMemo<AuthCtx>(
    () => ({
      admin,
      initializing,
      setSession: (token, adm) => {
        setToken(token);
        setAdmin(adm);
      },
      updateAdmin: (adm) => setAdmin(adm),
      logout: () => {
        setToken(null);
        setAdmin(null);
      },
    }),
    [admin, initializing],
  );

  return (
    <ToastContext.Provider value={toastValue}>
      <AuthContext.Provider value={authValue}>
        {children}
        <ToastHost toasts={toasts} remove={remove} />
      </AuthContext.Provider>
    </ToastContext.Provider>
  );
}
