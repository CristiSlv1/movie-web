"use client";

import { useEffect, useState } from "react";
import { getCurrentStatus, onStatusChange, ConnectionStatus } from "../utils/newtworkStatus";
import { syncQueue } from "../utils/offlineQueue";

export default function NetworkStatusBanner() {
  const [status, setStatus] = useState<ConnectionStatus>("online");
  const [debugInfo, setDebugInfo] = useState("");

  useEffect(() => {
    const setInitialStatus = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/health`;
        const res = await fetch(url);
        setDebugInfo(`Backend: ${url}, Status: ${res.status}`);
        const initialStatus = await getCurrentStatus();
        setStatus(initialStatus);
      } catch (err) {
        setDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    setInitialStatus();

    const unsubscribe = onStatusChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus === "online") {
        syncQueue();
      }
    });

    return () => unsubscribe();
  }, []);

  if (status === "online") return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center p-2 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <span>
          {status === "network-offline" ? "❌ No Internet Connection" : "⚠️ Backend Server Unavailable"}
        </span>
        <span className="text-xs opacity-80">{debugInfo}</span>
      </div>
    </div>
  );
}