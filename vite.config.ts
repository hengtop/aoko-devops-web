import { defineConfig, loadEnv } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const srcDir = resolve(projectRoot, "src");
const srcAliases = {
  "@assets": resolve(srcDir, "assets"),
  "@components": resolve(srcDir, "components"),
  "@constants": resolve(srcDir, "constants"),
  "@pages": resolve(srcDir, "pages"),
  "@router": resolve(srcDir, "router"),
  "@service": resolve(srcDir, "service"),
  "@store": resolve(srcDir, "store"),
  "@styles": resolve(srcDir, "styles"),
  "@theme": resolve(srcDir, "theme"),
  "@utils": resolve(srcDir, "utils"),
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const envDir = resolve(projectRoot, "config");
  const env = loadEnv(mode, envDir, "");
  const proxyTarget = env.VITE_PROXY_TARGET;

  return {
    envDir,
    resolve: {
      alias: srcAliases,
    },
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    server: {
      proxy: {
        "/aoko-devops": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
