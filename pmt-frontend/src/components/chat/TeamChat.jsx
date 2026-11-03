import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import {
  FiHash,
  FiPlus,
  FiSearch,
  FiCornerUpLeft,
  FiTrash2,
  FiX,
  FiUsers,
  FiMessageSquare
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import Modal from '../common/Modal';
import MentionInput from '../common/MentionInput';
import MentionText from '../common/MentionText';
import AttachmentChip from '../files/AttachmentChip';
import api from '../../services/api';
import toast from 'react-hot-toast';
import '../../styles/pages/collaboration.css';

const TeamChat = () => {
  const { user } = useAuth();
  const { onlineUserIds, subscribe, sendWsEvent } = useRealtime();
  const currentUserId = user?._id || user?.id;
  const isAdmin = ['admin', 'super_admin'].includes(user?.role);

  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});

  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [channelForm, setChannelForm] = useState({
    name: '',
    description: '',
    projectId: ''
  });

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchInitialChatData();
  }, []);

  useEffect(() => {
    if (activeChannelId) {
      fetchChannelMessages(activeChannelId);
      setReplyTo(null);
      setSearchQuery('');
    }
  }, [activeChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChannelId]);

  useEffect(() => {
    const unsubMsg = subscribe('chat:message', (evt) => {
      if (!evt.message) return;
      if (evt.channelId === activeChannelId) {
        setMessages((prev) =>
          prev.some((m) => m._id === evt.message._id) ? prev : [...prev, evt.message]
        );
      }
      setChannels((prev) =>
        prev.map((c) =>
          c._id === evt.channelId
            ? {
                ...c,
                lastMessage: {
                  _id: evt.message._id,
                  content: evt.message.content,
                  createdAt: evt.message.createdAt,
                  senderName: evt.message.sender?.firstName || 'Member'
                }
              }
            : c
        )
      );
    });

    const unsubDel = subscribe('chat:message_deleted', (evt) => {
      if (evt.channelId === activeChannelId) {
        setMessages((prev) => prev.filter((m) => m._id !== evt.messageId));
      }
    });

    const unsubChan = subscribe('chat:channel_created', (evt) => {
      if (!evt.channel) return;
      setChannels((prev) =>
        prev.some((c) => c._id === evt.channel._id) ? prev : [...prev, evt.channel]
      );
    });

    const unsubTyping = subscribe('chat:typing', (evt) => {
      if (evt.channelId !== activeChannelId || evt.userId === currentUserId) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (evt.isTyping) {
          next[evt.userId] = evt.userName;
        } else {
          delete next[evt.userId];
        }
        return next;
      });
    });

    return () => {
      unsubMsg();
      unsubDel();
      unsubChan();
      unsubTyping();
    };
  }, [activeChannelId, currentUserId, subscribe]);

  const fetchInitialChatData = async () => {
    setLoading(true);
    try {
      const [channelsRes, usersRes, projectsRes] = await Promise.all([
        api.get('/chat/channels'),
        api.get('/users?activeOnly=true'),
        api.get('/projects')
      ]);

      const chanList = Array.isArray(channelsRes.data?.channels)
        ? channelsRes.data.channels
        : [];
      setChannels(chanList);
      setMembers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);

      if (chanList.length > 0) {
        const general = chanList.find((c) => c.name === 'general') || chanList[0];
        setActiveChannelId(general._id);
      }
    } catch {
      toast.error('Failed to load team chat');
    } finally {
      setLoading(false);
    }
  };

  const fetchChannelMessages = async (channelId) => {
    setLoadingMessages(true);
    setTypingUsers({});
    try {
      const res = await api.get(`/chat/channels/${channelId}/messages`);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load channel messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async ({ content, mentions, attachments }) => {
    if (!activeChannelId) return;
    try {
      const res = await api.post(`/chat/channels/${activeChannelId}/messages`, {
        content,
        mentions,
        attachments,
        replyToId: replyTo?._id || null
      });
      setMessages((prev) =>
        prev.some((m) => m._id === res.data._id) ? prev : [...prev, res.data]
      );
      setReplyTo(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
      throw err;
    }
  };

  const handleTyping = (isTyping) => {
    if (!activeChannelId) return;
    sendWsEvent({ type: 'chat:typing', channelId: activeChannelId, isTyping });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        sendWsEvent({ type: 'chat:typing', channelId: activeChannelId, isTyping: false });
      }, 2500);
    }
  };

  const handleOpenDM = async (teammate) => {
    try {
      const res = await api.post('/chat/dm', { targetUserId: teammate._id });
      const dmChannel = res.data;
      setChannels((prev) =>
        prev.some((c) => c._id === dmChannel._id) ? prev : [dmChannel, ...prev]
      );
      setActiveChannelId(dmChannel._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start direct message');
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!channelForm.name.trim()) return;
    try {
      const res = await api.post('/chat/channels', channelForm);
      setChannels((prev) =>
        prev.some((c) => c._id === res.data._id) ? prev : [...prev, res.data]
      );
      setActiveChannelId(res.data._id);
      setChannelForm({ name: '', description: '', projectId: '' });
      setShowCreateChannel(false);
      toast.success(`Channel #${res.data.name} created!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create channel');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await api.delete(`/chat/messages/${msgId}`);
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const publicChannels = useMemo(
    () => channels.filter((c) => c.type === 'channel'),
    [channels]
  );

  const otherMembers = useMemo(
    () => members.filter((m) => m._id !== currentUserId),
    [members, currentUserId]
  );

  const activeChannel = channels.find((c) => c._id === activeChannelId) || null;

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content?.toLowerCase().includes(q) ||
        `${m.sender?.firstName || ''} ${m.sender?.lastName || ''}`.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  const activeTypingNames = Object.values(typingUsers);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="team-chat-wrapper">
      <div className="team-chat-page">
        {/* Left Sidebar: Channels + Teammate Direct Messages */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-section">
            <div className="chat-sidebar-heading">
              <span>Channels</span>
              <button
                type="button"
                className="tool-icon-btn"
                style={{ padding: '2px 6px' }}
                onClick={() => setShowCreateChannel(true)}
                title="Create new channel"
              >
                <FiPlus size={13} />
              </button>
            </div>

            {publicChannels.map((chan) => (
              <button
                key={chan._id}
                type="button"
                className={`chat-nav-btn ${activeChannelId === chan._id ? 'active' : ''}`}
                onClick={() => setActiveChannelId(chan._id)}
              >
                <span className="chat-nav-left">
                  <FiHash size={15} />
                  <span>{chan.name}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="chat-sidebar-section" style={{ borderTop: '1px solid #e2e8f0' }}>
            <div className="chat-sidebar-heading">
              <span>Direct Messages</span>
              <span>{onlineUserIds.length} online</span>
            </div>

            {otherMembers.map((member) => {
              const existingDm = channels.find(
                (c) =>
                  c.type === 'dm' &&
                  c.participants?.some((p) => (p._id || p) === member._id)
              );
              const isSelected = existingDm && activeChannelId === existingDm._id;
              const isOnline = onlineUserIds.includes(member._id);

              return (
                <button
                  key={member._id}
                  type="button"
                  className={`chat-nav-btn ${isSelected ? 'active' : ''}`}
                  onClick={() =>
                    existingDm ? setActiveChannelId(existingDm._id) : handleOpenDM(member)
                  }
                >
                  <span className="chat-nav-left">
                    <span className={`presence-dot ${isOnline ? 'online' : ''}`} />
                    <span>
                      {member.firstName} {member.lastName}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Chat Stream */}
        <div className="chat-main">
          {activeChannel ? (
            <>
              <div className="chat-main-header">
                <div>
                  <div className="chat-header-title">
                    {activeChannel.type === 'dm' ? (
                      <>
                        <span
                          className={`presence-dot ${
                            onlineUserIds.includes(activeChannel.dmPartner?._id)
                              ? 'online'
                              : ''
                          }`}
                        />
                        <span>{activeChannel.displayName}</span>
                      </>
                    ) : (
                      <>
                        <FiHash size={18} style={{ color: '#2563eb' }} />
                        <span>{activeChannel.name}</span>
                      </>
                    )}
                  </div>
                  <div className="chat-header-subtitle">
                    {activeChannel.type === 'dm'
                      ? `${activeChannel.dmPartner?.role?.replace('_', ' ') || 'Team Member'} • Direct 1:1 conversation`
                      : activeChannel.description || 'Team collaboration channel'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="search-box" style={{ maxWidth: '210px', marginBottom: 0 }}>
                    <FiSearch className="search-icon" />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingTop: '6px', paddingBottom: '6px', fontSize: '12.5px' }}
                    />
                  </div>
                  {activeChannel.type === 'channel' && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <FiUsers size={14} />
                      {members.length}
                    </span>
                  )}
                </div>
              </div>

              <div className="chat-messages-stream">
                {loadingMessages ? (
                  <div className="text-muted">Loading messages...</div>
                ) : filteredMessages.length === 0 ? (
                  <div className="empty-state" style={{ margin: 'auto' }}>
                    <FiMessageSquare className="empty-state-icon" />
                    <h3>
                      {searchQuery
                        ? 'No matching messages'
                        : `Start chatting in ${
                            activeChannel.type === 'dm'
                              ? activeChannel.displayName
                              : `#${activeChannel.name}`
                          }`}
                    </h3>
                    <p>Send a message, @mention a teammate, or share a file below.</p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const canDelete =
                      isAdmin || (msg.sender?._id && msg.sender._id === currentUserId);
                    return (
                      <div key={msg._id} className="chat-msg-row">
                        <div className="chat-msg-avatar">
                          {msg.sender?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>

                        <div className="chat-msg-content-wrap">
                          <div className="chat-msg-meta">
                            <span className="chat-msg-sender">
                              {msg.sender
                                ? `${msg.sender.firstName} ${msg.sender.lastName}`
                                : 'Member'}
                            </span>
                            <span className="chat-msg-time">
                              {format(new Date(msg.createdAt), 'MMM d, h:mm a')}
                            </span>
                          </div>

                          {msg.replyTo && (
                            <div className="chat-msg-quote">
                              <strong>{msg.replyTo.senderName}:</strong>{' '}
                              {msg.replyTo.content?.slice(0, 90)}
                            </div>
                          )}

                          {msg.content && (
                            <div className="chat-msg-text">
                              <MentionText text={msg.content} members={members} />
                            </div>
                          )}

                          {msg.attachments?.length > 0 && (
                            <div className="attachments-row">
                              {msg.attachments.map((f) => (
                                <AttachmentChip key={f._id} file={f} />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="chat-msg-hover-actions">
                          <button
                            type="button"
                            className="attachment-action-link"
                            title="Reply to message"
                            onClick={() => setReplyTo(msg)}
                          >
                            <FiCornerUpLeft size={14} />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              className="attachment-action-link"
                              style={{ color: '#ef4444' }}
                              title="Delete message"
                              onClick={() => handleDeleteMessage(msg._id)}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-typing-bar">
                {activeTypingNames.length > 0 &&
                  `${activeTypingNames.join(', ')} ${
                    activeTypingNames.length === 1 ? 'is' : 'are'
                  } typing...`}
              </div>

              <div className="chat-composer-wrap">
                {replyTo && (
                  <div className="replying-banner">
                    <span>
                      Replying to{' '}
                      <strong>
                        {replyTo.sender?.firstName} {replyTo.sender?.lastName}
                      </strong>
                      : "{replyTo.content?.slice(0, 70)}"
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#1e40af'
                      }}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                )}

                <MentionInput
                  members={members}
                  rows={2}
                  channelId={activeChannel._id}
                  projectId={activeChannel.project?._id || null}
                  submitLabel="Send"
                  onTyping={handleTyping}
                  placeholder={
                    activeChannel.type === 'dm'
                      ? `Message ${activeChannel.displayName}... (Ctrl+Enter to send)`
                      : `Message #${activeChannel.name}... Type @ to mention teammates`
                  }
                  onSubmit={handleSendMessage}
                />
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <FiMessageSquare className="empty-state-icon" />
              <h3>Select a channel or teammate</h3>
            </div>
          )}
        </div>
      </div>

      {/* Create New Channel Modal */}
      <Modal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        title="Create Team Channel"
        size="small"
      >
        <form onSubmit={handleCreateChannel} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Channel Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., qa-testing or mobile-v2"
              value={channelForm.name}
              onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Topic / Description</label>
            <input
              type="text"
              className="form-input"
              placeholder="What is this channel about?"
              value={channelForm.description}
              onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Link to Project (Optional)</label>
            <select
              className="form-input"
              value={channelForm.projectId}
              onChange={(e) => setChannelForm({ ...channelForm, projectId: e.target.value })}
            >
              <option value="">Workspace-wide</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn secondary-btn"
              onClick={() => setShowCreateChannel(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary-btn">
              Create Channel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamChat;
