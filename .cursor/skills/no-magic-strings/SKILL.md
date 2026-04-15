---
name: no-magic-strings
description: Enforce a no-magic-string rule for this project by extracting stable hard-coded string values into src/constants before finishing any code change. Use when creating or editing TypeScript, TSX, JavaScript, routing, request-layer, store, theme, or page code that would otherwise introduce inline strings for statuses, routes, API paths, storage keys, headers, message keys, query keys, modes, tabs, labels, or other business constants.
---

# No Magic Strings

## Goal
- Keep project code free of hard-coded business strings.
- Reuse existing exports from `src/constants` before introducing new literals.
- Add new constants to `src/constants` when a required value does not already exist.

## Follow This Workflow
1. Scan the files you are creating or editing for newly introduced string literals.
2. Treat any stable business value as a constant candidate first, not an inline string.
3. Check whether an appropriate constant already exists in `src/constants`.
4. If it exists, import and use it.
5. If it does not exist, add it to the most appropriate file under `src/constants`.
6. If no current file fits the domain, create a new `src/constants/<domain>.ts` file and export it from `src/constants/index.ts`.
7. Replace inline literals in the implementation with the new or existing constant exports.
8. Before finishing, do one more pass for leftover magic strings in the changed files.

## Put Constants In The Right File
- `src/constants/api.ts`: API paths and API path builder functions
- `src/constants/routes.ts`: route paths, query keys, route builder functions
- `src/constants/request.ts`: request prefix, header names, content types, message keys
- `src/constants/status.ts`: statuses, types, modes, tabs, enum-like values
- `src/constants/storage.ts`: localStorage or sessionStorage keys
- `src/constants/theme.ts`: theme modes, theme attributes, fixed theme identifiers
- `src/constants/labels.ts`: label resolver functions based on constants
- `src/constants/options.ts`: UI option arrays derived from constants
- `src/constants/index.ts`: barrel export for shared constants

## Prefer These Patterns

### Enum-like string groups
Use an uppercase object with `as const`.

```ts
export const MESSAGE_READ_STATUSES = {
  UNREAD: "unread",
  READ: "read",
} as const;
```

### Types derived from constants
Do not duplicate string unions manually when they can come from constants.

```ts
export type MessageReadStatus =
  (typeof MESSAGE_READ_STATUSES)[keyof typeof MESSAGE_READ_STATUSES];
```

### Dynamic routes or API paths
Use builder functions instead of string concatenation inside feature code.

```ts
export function buildApprovalPolicyEditPath(policyId: string) {
  return `/approval/policy/${policyId}/edit`;
}
```

### Labels and options
Do not duplicate display mapping logic in pages or components. Build labels and options from constants in `labels.ts` or `options.ts`.

## Always Extract These Values
- Route paths such as `"/login"` or `"/approval/template"`
- API paths such as `"/template/create"`
- Storage keys such as `"aoko-theme-mode"`
- Request constants such as `"Authorization"` or `"application/json"`
- Status values such as `"approved"`, `"disable"`, `"draft"`
- Type or mode values such as `"email"`, `"password"`, `"detail"`
- Tab keys such as `"pending"` or `"done"`
- Query keys such as `"redirect"`
- Message keys such as `"auth-token-invalid"`
- Theme identifiers such as `"dark"` or `"light"`
- Any repeated branch condition that compares against a fixed string
- Any fixed value used across more than one file

## Exceptions
Only keep a string literal inline when it is not a business constant and moving it to `src/constants` would add noise rather than clarity.

Typical allowed exceptions:
- import specifiers
- local file paths
- Less or CSS syntax
- obvious one-off display copy that is truly local to a single page and not reused as a status, mode, label map, route, or key

If a literal might affect behavior, navigation, data matching, storage, request handling, filtering, or branching, do not keep it inline.

## Import Rules
- Prefer importing from `@constants` when the value is exported from `src/constants/index.ts`.
- Import from `@constants/<file>` when a direct file import is clearer or avoids an unnecessary barrel dependency.
- When you create a new constants file intended for reuse, add it to `src/constants/index.ts`.

## Project Examples

### Bad
```ts
navigate("/login");
```

### Good
```ts
navigate(APP_ROUTE_PATHS.LOGIN);
```

### Bad
```ts
localStorage.getItem("aoko-theme-mode");
```

### Good
```ts
localStorage.getItem(STORAGE_KEYS.THEME_MODE);
```

### Bad
```ts
if (record.status === "approved") {
  // ...
}
```

### Good
```ts
if (record.status === APPROVAL_INSTANCE_STATUSES.APPROVED) {
  // ...
}
```

### Bad
```ts
request.post("/template/create", {
  data: params,
});
```

### Good
```ts
request.post(API_PATHS.TEMPLATE_CREATE, {
  data: params,
});
```

## Completion Checklist
- Reused an existing constant when possible
- Added a new constant only in the right `src/constants` domain file
- Updated `src/constants/index.ts` if the new constant should be shared broadly
- Replaced inline business strings in the changed files
- Kept labels and option arrays derived from constants instead of duplicating literals
