export interface RouteAccess {
  requiresAuth?: boolean;
  requiredPermissions?: string[];
}

type AccessContext = {
  token: string | null;
  permissions: string[];
  access?: RouteAccess;
};

function hasRequiredPermissions(userPermissions: string[], requiredPermissions: string[] = []) {
  if (requiredPermissions.length === 0) {
    return true;
  }

  return requiredPermissions.every((permission) => userPermissions.includes(permission));
}

export function canAccessRoute({ token, permissions, access }: AccessContext) {
  const hasPermissionRequirement = (access?.requiredPermissions?.length ?? 0) > 0;
  const requiresProtection = Boolean(access?.requiresAuth) || hasPermissionRequirement;
  

  // 没要求的菜单？
  if (!requiresProtection) {
    return { allowed: true as const };
  }
 
  // 没登陆？
  if (!token) {
    return { allowed: false as const, reason: "unauthorized" as const };
  }
  

  // 没有权限？
  if (!hasRequiredPermissions(permissions, access?.requiredPermissions)) {
    return { allowed: false as const, reason: "forbidden" as const };
  }
  

  // 满足条件
  return { allowed: true as const };
}
