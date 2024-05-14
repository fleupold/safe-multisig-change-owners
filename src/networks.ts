// Network names based on .name in: https://github.com/ethereum-lists/chains/tree/master/_data/chains
export type SupportedNetworks =
  | "Ethereum Mainnet"
  | "Gnosis"
  | "Sepolia"
  | "Arbitrum One";

export function getRpc(network: SupportedNetworks): string {
  switch (network) {
    case "Ethereum Mainnet":
      // https://mevblocker.io/#rpc
      return "https://rpc.mevblocker.io";
    case "Gnosis":
      // https://docs.gnosischain.com/tools/rpc/
      return "https://rpc.gnosischain.com";
    case "Sepolia":
      // https://chainlist.org/chain/11155111
      return "https://ethereum-sepolia.publicnode.com";
    case "Arbitrum One":
      // https://chainlist.org/chain/42161
      return "https://arbitrum-one-rpc.publicnode.com";
    default:
      throw new Error(`Invalid network ${network}`);
  }
}
