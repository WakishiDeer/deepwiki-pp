import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  autoIcons: {
    grayscaleOnDevelopment: false,
  },
  manifest: {
    name: "DeepWiki++",
    version: "0.1.0",
    description: "Enhanced browsing tool for DeepWiki",
    permissions: ["tabs", "storage", "activeTab"],
    host_permissions: ["https://github.com/*", "https://deepwiki.com/*"],
    action: {
      default_title: "DeepWiki++",
    },
  },
});
