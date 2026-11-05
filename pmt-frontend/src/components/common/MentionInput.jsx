import React, { useState, useRef, useMemo } from 'react';
import { FiAtSign, FiPaperclip, FiSend, FiX } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MentionInput = ({
  members = [],
  placeholder = 'Write a message... Type @ to mention a team member',
  submitLabel = 'Post',
  rows = 3,
  projectId = null,
  taskId = null,
  discussionId = null,
  channelId = null,
  allowFiles = true,
  dropdownPosition = 'above',
  onSubmit,
  onTyping,
  autoFocus = false
}) => {
  const [text, setText] = useState('');
  const [mentions, setMentions] = useState([]);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const filteredMembers = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return members.filter((m) => {
      const full = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
      return full.includes(q) || (m.email || '').toLowerCase().includes(q);
    });
  }, [members, mentionQuery]);

  const detectMentionTrigger = (val, cursor) => {
    const uptoCursor = val.slice(0, cursor);
    const match = uptoCursor.match(/(?:^|\s)@([a-zA-Z0-9_ ]*)$/);
    if (match && !match[1].includes('  ') && match[1].split(' ').length <= 2) {
      const atPos = uptoCursor.lastIndexOf('@');
      setMentionStartIndex(atPos);
      setMentionQuery(match[1]);
      setHighlightIndex(0);
    } else {
      setMentionQuery(null);
      setMentionStartIndex(-1);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    detectMentionTrigger(val, e.target.selectionStart);
    if (onTyping) onTyping(val.length > 0);
  };

  const insertMention = (member) => {
    const fullName = `${member.firstName} ${member.lastName}`.trim();
    const el = textareaRef.current;
    const cursor = el ? el.selectionStart : text.length;
    const start = mentionStartIndex >= 0 ? mentionStartIndex : cursor;
    const before = text.slice(0, start);
    const after = text.slice(cursor);
    const nextText = `${before}@${fullName} ${after}`;

    setText(nextText);
    setMentions((prev) => (prev.includes(member._id) ? prev : [...prev, member._id]));
    setMentionQuery(null);
    setMentionStartIndex(-1);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const pos = before.length + fullName.length + 2;
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  const handleTriggerMentionButton = () => {
    const el = textareaRef.current;
    if (!el) return;
    const needsSpace = text.length > 0 && !text.endsWith(' ') && !text.endsWith('\n');
    const next = `${text}${needsSpace ? ' ' : ''}@`;
    setText(next);
    setMentionStartIndex(next.length - 1);
    setMentionQuery('');
    setHighlightIndex(0);
    el.focus();
  };

  const handleFileUpload = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setUploadingFile(true);
    try {
      for (const file of selected) {
        const formData = new FormData();
        formData.append('file', file);
        if (projectId) formData.append('projectId', projectId);
        if (taskId) formData.append('taskId', taskId);
        if (discussionId) formData.append('discussionId', discussionId);
        if (channelId) formData.append('channelId', channelId);

        const res = await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setStagedFiles((prev) => [...prev, res.data]);
      }
      toast.success('File attached');
    } catch (err) {
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e) => {
    if (mentionQuery !== null && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % filteredMembers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMembers[highlightIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if ((!text.trim() && stagedFiles.length === 0) || submitting || uploadingFile) return;

    setSubmitting(true);
    try {
      await onSubmit({
        content: text.trim(),
        mentions,
        attachments: stagedFiles.map((f) => f._id)
      });
      setText('');
      setMentions([]);
      setStagedFiles([]);
      setMentionQuery(null);
      if (onTyping) onTyping(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mention-input-container">
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <div className={`mention-dropdown ${dropdownPosition === 'below' ? 'below' : ''}`}>
          <div className="mention-dropdown-header">Mention Team Member</div>
          {filteredMembers.map((member, idx) => (
            <button
              key={member._id}
              type="button"
              className={`mention-option ${idx === highlightIndex ? 'active' : ''}`}
              onClick={() => insertMention(member)}
            >
              <span className="mention-option-avatar">
                {member.firstName?.charAt(0)?.toUpperCase()}
              </span>
              <span className="mention-option-meta">
                <span className="mention-option-name">
                  {member.firstName} {member.lastName}
                </span>
                <span className="mention-option-role">
                  {member.role?.replace('_', ' ')} • {member.email}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      <textarea
        ref={textareaRef}
        rows={rows}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="mention-textarea"
        autoFocus={autoFocus}
      />

      {stagedFiles.length > 0 && (
        <div className="staged-files-list">
          {stagedFiles.map((f) => (
            <span key={f._id} className="staged-file-pill">
              <FiPaperclip size={12} />
              <span>{f.originalName}</span>
              <button
                type="button"
                className="staged-file-remove"
                onClick={() => setStagedFiles((prev) => prev.filter((x) => x._id !== f._id))}
                title="Remove attachment"
              >
                <FiX size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="composer-toolbar">
        <div className="composer-tools-left">
          <button
            type="button"
            className="tool-icon-btn"
            onClick={handleTriggerMentionButton}
            title="Mention a team member (@)"
          >
            <FiAtSign size={14} />
            <span>Mention</span>
          </button>

          {allowFiles && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                type="button"
                className="tool-icon-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                title="Attach file"
              >
                <FiPaperclip size={14} />
                <span>{uploadingFile ? 'Uploading...' : 'Attach File'}</span>
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className="btn primary-btn btn-sm"
          onClick={handleSend}
          disabled={(!text.trim() && stagedFiles.length === 0) || submitting || uploadingFile}
        >
          <FiSend size={13} />
          <span>{submitting ? 'Sending...' : submitLabel}</span>
        </button>
      </div>
    </div>
  );
};

export default MentionInput;
