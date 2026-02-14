import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const SocketDebug = () => {
  const { socket, onlineUsers } = useAuthStore();
  const { lastIncoming } = useChatStore();

  return (
    <div style={{position: 'fixed', right: 12, bottom: 12, zIndex: 9999}}>
      <div className="p-2 bg-base-200 text-sm rounded-md shadow-md w-72">
        <div className="font-medium">Socket Debug</div>
        <div className="mt-1">socket.id: <span className="font-mono">{socket?.id || '—'}</span></div>
        <div className="mt-1">onlineUsers ({onlineUsers?.length || 0}):</div>
        <div className="font-mono text-xs break-words">{JSON.stringify(onlineUsers)}</div>
        <div className="mt-2">lastIncoming:</div>
        <div className="font-mono text-xs break-words">{lastIncoming ? JSON.stringify(lastIncoming) : '—'}</div>
      </div>
    </div>
  );
};

export default SocketDebug;
