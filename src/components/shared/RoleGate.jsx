import { useAuth } from "@/hooks/useAuth";

export default function RoleGate({ allowedRoles, children, fallback = null }) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return fallback;
  }

  return children;
}
