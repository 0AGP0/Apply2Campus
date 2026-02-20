export const OPERATION_ROLES = ["OPERATION_UNIVERSITY", "OPERATION_ACCOMMODATION", "OPERATION_VISA"] as const;

export function isOperationRole(role?: string): boolean {
  return !!role && OPERATION_ROLES.includes(role as (typeof OPERATION_ROLES)[number]);
}

export function isConsultantOrOperation(role?: string): boolean {
  return role === "CONSULTANT" || isOperationRole(role);
}
