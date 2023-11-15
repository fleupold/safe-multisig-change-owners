import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.206.0/assert/mod.ts";
import {
  Contract,
  ethers,
  utils,
} from "https://cdn.ethers.io/lib/ethers-5.7.esm.min.js";

import { safesToUpdate } from "../config.ts";
import { getRpc } from "./networks.ts";

const OUT_DIR = "./out";

try {
  await Deno.remove(OUT_DIR, { recursive: true });
} catch (_) { /* directory may not exist */ }
await Deno.mkdir(OUT_DIR);
for (const { safe, newOwners, network, newThreshold } of safesToUpdate) {
  await Deno.writeTextFile(
    `${OUT_DIR}/${network}-${safe}.json`,
    await computeTxBuilderFile({
      safeAddress: safe,
      rpc: getRpc(network),
      newOwners,
      newThreshold,
    }),
  );
}

interface Config {
  safeAddress: string;
  rpc: string;
  newOwners: string[];
  newThreshold?: number;
}

async function computeTxBuilderFile(
  { safeAddress, rpc, newOwners, newThreshold }: Config,
): Promise<string> {
  // https://etherscan.io/address/0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552#code#F6#L94
  const safeAbi = [
    "function getOwners() public view returns (address[] memory)",
    "function getThreshold() public view returns (uint256)",
    "function addOwnerWithThreshold(address owner, uint256 _threshold) public",
    "function changeThreshold(uint256 _threshold) public",
    "function removeOwner(address prevOwner, address owner, uint256 _threshold) public",
    "function swapOwner(address prevOwner, address oldOwner, address newOwner) public",
  ];
  const SENTINEL_OWNERS = utils.getAddress("0x" + "00".repeat(19) + "01");

  const provider = ethers.getDefaultProvider(rpc);
  const safe = new Contract(utils.getAddress(safeAddress), safeAbi, provider);

  const currentOwners: string[] = await safe.getOwners();
  const currentThreshold = Number(await safe.getThreshold());

  const isSameAddress = (lhs: string, rhs: string) =>
    lhs.toLowerCase() === rhs.toLowerCase();
  const hasAddress = (list: string[], searchTarget: string) =>
    list.some((owner) => isSameAddress(searchTarget, owner));

  const ownersKept = currentOwners.filter((addr) =>
    hasAddress(newOwners, addr)
  );
  const ownersToRemove = currentOwners.filter((addr) =>
    !hasAddress(newOwners, addr)
  );
  const ownersToAdd = newOwners.filter((addr) => !hasAddress(ownersKept, addr));

  assertEquals(
    ownersKept.length + ownersToRemove.length,
    currentOwners.length,
  );
  assertEquals(
    ownersKept.length + ownersToAdd.length,
    newOwners.length,
  );
  assert(
    newOwners.length >= Number(currentThreshold),
    "Code uses current threshold for adding and removing solvers",
  );
  assert(
    newThreshold === undefined || newOwners.length >= newThreshold,
  );

  const replacements: { oldOwner: string; newOwner: string }[] = [];
  const removed: string[] = [];

  // Note: the order in which we collect these addresses is important: first we swap, and only after we remove.
  for (const ownerToRemove of ownersToRemove) {
    const ownerToAdd = ownersToAdd.pop();
    if (ownerToAdd === undefined) {
      removed.push(ownerToRemove);
    } else {
      replacements.push({ oldOwner: ownerToRemove, newOwner: ownerToAdd });
    }
  }
  const added: string[] = ownersToAdd;
  assertEquals(
    removed.length * added.length,
    0,
    "Must not add and remove owners at the same time",
  );

  // Finds the previous owner to use in the ownership change functions *if no changes were made to the original, current
  // owner list*.
  const prevOwnerWithNoChanges = (addr: string) => {
    // Safe owners are stored in a cyclic structure. The "sentinel owner" points to the first owner, the first to the
    // second, ..., and the last to the sentinel.
    let prevOwner = SENTINEL_OWNERS;
    for (const owner of currentOwners) {
      if (isSameAddress(owner, addr)) {
        return prevOwner;
      }
      prevOwner = owner;
    }
    throw new Error(`Address ${addr} is not an owner`);
  };

  // We replace the owners starting from the last. In this way, we know that the previous owner in the owner cycle has
  // not been changed and we can use the original owner list to determine the required previous owner.
  const removeSubTxs = removed.reverse().map((removedOwner) => ({
    to: safe.address,
    value: "0",
    data: safe.interface.encodeFunctionData(
      "removeOwner",
      [
        prevOwnerWithNoChanges(removedOwner),
        removedOwner,
        currentThreshold,
      ],
    ),
  }));
  const replaceSubTxs = replacements.reverse().map((
    { oldOwner, newOwner },
  ) => ({
    to: safe.address,
    value: "0",
    data: safe.interface.encodeFunctionData(
      "swapOwner",
      [
        prevOwnerWithNoChanges(oldOwner),
        oldOwner,
        newOwner,
      ],
    ),
  }));
  // Adding doesn't need a previous owner so there is no need to reverse.
  const addedSubTxs = added.map((addedOwner) => ({
    to: safe.address,
    value: "0",
    data: safe.interface.encodeFunctionData(
      "addOwnerWithThreshold",
      [
        addedOwner,
        currentThreshold,
      ],
    ),
  }));
  const changeThresholdTxs =
    (newThreshold === undefined) || (newThreshold === currentThreshold)
      ? []
      : [{
        to: safe.address,
        value: "0",
        data: safe.interface.encodeFunctionData(
          "changeThreshold",
          [
            newThreshold,
          ],
        ),
      }];
  const transactions = [
    // We first processed replacements, then removals. Also this needs to be reversed.
    ...removeSubTxs,
    ...replaceSubTxs,
    // Adding at the end to avoid changing the owner order
    ...addedSubTxs,
    // The threshold is needed when removing and adding, so it must be edited last
    ...changeThresholdTxs,
  ];

  // The following function is a slightly modified version of the following from the Safe's smart-contract task
  // collection.
  // https://github.com/5afe/safe-tasks/blob/52067e3ac5b8a1db3a4ab54fec0ee628c0bd4f3a/src/execution/utils.ts#L26-L37
  const txBuilderFile = {
    version: "1.0",
    chainId: (await provider.getNetwork()).chainId.toString(),
    createdAt: new Date().getTime(),
    meta: {
      name: `Change owners of safe ${safe.address}`,
      description: `Swaps and removes owners until the remaining owners are ${
        newOwners.join(", ")
      }`,
    },
    transactions,
  };

  return JSON.stringify(txBuilderFile, undefined, 2);
}
