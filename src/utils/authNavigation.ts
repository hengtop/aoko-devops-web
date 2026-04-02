export const LOGIN_PATH = "/login";
export const LOGIN_REDIRECT_QUERY_KEY = "redirect";

type RouteLocationLike = {
  pathname?: string;
  search?: string;
  hash?: string;
};

function normalizeRedirectTarget(target: string | null | undefined) {
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return null;
  }

  if (target === LOGIN_PATH || target.startsWith(`${LOGIN_PATH}?`)) {
    return null;
  }

  return target;
}

export function buildRoutePath(location?: RouteLocationLike | null) {
  if (!location?.pathname) {
    return "/";
  }

  return `${location.pathname}${location.search ?? ""}${location.hash ?? ""}`;
}

export function buildLoginPath(redirectTarget?: string | null) {
  const normalizedRedirectTarget = normalizeRedirectTarget(redirectTarget);

  if (!normalizedRedirectTarget) {
    return LOGIN_PATH;
  }

  const searchParams = new URLSearchParams({
    [LOGIN_REDIRECT_QUERY_KEY]: normalizedRedirectTarget,
  });

  return `${LOGIN_PATH}?${searchParams.toString()}`;
}

export function resolveLoginRedirectTarget(search: string, fallbackLocation?: RouteLocationLike | null) {
  const searchParams = new URLSearchParams(search);
  const redirectTarget = normalizeRedirectTarget(searchParams.get(LOGIN_REDIRECT_QUERY_KEY));

  if (redirectTarget) {
    return redirectTarget;
  }

  return normalizeRedirectTarget(buildRoutePath(fallbackLocation)) ?? null;
}

export function resolveCurrentRoutePath() {
  if (typeof window === "undefined") {
    return "/";
  }

  return buildRoutePath(window.location);
}
