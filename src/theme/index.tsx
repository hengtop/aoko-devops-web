import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { theme, type ThemeConfig } from "antd";
import { STORAGE_KEYS, THEME_DATA_ATTRIBUTE, THEME_MODES } from "@constants";

export type AppThemeMode = "dark" | "light";

type ThemeTogglePoint = {
  x: number;
  y: number;
};

type ThemeTransitionRipple = ThemeTogglePoint & {
  id: number;
  scale: number;
  background: string;
  ring: string;
  glow: string;
};

type AppThemeContextValue = {
  mode: AppThemeMode;
  isDark: boolean;
  isTransitioning: boolean;
  setThemeMode: (nextMode: AppThemeMode, point?: ThemeTogglePoint) => void;
  toggleTheme: (point?: ThemeTogglePoint) => void;
};

type ViewTransitionHandle = {
  ready: Promise<void>;
  finished: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransitionHandle;
};

type RippleStyle = React.CSSProperties & {
  "--theme-x": string;
  "--theme-y": string;
  "--theme-scale": string;
  "--theme-transition-bg": string;
  "--theme-transition-ring": string;
  "--theme-transition-glow": string;
};

const THEME_STORAGE_KEY = STORAGE_KEYS.THEME_MODE;
const THEME_TRANSITION_MS = 760;
const THEME_TRANSITION_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

const transitionPalette: Record<
  AppThemeMode,
  {
    background: string;
    ring: string;
    glow: string;
  }
