import { TPool } from "../../helpers/types";
import { DAppConnection } from "../../services/wallet";
import { MichelsonMap } from "@taquito/taquito";

const withdraw = async (connection: DAppConnection, pools: TPool[]) => {
  const { tezos, contractAddress } = connection;

  const withdrawMap = new MichelsonMap();

  pools.forEach((pool) => {
    withdrawMap.set(pool.token_symbol, pool.pool_address);
  });

  const contract = await tezos.wallet.at(contractAddress);

  console.log("withdrawMap", withdrawMap);
  const contractMethodObject = contract.methods.withdraw(withdrawMap);

  const wallet = await tezos.wallet
    .batch()
    .withContractCall(contractMethodObject)
    .send();

  return wallet.confirmation(1);
};

export { withdraw };
