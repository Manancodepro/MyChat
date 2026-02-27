import { useChatStore } from "../store/useChatStore.js";
import Sidebar from "../components/Sidebar.jsx";
import NoChatSelected from "../components/NoChatSelected.jsx";
import ChatContainer from "../components/ChatContainer.jsx";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <div className="h-screen bg-base-200">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-center pt-4 px-2 md:pt-5">
        <div className="bg-base-100 rounded-lg shadow-lg w-full max-w-6xl h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>

      {/* Mobile Layout - Responsive stacking */}
      <div className="flex md:hidden h-full">
        {!selectedUser ? (
          <div className="w-full h-full overflow-hidden">
            <Sidebar />
          </div>
        ) : (
          <div className="w-full h-full overflow-hidden">
            <ChatContainer />
          </div>
        )}
      </div>
    </div>
  );
};
export default HomePage;

