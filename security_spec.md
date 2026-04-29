# Firebase Security Specification

## 1. Data Invariants
- Site data must always contain header, features, video, and contactLinks.
- Only verified admins (by email or record) can modify site data.
- Public can read site data.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `{ "header": ... }` sent without auth. (Expected: Denied)
2. **Non-Admin Write**: Authenticated but not in admin list. (Expected: Denied)
3. **Ghost Field Injection**: Adding `isVerified: true` to site data. (Expected: Denied by key size/hasAll)
4. **Invalid Type**: Setting `header.title` to a number. (Expected: Denied)
5. **Oversized String**: Setting `header.description` to 10MB of text. (Expected: Denied by .size())
6. **Path Poisoning**: Attempting to write to `settings/../secret`. (Expected: Denied)
7. **Email Spoofing**: Auth with non-verified email matching admin string. (Expected: Denied by email_verified check)
8. **Resource Exhaustion**: Creating 1 million documents in `settings`. (Expected: Denied by path restriction)
9. **Admin Self-Promotion**: User trying to write their own record in `admins`. (Expected: Denied)
10. **Partial Update Gap**: Updating only one field without schema validation. (Expected: Denied)
11. **Illegal Character ID**: Using `!!!` as doc ID. (Expected: Denied by isValidId)
12. **Null Field**: Setting a required field to null. (Expected: Denied)

## 3. Deployment
Rules depend on `request.auth.token.email` matching `showroomvatlieutanphat@gmail.com`.
