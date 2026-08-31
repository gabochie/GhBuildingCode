import type { PaymentGateway } from "./gateway";
import { MoolreGateway } from "./moolre";
import { ExpressPayGateway } from "./expresspay";

/**
 * All supported Ghana payment gateways. A gateway is only usable once its env
 * credentials are present (see isEnabled()).
 */
export function allGateways(): PaymentGateway[] {
  return [new MoolreGateway(), new ExpressPayGateway()];
}

export function gatewayById(id: string): PaymentGateway | undefined {
  return allGateways().find((g) => g.id === id);
}
