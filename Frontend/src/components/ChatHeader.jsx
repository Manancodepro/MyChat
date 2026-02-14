import { X, Clock } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ScheduleModal from "./ScheduleModal";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const handleScheduleClick = () => {
    setShowScheduleModal(true);
  };

  return (
    <>
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="avatar">
              <div className="size-10 rounded-full relative">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt={selectedUser.fullName}
                />
              </div>
            </div>

            {/* User info */}
            <div>
              <h3 className="font-medium">{selectedUser.fullName}</h3>
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(String(selectedUser._id))
                  ? "Online"
                  : "Offline"}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleScheduleClick}
              className="btn btn-circle btn-ghost btn-sm"
              title="Schedule Message"
            >
              <Clock size={20} />
            </button>
            <button
              onClick={() => setSelectedUser(null)}
              className="btn btn-circle btn-ghost btn-sm"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSchedule={async (scheduledDateTime) => {
          setIsScheduling(true);
          // This will be implemented in useChatStore
          try {
            const { scheduleMessage } = useChatStore.getState();
            await scheduleMessage({
              receiverId: selectedUser._id,
              scheduledTime: scheduledDateTime,
            });
            setShowScheduleModal(false);
          } catch (error) {
            console.error("Failed to schedule message:", error);
          } finally {
            setIsScheduling(false);
          }
        }}
        isLoading={isScheduling}
      />
    </>
  );
};
export default ChatHeader;
