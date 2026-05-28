"use client";
import { useEffect, useState } from "react";
import { Button, Snackbar, Alert } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushSubscribeButton() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    });
  }, []);

  const handleToggle = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setToast({ open: true, message: "이 브라우저는 푸시 알림을 지원하지 않습니다", severity: "error" });
      return;
    }

    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setSubscribed(false);
        setToast({ open: true, message: "알림이 해제되었습니다", severity: "success" });
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setToast({ open: true, message: "알림 권한이 거부되었습니다", severity: "error" });
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        const json = sub.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint, keys: json.keys }),
        });
        setSubscribed(true);
        setToast({ open: true, message: "알림이 활성화되었습니다", severity: "success" });
      }
    } catch {
      setToast({ open: true, message: "알림 설정 중 오류가 발생했습니다", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!("serviceWorker" in (typeof navigator !== "undefined" ? navigator : {}))) return null;

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={subscribed ? <NotificationsIcon /> : <NotificationsOffIcon />}
        onClick={handleToggle}
        disabled={loading}
        sx={{ borderRadius: 2, fontSize: "0.75rem" }}
      >
        {subscribed ? "알림 ON" : "알림 OFF"}
      </Button>
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );
}
