import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { chatApi } from '../../api/client';
import {
  MessageSquare,
  X,
  Send,
  Users,
  Briefcase,
  BookOpen,
  Repeat,
  Paperclip,
  Smile,
  ArrowLeft,
} from 'lucide-react';

const ChatFloatingWidget = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await chatApi.getConversations();
      if (res.data.success) {
        setConversations(res.data.conversations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  const loadMessages = async (conv) => {
    try {
      setActiveConv(conv);
      if (socket) {
        socket.emit('join_conversation', conv._id);
      }
      const res = await chatApi.getMessages(conv._id);
      if (res.data.success) {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time socket message reception
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (activeConv && activeConv._id === data.conversationId) {
        setMessages((prev) => [...prev, data.message]);
      }
      // Update conversation last message in list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === data.conversationId
            ? { ...c, lastMessage: data.message.text, lastMessageAt: new Date() }
            : c
        )
      );
    };

    const handleTyping = (data) => {
      if (activeConv && activeConv._id === data.conversationId) {
        setPartnerTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (activeConv && activeConv._id === data.conversationId) {
        setPartnerTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, activeConv]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    if (socket) {
      socket.emit('send_message', {
        conversationId: activeConv._id,
        senderId: user._id,
        text: msgText,
      });
      socket.emit('stop_typing', { conversationId: activeConv._id });
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (socket && activeConv) {
      socket.emit('typing', { conversationId: activeConv._id, userName: user.name });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-96 h-[560px] glass-card rounded-3xl shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      {/* Top Header */}
      <div className="h-16 px-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {activeConv && (
            <button
              onClick={() => setActiveConv(null)}
              className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white truncate max-w-[170px]">
              {activeConv ? activeConv.title || 'Conversation' : 'Campus Hub Chat'}
            </h4>
            <span className="text-[10px] text-emerald-400 font-medium">● Real-time active</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: Conversation List OR Active Thread */}
      {!activeConv ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-800/40">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 pb-1">
            Active Rooms & Channels
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No conversations yet. Join a project, study group, or connect with peers to start messaging!
            </div>
          ) : (
            conversations.map((conv) => {
              const otherParticipant = conv.participants?.find((p) => p._id !== user._id);
              const displayTitle = conv.title || otherParticipant?.name || 'Group Chat';

              return (
                <div
                  key={conv._id}
                  onClick={() => loadMessages(conv)}
                  className="p-3 rounded-2xl hover:bg-slate-800/70 cursor-pointer transition-all flex items-center gap-3 pt-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                    {conv.type === 'project' && <Briefcase className="w-5 h-5" />}
                    {conv.type === 'study_group' && <BookOpen className="w-5 h-5" />}
                    {conv.type === 'skill_swap' && <Repeat className="w-5 h-5" />}
                    {conv.type === 'direct' && <Users className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{displayTitle}</div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      {conv.lastMessage || 'No messages yet'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/40">
          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Start the conversation! Say hello 👋
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender?._id === user._id || msg.sender === user._id;

                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {!isMe && (
                      <span className="text-[10px] text-slate-400 ml-1 mb-0.5">
                        {msg.sender?.name || 'Member'}
                      </span>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-xs shadow-md shadow-indigo-600/20'
                          : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1">
                      {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })
            )}
            {partnerTyping && (
              <div className="text-[10px] text-indigo-400 italic">Someone is typing...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleInputChange}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all shadow-md shadow-indigo-600/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export { ChatFloatingWidget };
export default ChatFloatingWidget;
