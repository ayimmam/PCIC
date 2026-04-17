export const STRIKE_THRESHOLD = 3;

export function isMemberFlagged(memberOrStrikeCount = 0, maybeStrikeCount = 0) {
    const member = typeof memberOrStrikeCount === "object" && memberOrStrikeCount !== null
        ? memberOrStrikeCount
        : {};
    const strikeCount = typeof memberOrStrikeCount === "number"
        ? memberOrStrikeCount
        : maybeStrikeCount;

    if (strikeCount < STRIKE_THRESHOLD) return false;

    const dismissedStrikeCount = Number(member.dismissedStrikeCount || 0);
    return strikeCount > dismissedStrikeCount;
}

export function getMemberFlagLabel(strikeCount = 0) {
    if (!isMemberFlagged(strikeCount)) return "Not flagged";
    return "Pending Demotion Review";
}
