export const SESSION_KEYS = {
  token: "memberToken",
  userId: "memberUserId",
};

export function getSession() {
  if (typeof window === "undefined") return { token: "", userId: "" };
  return {
    token: window.localStorage.getItem(SESSION_KEYS.token) || "",
    userId: window.localStorage.getItem(SESSION_KEYS.userId) || "",
  };
}

export function setSession({ token, userId }) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(SESSION_KEYS.token, token);
  if (userId) window.localStorage.setItem(SESSION_KEYS.userId, String(userId));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEYS.token);
  window.localStorage.removeItem(SESSION_KEYS.userId);
}

