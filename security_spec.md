# Security Specification: Math Fighter Online

## Data Invariants
1. A user profile cannot be created with a UID different from the authenticated user.
2. A match must have exactly two slots for players when active.
3. HP cannot exceed 100 or be less than 0.
4. Total wins can only be incremented by the match winner during match conclusion.
5. Players can only update their own sub-state within a match document.

## The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Attempt to create a user profile for another UID.
2. **God Mode**: Attempt to update own HP to 1000 in a match.
3. **Insta-Kill**: Attempt to update opponent's HP to 0.
4. **Shadow Field**: Attempt to add `isAdmin: true` to user profile.
5. **Win Theft**: Attempt to increment `totalWins` without winning a match.
6. **Move Spam**: Attempt to perform an attack without solving a math problem (hard to prove, but we can enforce timestamp/cooldown).
7. **Room Hijack**: Attempt to change the `status` of an active match when not participating.
8. **Invalid ID**: Document ID with malicious 1KB string.
9. **Role Escalation**: Attempt to delete another user's profile.
10. **State Shortcut**: Move match from `waiting` directly to `finished` with self as winner.
11. **PII Leak**: Attempt to read private user fields (if any).
12. **Recursive Cost Attack**: Massive list queries.

## Validation Strategy
- Use `isValidUser` to check profile shape.
- Use `isValidMatch` to check game state integrity.
- Use `affectedKeys().hasOnly()` to restrict updates to specific actions (Join, Attack, Finish).
