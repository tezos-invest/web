import { NetworkType as BeaconNetwork } from "@airgap/beacon-sdk";
import { BeaconWallet } from "@taquito/beacon-wallet";
import { MichelCodecPacker, TezosToolkit } from "@taquito/taquito";
import { Signer } from "./signer";
import { TempleWallet } from "@temple-wallet/dapp";

export type DAppConnection = {
  type: "temple" | "beacon";
  pkh: string;
  pk: string;
  contractAddress: string;
  tezos: TezosToolkit;
  templeWallet?: TempleWallet;
};

const beaconWallet = new BeaconWallet({
  name: "hello taquito",
});

export const defaultUrls = {
  [BeaconNetwork.MAINNET]: "https://testnet-tezos.giganode.io",
  [BeaconNetwork.HANGZHOUNET]: "https://hangzhounet.smartpy.io",
};

const contractAddress = "KT18q4si6YmzJjbgZ3wV7HYfds1E3EbD7tBx";

const michelEncoder = new MichelCodecPacker();

export const connectWalletBeacon = async (
  forcePermissions: boolean
): Promise<DAppConnection> => {
  const beaconNetwork = BeaconNetwork.HANGZHOUNET;

  beaconWallet.client.preferredNetwork = beaconNetwork;

  const activeAccount = await beaconWallet.client.getActiveAccount();

  if (forcePermissions || !activeAccount) {
    if (activeAccount) {
      await beaconWallet.clearActiveAccount();
    }
    await beaconWallet.requestPermissions({ network: { type: beaconNetwork } });
  }

  const tezos = new TezosToolkit(defaultUrls[beaconNetwork]);
  tezos.setPackerProvider(michelEncoder);
  tezos.setWalletProvider(beaconWallet);

  const activeAcc = await beaconWallet.client.getActiveAccount();

  if (!activeAcc) {
    throw new Error("Wallet wasn't connected");
  }

  tezos.setSignerProvider(new Signer(activeAcc.address, activeAcc.publicKey));

  return {
    type: "beacon",
    pkh: activeAcc.address,
    pk: activeAcc.publicKey,
    contractAddress,
    tezos,
  };
};
