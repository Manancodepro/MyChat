import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Clock, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

const ScheduledMessagesSection = () => {
  const {
    scheduledMessages,
    getScheduledMessages,
    cancelScheduledMessage,
  } = useChatStore();

  useEffect(() => {
    getScheduledMessages();
    // Refresh every 30 seconds
    const interval = setInterval(() => getScheduledMessages(), 30000);
    return () => clearInterval(interval);
  }, [getScheduledMessages]);

  if (scheduledMessages.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 text-gray-400">
        <Clock className="mx-auto mb-2 opacity-50 w-6 h-6 sm:w-8 sm:h-8" />
        <p className="text-xs sm:text-sm">No scheduled messages</p>
      </div>
    );
  }

  const handleCancel = async (messageId) => {
    if (window.confirm("Cancel this scheduled message?")) {
      await cancelScheduledMessage(messageId);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Clock size={18} className="sm:w-5 sm:h-5 text-orange-400" />
        <h3 className="text-sm sm:text-lg font-semibold">Scheduled Messages</h3>
        <span className="badge badge-xs sm:badge-sm">{scheduledMessages.length}</span>
      </div>

      <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
        {scheduledMessages.map((message) => (
          <div
            key={message._id}
            className="bg-slate-700/50 border border-slate-600 rounded-lg p-2 sm:p-4"
          >
            <div className="flex items-start justify-between mb-1 sm:mb-2 gap-1">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-blue-300 truncate">
                  To: {message.receiverId?.fullName || "Unknown"}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Clock size={12} className="flex-shrink-0" />
                  <span className="truncate">{new Date(message.scheduledTime).toLocaleString()}</span>
                </p>
              </div>
              <button
                onClick={() => handleCancel(message._id)}
                className="btn btn-xs sm:btn-sm btn-ghost text-red-400 hover:bg-red-900/30 flex-shrink-0"
                title="Cancel scheduled message"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>

            {message.text && (
              <p className="text-xs sm:text-sm text-gray-200 mb-1 sm:mb-2 truncate">
                {message.text}
              </p>
            )}

            {message.image && (
              <div className="text-xs text-gray-400 flex items-center gap-1">
                📎 Attachment included
              </div>
            )}

            <div className="mt-1 sm:mt-2 flex items-center gap-1">
              <span className="text-xs bg-orange-900/40 text-orange-300 px-2 py-0.5 sm:py-1 rounded">
                Scheduled
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScheduledMessagesSection;
