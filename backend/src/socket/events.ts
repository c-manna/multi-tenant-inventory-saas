import { io } from "./index";

export function emitTenant(tenantId: string, event: string, payload: any) {
  io?.to(`tenant:${tenantId}`).emit(event, payload);
}
