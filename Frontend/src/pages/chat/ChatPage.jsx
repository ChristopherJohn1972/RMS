import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  MessageCircle, Send, Search, Phone, MoreVertical,
  CheckCheck, Plus, X,
} from 'lucide-react';

const ChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [tenantSearch, setTenantSearch] = useState('');
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const prevMsgCountRef = useRef(0);

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = useCallback(async (conversationId, silent = false) => {
    try {
      const res = await api.chat.getMessages(conversationId);
      const data = Array.isArray(res) ? res : res.results || [];
      if (!silent) {
        setMessages(data);
        prevMsgCountRef.current = data.length;
      } else if (data.length > prevMsgCountRef.current) {
        setMessages(data);
        prevMsgCountRef.current = data.length;
      }
    } catch {
      if (!silent) setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
      markAsRead(activeChat.id);
      prevMsgCountRef.current = 0;
      pollRef.current = setInterval(() => loadMessages(activeChat.id, true), 8000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChat?.id, loadMessages]);

  const loadConversations = async () => {
    try {
      const res = await api.chat.getConversations();
      const data = Array.isArray(res) ? res : res.results || [];
      setConversations(data);
      if (data.length > 0 && !activeChat) {
        setActiveChat(data[0]);
      }
    } catch { setConversations([]); }
  };

  const markAsRead = async (conversationId) => {
    try { await api.chat.markRead(conversationId); } catch {}
  };

  const filtered = conversations.filter(c =>
    c.other_user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChat) return;
    const text = message;
    setMessage('');
    try {
      const res = await api.chat.sendMessage(activeChat.id, text);
      setMessages(prev => [...prev, res]);
      prevMsgCountRef.current++;
      setConversations(prev => prev.map(c =>
        c.id === activeChat.id
          ? { ...c, last_message: { text, time: new Date().toISOString(), sender_id: user.uid } }
          : c
      ));
    } catch {
      toast.error('Failed to send message');
      setMessage(text);
    }
  };

  const openTenantChat = async (tenant) => {
    try {
      const res = await api.chat.createConversation(tenant.uid);
      const convo = {
        id: res.id,
        other_user: {
          uid: tenant.uid,
          name: tenant.name,
          role: tenant.role,
          property: tenant.property,
          avatar: tenant.avatar,
        },
        last_message: null,
        unread_count: 0,
      };
      setConversations(prev => {
        const exists = prev.find(c => c.id === convo.id);
        if (exists) return prev;
        return [convo, ...prev];
      });
      setActiveChat(convo);
      setShowNewChat(false);
      setMessages([]);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to start conversation';
      toast.error(msg);
    }
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    t.email.toLowerCase().includes(tenantSearch.toLowerCase())
  );

  const openNewChat = async () => {
    setShowNewChat(true);
    try {
      const res = await api.chat.getTenants();
      setTenants(Array.isArray(res) ? res : []);
    } catch { setTenants([]); }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isStaff = ['admin', 'staff', 'landlord', 'manager'].includes(user?.role);
  const activeConv = conversations.find(c => c.id === activeChat?.id);

  return (
    <div className="h-[calc(100vh-7rem)] lg:h-[calc(100vh-5.5rem)] -mx-4 lg:-mx-6 -mb-4 lg:-mb-6 flex">
      <div className={`${showSidebar ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-80 bg-white border-r border-gray-200 shrink-0`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Messages</h2>
            {isStaff && (
              <button onClick={openNewChat}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors">
                <Plus className="w-3.5 h-3.5" /> New
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search conversations..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="input-field pl-9" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-500 mb-3">No conversations yet</p>
              {isStaff && (
                <button onClick={openNewChat}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors">
                  <Plus className="w-4 h-4" /> Start a Conversation
                </button>
              )}
            </div>
          ) : filtered.map(c => {
            const other = c.other_user;
            if (!other) return null;
            const lastMsg = c.last_message;
            const isActive = activeChat?.id === c.id;
            return (
              <button key={c.id} onClick={() => { setActiveChat(c); setShowSidebar(false); setMessages([]); prevMsgCountRef.current = 0; }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${
                  isActive ? 'bg-blue-50' : ''
                }`}>
                <div className="relative shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">{other.avatar}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">{other.name}</p>
                    <span className="text-[10px] text-gray-400">{formatTime(lastMsg?.time)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{other.property || other.role}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{lastMsg?.text || 'Start a conversation'}</p>
                </div>
                {c.unread_count > 0 && (
                  <span className="shrink-0 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{c.unread_count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${!showSidebar ? 'flex' : 'hidden'} lg:flex flex-1 flex-col bg-gray-50`}>
        {activeConv ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-10">
              <button onClick={() => setShowSidebar(true)} className="lg:hidden p-1 text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-blue-600">{activeConv.other_user?.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{activeConv.other_user?.name}</p>
                <p className="text-xs text-gray-500">{activeConv.other_user?.property || activeConv.other_user?.role}</p>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Phone className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const senderId = String(msg.sender || '');
                const myId = String(user?.uid || '');
                const isMe = senderId === myId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] lg:max-w-[60%] ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                        : 'bg-white border border-gray-200 rounded-2xl rounded-bl-md'
                    } px-4 py-2.5`}>
                      <p className={`text-sm ${isMe ? 'text-white' : 'text-gray-800'}`}>{msg.text}</p>
                      <p className={`text-[10px] mt-1 flex items-center gap-1 ${
                        isMe ? 'text-blue-200' : 'text-gray-400'
                      }`}>
                        {formatTime(msg.created_at)}
                        {isMe && <CheckCheck className="w-3 h-3" />}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Type a message..." value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input-field flex-1" />
                <button type="submit" disabled={!message.trim()}
                  className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">Select a conversation</p>
              <p className="text-xs mt-1">Choose a tenant to message</p>
              {isStaff && (
                <button onClick={openNewChat}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors">
                  <Plus className="w-4 h-4" /> New Conversation
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">New Conversation</h3>
              <button onClick={() => { setShowNewChat(false); setTenantSearch(''); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search tenants..." value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)} className="input-field pl-9" autoFocus />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filteredTenants.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">No tenants found</div>
              ) : filteredTenants.map(t => (
                <button key={t.uid} onClick={() => openTenantChat(t)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-blue-600">{t.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                    <p className="text-xs text-gray-500 truncate">{t.property || t.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
