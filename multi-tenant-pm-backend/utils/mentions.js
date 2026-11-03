const User = require('../models/User');

async function resolveMentions(text, orgId, senderId, explicitIds) {
  if (!orgId) return [];
  const orgMembers = await User.find({ orgId, isActive: true }).select('_id firstName lastName');
  const matched = new Set();

  if (Array.isArray(explicitIds)) {
    for (const id of explicitIds) {
      const idStr = id?.toString();
      if (idStr && orgMembers.some((m) => m._id.toString() === idStr)) {
        matched.add(idStr);
      }
    }
  }

  const raw = String(text || '');
  const lower = raw.toLowerCase();

  for (const member of orgMembers) {
    const fullHandle = `@${member.firstName} ${member.lastName}`.toLowerCase();
    const compactHandle = `@${member.firstName}${member.lastName}`.toLowerCase();
    const escapedFirst = `@${member.firstName}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (
      lower.includes(fullHandle) ||
      lower.includes(compactHandle) ||
      new RegExp(`(^|\\s)${escapedFirst}(\\b|\\s|$|[.,!?])`, 'i').test(raw)
    ) {
      matched.add(member._id.toString());
    }
  }

  if (senderId) {
    matched.delete(senderId.toString());
  }

  return Array.from(matched);
}

module.exports = { resolveMentions };
