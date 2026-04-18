export const queryKeys = {
  auth: {
    root: ["auth"] as const,
    session: () => [...queryKeys.auth.root, "session"] as const,
  },
  home: {
    root: ["home"] as const,
    summary: () => [...queryKeys.home.root, "summary"] as const,
  },
};
