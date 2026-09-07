import {
  ArrowLeft,
  PlusCircle,
  SendHorizonal,
  SquareChevronLeft,
  SquareChevronRight,
  User,
  UserRoundMinus,
  UserRoundPlus,
  Users,
  X,
} from "lucide-react";
import { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../context/user.context.jsx";
import Markdown from "markdown-to-jsx";
import { useNavigate } from "react-router-dom";

function SyntaxHighlightedCode(props) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && props.className?.includes("lang-") && window.hljs) {
      window.hljs.highlightElement(ref.current);
      ref.current.removeAttribute("data-highlighted");
    }
  }, [props.className, props.children]);
  return <code {...props} ref={ref} />;
}

function WriteAiMessage(message) {
  let text = message;
  try {
    const messageObject = JSON.parse(message);
    text = messageObject.text ?? message;
  } catch (error) {
    text = message;
  }
  return (
    <div className="overflow-auto bg-zinc-900 text-white rounded-sm p-2">
      <Markdown
        children={text}
        options={{ overrides: { code: SyntaxHighlightedCode } }}
      />
    </div>
  );
}

const LeftSection = ({
  setModalOpen,
  projectData,
  messages,
  onSendMessage,
  onRemoveCollaborator,
}) => {
  const { userdata } = useContext(UserContext);
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [showSidePanel, setShowSidePanel] = useState(false); // controls the visibility of the side panel for adding collaborators
  const [showPanel, setShowPanel] = useState(false); // controls the visibility of the left section panel
  const messageBox = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current)
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    };
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    onSendMessage(message, userdata);
    setMessage("");
  };

  const isProjectOwner =
    String(projectData.projectOwner) === String(userdata?._id);

  const isAiMessage = (msg) =>
    msg.senderType === "ai" || msg.sender?._id === "soen_ai";
  const getInitials = (username) => {
    return String(username ?? "")
      .split(/[_\s-]+/) // split on underscore, space, or dash
      .filter(Boolean) // remove empty strings (e.g. leading/trailing separators)
      .map((part) => part.charAt(0).toLowerCase())
      .join("");
  };

  if (showPanel) {
    // if the left section panel is open, show a compact version of the left section
    return (
      <section className="left h-full min-h-0 w-9 sm:w-14 bg-zinc-800/70 backdrop-blur-sm flex flex-col gap-2 justify-center items-center relative border-r border-white/10">
        <header className="flex justify-center items-center gap-3 py-2 px-4 sm:px-6 w-full border-b border-white/10 bg-zinc-800/80">
          <div
            onClick={() => setShowPanel(false)}
            className="h-4 sm:h-6 w-4 sm:w-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
          >
            <SquareChevronRight size={18} />
          </div>
        </header>
        <div className="">
          <button
            onClick={() => setModalOpen(true)}
            className="h-5 sm:h-8 w-5 sm:w-8 flex items-center justify-center bg-yellow-500 text-black rounded-xl text-sm font-medium cursor-pointer hover:bg-yellow-400 transition-colors"
          >
            <PlusCircle size={16} />
          </button>
        </div>
        <div className="users flex flex-col gap-2 overflow-y-auto grow scrollbar-hide">
          {projectData.users &&
            projectData.users.map((user, i) => {
              const isMe = user.email == userdata.email;
              return (
                <div
                  key={i}
                  className={`h-6 sm:h-8 w-6 sm:w-8 flex items-center justify-between rounded-xl border transition-colors ${isMe ? "bg-yellow-500/10 border-yellow-500/20" : "bg-zinc-900/60 border-white/5 hover:bg-zinc-700/50"}`}
                >
                  <div className="flex gap-2.5 items-center min-w-0">
                    <div className="h-6 sm:h-8 w-6 sm:w-8 rounded-full flex items-center justify-center shrink-0">
                      {getInitials(user.username ?? user.email)}
                    </div>
                    {/* <div className="min-w-0">
                                        <h1 className="text-sm truncate">{user.username}</h1>
                                        {isMe && <p className="text-[10px] text-yellow-500/80">You</p>}
                                    </div> */}
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    );
  }

  return (
    <section className="left h-full min-h-0 w-full sm:w-95 md:w-85 lg:w-[25%] shrink-0 bg-zinc-800/70 backdrop-blur-sm flex flex-col relative border-r border-white/10">
      <header className="flex justify-between items-center gap-3 py-1.5 px-4 w-full border-b border-white/10 bg-zinc-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            onClick={() => {
              navigate("/");
            }}
            className="h-7 w-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={18} />
          </div>
          <h2 className="font-semibold text-sm truncate uppercase">
            {projectData?.name}
          </h2>
        </div>
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            onClick={() => setShowSidePanel(true)}
            className="h-7 w-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
          >
            <UserRoundPlus size={18} />
          </div>
          <div
            onClick={() => setShowPanel((prev) => !prev)}
            className="h-7 w-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
          >
            <SquareChevronLeft size={18} />
          </div>
        </div>
      </header>
      <conversation-area className="w-full grow flex flex-col min-h-0">
        <div
          ref={messageBox}
          className="message-box p-2 grow flex flex-col gap-1.5 overflow-auto max-h-full scrollbar-hide"
        >
          {messages.map((msg, index) => (
            <div
              key={msg._id ?? index}
              className={`${isAiMessage(msg) ? "max-w-[80%]" : "max-w-[60%]"} ${!isAiMessage(msg) && msg.sender?._id == userdata._id.toString() && "ml-auto"} message flex flex-col p-1 px-2 bg-zinc-700/50 w-fit rounded-xl`}
            >
              <small
                className={`opacity-65 text-[10px] ${isAiMessage(msg) ? "text-yellow-500" : ""}`}
              >
                {isAiMessage(msg) ? "soen" : msg.sender?.username}
              </small>
              <div className="text-sm">
                {isAiMessage(msg) ? (
                  WriteAiMessage(msg.message)
                ) : (
                  <p>{msg.message}</p>
                )}
              </div>
              <div ref={messagesEndRef} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full px-3 sm:px-4 py-3 border-t border-white/10 bg-zinc-800/80">
          <input
            type="text"
            placeholder="Enter your message.."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            className="flex-1 min-w-0 outline-none border border-white/10 bg-zinc-900 rounded-xl py-2.5 px-4 text-sm placeholder-zinc-500 focus:border-yellow-500/50 transition-colors"
          />
          <div
            onClick={handleSendMessage}
            className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-yellow-500 hover:bg-yellow-400 active:scale-95 transition-all cursor-pointer text-black"
          >
            <SendHorizonal size={18} />
          </div>
        </div>
      </conversation-area>
      {showSidePanel && (
        <side-panel className="absolute left-0 top-0 w-full h-full bg-zinc-800 flex flex-col z-10">
          <header className="flex justify-between items-center gap-3 py-1.5 px-4 sm:px-6 w-full border-b border-white/10">
            <h2 className="font-semibold text-base truncate uppercase">
              {projectData.name}
            </h2>
            <div
              onClick={() => setShowSidePanel(false)}
              className="h-7 w-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
            >
              <X size={16} />
            </div>
          </header>

          <div className="p-4 sm:p-5">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-yellow-500 text-black w-full rounded-xl py-2.5 px-4 text-sm font-medium cursor-pointer hover:bg-yellow-400 transition-colors"
            >
              <PlusCircle size={16} />
              <p className="">Add Collaborator</p>
            </button>
          </div>

          <div className="users flex flex-col gap-2 px-4 sm:px-5 pb-5 overflow-y-auto grow">
            {projectData.users &&
              projectData.users.map((user, i) => {
                const isMe = user.email == userdata.email;
                return (
                  <div
                    key={i}
                    className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl border transition-colors ${isMe ? "bg-yellow-500/10 border-yellow-500/20" : "bg-zinc-900/60 border-white/5 hover:bg-zinc-700/50"}`}
                  >
                    <div className="flex gap-2.5 items-center min-w-0">
                      <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                        <User size={14} />
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-sm truncate flex gap-1 items-center">
                          {user.username}
                          {isMe && (
                            <p className="text-sm text-yellow-500/80">(You)</p>
                          )}
                        </h1>
                        <h1 className="text-xs text-zinc-400">{user.email}</h1>
                      </div>
                    </div>
                    {isProjectOwner && user.email !== userdata.email && (
                      <div
                        onClick={() => onRemoveCollaborator(user)}
                        className="h-7 w-7 rounded-full flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
                      >
                        <UserRoundMinus size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </side-panel>
      )}
    </section>
  );
};

export default LeftSection;
