export type SupportedNetworks = "mainnet" | "gnosischain" | "sepolia";

export function getRpc(network: SupportedNetworks): string {
  switch (network) {
    case "mainnet":
      // https://mevblocker.io/#rpc
      return "https://rpc.mevblocker.io";
    case "gnosischain":
      // https://docs.gnosischain.com/tools/rpc/
      return "https://rpc.gnosischain.com";
    case "sepolia":
      // https://chainlist.org/chain/11155111
      return "https://ethereum-sepolia.publicnode.com";
    default:
      throw new Error(`Invalid network ${network}`);
  }
}
