import { SupportedNetworks } from "./networks.ts";

export interface SingleSafeConfig {
  safe: string;
  network: SupportedNetworks;
  newThreshold: number;
  newOwners: string[];
}
