/** Built-in portrait shown when a member has no upload and no owner default is saved yet. */
export const DEFAULT_MEMBER_AVATAR_PLACEHOLDER_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
      '<defs>' +
      '<linearGradient id="g" x1="0" x2="1" y1="0" y2="1">' +
      '<stop offset="0" stop-color="#75d7ff" stop-opacity=".24"/>' +
      '<stop offset=".5" stop-color="#0b1420"/>' +
      '<stop offset="1" stop-color="#43f5a7" stop-opacity=".16"/>' +
      '</linearGradient>' +
      '</defs>' +
      '<rect width="400" height="400" rx="72" fill="#0b1420"/>' +
      '<circle cx="200" cy="156" r="62" fill="url(#g)" stroke="#75d7ff" stroke-opacity=".42" stroke-width="6"/>' +
      '<path d="M92 332c18-58 62-92 108-92s90 34 108 92" fill="url(#g)" stroke="#75d7ff" stroke-opacity=".34" stroke-width="6"/>' +
      '</svg>'
  );