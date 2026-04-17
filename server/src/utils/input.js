const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function normalizeString(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value !== null && value !== undefined && typeof value.toString === 'function') {
    return value.toString().trim();
  }

  return '';
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function sanitizeName(value) {
  return normalizeString(value).replace(/\s{2,}/g, ' ');
}

function sanitizeMessageText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS_PATTERN, '')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function isValidObjectId(value) {
  return OBJECT_ID_PATTERN.test(normalizeString(value));
}

function extractBearerToken(value) {
  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    return '';
  }

  const bearerMatch = normalizedValue.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) {
    return bearerMatch[1].trim();
  }

  return normalizedValue.includes(' ') ? '' : normalizedValue;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

function escapeRegex(value) {
  return normalizeString(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildConversationKey(...participantIds) {
  return participantIds
    .map((participantId) => normalizeString(participantId))
    .filter(Boolean)
    .sort()
    .join(':');
}

module.exports = {
  buildConversationKey,
  escapeRegex,
  extractBearerToken,
  isValidObjectId,
  normalizeEmail,
  normalizeString,
  parsePositiveInt,
  sanitizeMessageText,
  sanitizeName,
};
