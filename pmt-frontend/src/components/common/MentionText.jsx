import React from 'react';

const MentionText = ({ text = '', members = [] }) => {
  if (!text) return null;

  // Build regex for known full names and first names, fallback to @Word pattern
  const names = members
    .flatMap((m) => [
      `${m.firstName} ${m.lastName}`.trim(),
      m.firstName?.trim()
    ])
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  const pattern =
    names.length > 0
      ? new RegExp(`(@(?:${names.join('|')})|@[A-Za-z0-9_]+(?:\\s[A-Z][a-z]+)?)`, 'g')
      : /(@[A-Za-z0-9_]+(?:\s[A-Z][a-z]+)?)/g;

  const parts = String(text).split(pattern);

  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('@') && part.length > 1) {
          return (
            <span key={idx} className="mention-chip">
              {part}
            </span>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
};

export default MentionText;
