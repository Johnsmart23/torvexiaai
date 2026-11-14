const ACCOUNT_AUTH_DOMAIN = "accounts.investsphere.invalid";

export const normalizeUsername = (username: string) => username.trim().toLowerCase();

export const isValidUsername = (username: string) =>
  /^[a-z0-9][a-z0-9._-]{2,31}$/.test(normalizeUsername(username));

export const getAccountAuthEmail = (username: string) =>
  `${normalizeUsername(username)}@${ACCOUNT_AUTH_DOMAIN}`;
