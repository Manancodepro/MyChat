import { useChatStore } from "../store/useChatStore.js";
import Sidebar from "../components/Sidebar.jsx";
import NoChatSelected from "../components/NoChatSelected.jsx";
import ChatContainer from "../components/ChatContainer.jsx";

const HomePage = () => {
  const { selectedUser, setSelectedUser } = useChatStore();

  return (
    <div className="h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-base-200">
      {/* Desktop Layout - Side by side */}
      <div className="hidden md:flex items-center justify-center pt-4 px-2 md:pt-5 h-full">
        <div className="bg-base-100 rounded-lg shadow-lg w-full max-w-6xl h-full">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Layout - Full screen chat or sidebar */}
      <div className="flex md:hidden flex-col h-full">
        {!selectedUser ? (
          <div className="w-full h-full overflow-hidden">
            <Sidebar />
          </div>
        ) : (
          <ChatContainer onBack={() => setSelectedUser(null)} />
        )}
      </div>
    </div>
  );
};
export default HomePage;

