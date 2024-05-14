import { SingleSafeConfig } from "./src/types.ts";

const owners = [
  "0x1111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222",
  "0x3333333333333333333333333333333333333333",
  "0x4444444444444444444444444444444444444444",
  "0x5555555555555555555555555555555555555555",
];
export const safesToUpdate: SingleSafeConfig[] = [
  {
    safe: "0x01B94B667236a7896aC85D5bccdF23f26b10e6Cc",
    network: "Sepolia",
    newThreshold: 1,
    newOwners: owners,
  },
  {
    safe: "0xA03be496e67Ec29bC62F01a428683D7F9c204930",
    network: "Ethereum Mainnet",
    newThreshold: 1,
    newOwners: owners,
  },
];