> = {
  dark: {
    background: "#05070c",
    ring: "rgba(119, 230, 255, 0.74)",
    glow: "rgba(90, 158, 255, 0.28)",
  },
  light: {
    background: "#f7f1e8",
    ring: "rgba(91, 121, 214, 0.46)",
    glow: "rgba(95, 159, 193, 0.18)",
  },
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is AppThemeMode {
  return value === THEME_MODES.DARK || value === THEME_MODES.LIGHT;
}

function getInitialThemeMode(): AppThemeMode {
  if (typeof window === "undefined") {
    return THEME_MODES.DARK;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (isThemeMode(storedTheme)) {
    return storedTheme;
  }

  return THEME_MODES.DARK;
}

function applyThemeModeToDocument(mode: AppThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset[THEME_DATA_ATTRIBUTE] = mode;
  document.documentElement.style.colorScheme = mode;
}

function persistThemeMode(mode: AppThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
}

function getTransitionPoint(point?: ThemeTogglePoint): ThemeTogglePoint {
  if (point) {
    return point;
  }

  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }

  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
}

function getRevealRadius(point: ThemeTogglePoint) {
  if (typeof window === "undefined") {
    return 0;
  }

  const farthestX = Math.max(point.x, window.innerWidth - point.x);
  const farthestY = Math.max(point.y, window.innerHeight - point.y);

  return Math.ceil(Math.hypot(farthestX, farthestY));
}

const initialThemeMode = getInitialThemeMode();
applyThemeModeToDocument(initialThemeMode);

export function getAntdThemeConfig(mode: AppThemeMode): ThemeConfig {
  const isDark = mode === THEME_MODES.DARK;

  return {
    cssVar: {
      prefix: "aoko",
    },
    algorithm: [isDark ? theme.darkAlgorithm : theme.defaultAlgorithm, theme.compactAlgorithm],
    token: {
      fontFamily:
        '"SF Pro Display", "SF Pro Text", "PingFang SC", "Segoe UI", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      fontFamilyCode:
        '"SFMono-Regular", "JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace',
      colorPrimary: isDark ? "#5a9eff" : "#5b79d6",
      colorInfo: isDark ? "#77e6ff" : "#5f9fc1",
      colorSuccess: isDark ? "#49d39e" : "#2f8f68",
      colorWarning: isDark ? "#f0c66d" : "#b07a24",
      colorError: isDark ? "#ff8275" : "#c65f4d",
      colorBgBase: isDark ? "#07101b" : "#f4efe6",
      colorBgContainer: isDark ? "#0c1726" : "#fcf7ef",
      colorBgElevated: isDark ? "#101d2d" : "#fcf7f0",
      colorBgLayout: isDark ? "#08111d" : "#efe7db",
      colorBorder: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(98, 88, 73, 0.12)",
      colorBorderSecondary: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(98, 88, 73, 0.08)",
      colorFillSecondary: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(117, 102, 82, 0.05)",
      colorFillTertiary: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(117, 102, 82, 0.038)",
      colorText: isDark ? "#edf4ff" : "#2f2a24",
      colorTextSecondary: isDark ? "rgba(237, 244, 255, 0.68)" : "rgba(47, 42, 36, 0.72)",
      colorTextTertiary: isDark ? "rgba(237, 244, 255, 0.48)" : "rgba(47, 42, 36, 0.5)",
      borderRadius: 8,
      controlHeight: 38,
      boxShadow: isDark
        ? "0 20px 48px rgba(3, 8, 17, 0.28)"
        : "0 22px 50px rgba(79, 58, 32, 0.11)",
      boxShadowSecondary: isDark
        ? "0 16px 36px rgba(3, 8, 17, 0.22)"
        : "0 14px 34px rgba(79, 58, 32, 0.09)",
    },
    components: {
      Button: {
        borderRadius: 8,
        fontWeight: 600,
        primaryShadow: "none",
        defaultShadow: "none",
        defaultBg: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(117, 102, 82, 0.042)",
        defaultBorderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(98, 88, 73, 0.12)",
        defaultColor: isDark ? "#edf4ff" : "#2f2a24",
        defaultHoverBg: isDark ? "rgba(90, 158, 255, 0.08)" : "rgba(91, 121, 214, 0.08)",
        defaultHoverColor: isDark ? "#f5fbff" : "#201b16",
        defaultHoverBorderColor: isDark ? "rgba(122, 190, 255, 0.34)" : "rgba(93, 118, 182, 0.32)",
        defaultActiveBg: isDark ? "rgba(90, 158, 255, 0.12)" : "rgba(91, 121, 214, 0.12)",
        defaultActiveColor: isDark ? "#f5fbff" : "#201b16",
        defaultActiveBorderColor: isDark ? "rgba(122, 190, 255, 0.42)" : "rgba(93, 118, 182, 0.42)",
        textHoverBg: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(117, 102, 82, 0.055)",
        linkHoverBg: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(117, 102, 82, 0.055)",
        paddingInline: 16,
        paddingInlineLG: 18,
        contentFontSize: 13,
        contentFontSizeLG: 14,
      },
      Card: {
        headerBg: "transparent",
        headerFontSize: 15,
        headerHeight: 52,
        headerPadding: 20,
        headerPaddingSM: 16,
        bodyPadding: 20,
        bodyPaddingSM: 16,
      },
      Tabs: {
        titleFontSize: 13,
        horizontalItemGutter: 10,
        horizontalItemPadding: "8px 14px",
        cardPadding: "8px 14px",
        itemColor: isDark ? "rgba(237, 244, 255, 0.68)" : "rgba(47, 42, 36, 0.62)",
        itemHoverColor: isDark ? "#f5fbff" : "#201b16",
        itemSelectedColor: isDark ? "#f5fbff" : "#201b16",
        inkBarColor: isDark ? "#77e6ff" : "#5b79d6",
      },
      Form: {
        itemMarginBottom: 18,
        labelColor: isDark ? "rgba(237, 244, 255, 0.74)" : "rgba(47, 42, 36, 0.72)",
        labelFontSize: 13,
      },
      Input: {
        hoverBg: isDark ? "rgba(255, 255, 255, 0.045)" : "rgba(252, 247, 239, 0.9)",
        activeBg: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(252, 247, 240, 0.96)",
        hoverBorderColor: isDark ? "rgba(122, 190, 255, 0.24)" : "rgba(93, 118, 182, 0.24)",
        activeBorderColor: isDark ? "rgba(122, 190, 255, 0.4)" : "rgba(93, 118, 182, 0.42)",
        activeShadow: isDark ? "0 0 0 3px rgba(90, 158, 255, 0.16)" : "0 0 0 3px rgba(91, 121, 214, 0.13)",
        paddingBlock: 8,
        paddingBlockLG: 10,
        inputFontSize: 13,
      },
      Select: {
        selectorBg: isDark ? "rgba(255, 255, 255, 0.035)" : "rgba(251, 245, 237, 0.86)",
        hoverBorderColor: isDark ? "rgba(122, 190, 255, 0.24)" : "rgba(93, 118, 182, 0.24)",
        activeBorderColor: isDark ? "rgba(122, 190, 255, 0.4)" : "rgba(93, 118, 182, 0.42)",
        activeOutlineColor: isDark ? "rgba(90, 158, 255, 0.16)" : "rgba(91, 121, 214, 0.13)",
        optionSelectedBg: isDark ? "rgba(90, 158, 255, 0.18)" : "rgba(91, 121, 214, 0.12)",
        optionSelectedColor: isDark ? "#f5fbff" : "#2d3153",
        optionActiveBg: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(117, 102, 82, 0.055)",
        multipleItemBg: isDark ? "rgba(90, 158, 255, 0.14)" : "rgba(91, 121, 214, 0.1)",
        multipleItemBorderColor: isDark ? "rgba(122, 190, 255, 0.18)" : "rgba(93, 118, 182, 0.16)",
      },
      Table: {
        headerBg: isDark ? "rgba(255, 255, 255, 0.045)" : "rgba(104, 88, 65, 0.055)",
        headerColor: isDark ? "rgba(237, 244, 255, 0.74)" : "rgba(47, 42, 36, 0.72)",
        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(98, 88, 73, 0.08)",
        rowHoverBg: isDark ? "rgba(18, 31, 47, 0.9)" : "rgba(232, 223, 211, 0.92)",
        headerBorderRadius: 8,
        cellPaddingBlock: 14,
        cellPaddingInline: 16,
        cellPaddingBlockMD: 12,
        cellPaddingInlineMD: 14,
        cellPaddingBlockSM: 10,
        cellPaddingInlineSM: 12,
      },
      Tag: {
        defaultBg: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(117, 102, 82, 0.055)",
        defaultColor: isDark ? "#dceaff" : "#44382d",
      },
    },
  };
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppThemeMode>(initialThemeMode);
  const [transitionRipple, setTransitionRipple] = useState<ThemeTransitionRipple | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fallbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && fallbackTimerRef.current !== null) {
        window.clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  function clearTransitionTimer() {
    if (fallbackTimerRef.current === null) {
      return;
    }

    if (typeof window === "undefined") {
      fallbackTimerRef.current = null;
      return;
    }

    window.clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = null;
  }

  function commitThemeMode(nextMode: AppThemeMode) {
    applyThemeModeToDocument(nextMode);
    persistThemeMode(nextMode);
    setMode(nextMode);
  }

  function endTransition() {
    clearTransitionTimer();
    setTransitionRipple(null);
    setIsTransitioning(false);
  }

  function setThemeMode(nextMode: AppThemeMode, point?: ThemeTogglePoint) {
    if (nextMode === mode || isTransitioning) {
      return;
    }

    const origin = getTransitionPoint(point);
    const radius = getRevealRadius(origin);
    const transitionMeta = transitionPalette[nextMode];

    clearTransitionTimer();
    setIsTransitioning(true);
    setTransitionRipple({
      id: Date.now(),
      x: origin.x,
      y: origin.y,
      scale: Math.max(radius * 2, 1),
      background: transitionMeta.background,
      ring: transitionMeta.ring,
      glow: transitionMeta.glow,
    });

    const updateTheme = () => {
      flushSync(() => {
        commitThemeMode(nextMode);
      });
    };
    const viewTransition =
      typeof document === "undefined"
        ? undefined
        : (document as DocumentWithViewTransition).startViewTransition?.(updateTheme);

    if (viewTransition) {
      viewTransition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${origin.x}px ${origin.y}px)`,
                `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
              ],
            },
            {
              duration: THEME_TRANSITION_MS,
              easing: THEME_TRANSITION_EASING,
              pseudoElement: "::view-transition-new(root)",
            },
          );
        })
        .catch(() => undefined);

      viewTransition.finished.finally(endTransition);
      return;
    }

    updateTheme();
    if (typeof window !== "undefined") {
      fallbackTimerRef.current = window.setTimeout(endTransition, THEME_TRANSITION_MS);
    }
  }

  function toggleTheme(point?: ThemeTogglePoint) {
    setThemeMode(mode === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK, point);
  }

  const contextValue: AppThemeContextValue = {
    mode,
    isDark: mode === THEME_MODES.DARK,
    isTransitioning,
    setThemeMode,
    toggleTheme,
  };

  return (
    <AppThemeContext.Provider value={contextValue}>
      {children}
      {transitionRipple ? (
        <div
          key={transitionRipple.id}
          aria-hidden="true"
          className="themeTransitionRipple"
          style={
            {
              "--theme-x": `${transitionRipple.x}px`,
              "--theme-y": `${transitionRipple.y}px`,
              "--theme-scale": String(transitionRipple.scale),
              "--theme-transition-bg": transitionRipple.background,
              "--theme-transition-ring": transitionRipple.ring,
              "--theme-transition-glow": transitionRipple.glow,
            } as RippleStyle
          }
        />
      ) : null}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }

  return context;
}
