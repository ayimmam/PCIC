## Summary

This PR implements the Disciplinary Strike System with threshold flagging for the PCIC management system. It introduces the ability for authorized leaders to issue strikes to members, track strike history, and automatically flag members who cross specific disciplinary thresholds.

## Changes

- [x] Frontend changes
- [x] Backend changes
- [x] New API endpoints
- [x] Database model changes

## Related Issue

<!-- Link to issue, e.g. Closes #12 -->

## How to Test

1. Log in as an administrator (President/Vice President).
2. Navigate to the Members page and select a member to view their detail page.
3. Click on the "Assign Strike" button and fill out the strike form (reason, severity).
4. Verify that the strike appears in the member's Strike History tab.
5. Search and filter strikes using the new Strike Search feature.
6. Verify access controls (ensuring non-leadership roles bypass or are denied strike creation).
7. Check the strike thresholds logic ensuring a member gets properly flagged when exceeding predefined limits.

## Screenshots (if UI changes)

<!-- Paste screenshots here -->

## Checklist

- [x] Code follows project conventions (JSX, ES modules, Tailwind)
- [x] No TypeScript syntax in any files
- [x] API errors are handled with try/catch
- [x] Tested locally — frontend and backend both work
- [x] No `console.log` left in production code (except server startup)
