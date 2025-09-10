export const maskUsername = (username) => {
  if (!username) return '';
  const cleanUsername = username.replace('@', '');
  if (cleanUsername.length <= 4) return `@${cleanUsername}`;
  return `@${cleanUsername.slice(0, 3)}***${cleanUsername.slice(-1)}`;
}; 