export {};

declare global {
  interface Window {
    electron: {
      getTodaysCommits: () => Promise<string[]>;
    };
  }
}
