import { useAuth } from "@/hooks/useAuth";

export default function BatchGate({ allowedBatches, allowedRoles, children, fallback = null }) {
  const { user } = useAuth();
  if (!user) return fallback;

  const batchOk = allowedBatches && allowedBatches.includes(user.batch);
  const roleOk = allowedRoles && allowedRoles.includes(user.role);

  if (!batchOk && !roleOk) return fallback;
  return children;
}
