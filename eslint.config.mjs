import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * W1A-obs-2 logging-policy rules.
 *
 * Block the most common ways a secret leaks into logs:
 *   1. Object literals passed to console.* with a known-sensitive key
 *      (authorization, cookie, set-cookie, token, apiKey, privy, jwt,
 *      session, bearer, secret, password, etc).
 *   2. String literals starting with "Bearer " passed to console.*.
 *   3. Literal header names like "Set-Cookie:" passed to console.*.
 *
 * Escape hatch: use `safeLog(...)` from `lib/safeLog.ts` (redacts by
 * default), or add a narrow `// eslint-disable-next-line
 * no-restricted-syntax` with a reviewable comment explaining why.
 *
 * See docs/research/LOGGING_POLICY.md for examples.
 */
const SENSITIVE_KEY_PATTERN = "^(authorization|cookie|setCookie|set-?cookie|token|api[-_]?key|privy[-_]?token|jwt|bearer|secret|password|private[-_]?key|access[-_]?token|refresh[-_]?token|session[-_]?token|xApiKey|x-api-key|x-auth-token|privy)$";

const LOGGING_POLICY_RULES = {
    "no-restricted-syntax": [
        "error",
        {
            selector: `CallExpression[callee.type='MemberExpression'][callee.object.name='console'] Property[key.name=/${SENSITIVE_KEY_PATTERN}/i]`,
            message: "Do not log sensitive keys (authorization/cookie/token/apiKey/jwt/secret/password/privy). Use safeLog() from lib/safeLog.ts or strip the field before logging.",
        },
        {
            selector: `CallExpression[callee.type='MemberExpression'][callee.object.name='console'] Property[key.value=/${SENSITIVE_KEY_PATTERN}/i]`,
            message: "Do not log sensitive string-keyed fields. Use safeLog() from lib/safeLog.ts or strip the field before logging.",
        },
        {
            selector: "CallExpression[callee.type='MemberExpression'][callee.object.name='console'] Literal[value=/^Bearer\\s+[A-Za-z0-9]/]",
            message: "Do not log \"Bearer <token>\" literals. Strip the token or use safeLog().",
        },
        {
            selector: "CallExpression[callee.type='MemberExpression'][callee.object.name='console'] Literal[value=/^(Set-Cookie|Cookie):/i]",
            message: "Do not log Set-Cookie/Cookie header values. Use safeLog() which redacts them.",
        },
    ],
};

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        name: "operatoruplift/logging-policy",
        files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
        ignores: [
            "lib/safeLog.ts",
            "docs/**",
            "scripts/**",
            "tests/**",
        ],
        rules: LOGGING_POLICY_RULES,
    },
    globalIgnores([
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
]);

export default eslintConfig;
