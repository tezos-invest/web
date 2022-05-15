import { TPool, TPoolWithWeight } from "../../helpers/types";
import { DAppConnection } from "../../services/wallet";
import { MichelsonMap } from "@taquito/taquito";

const formatDataForRebalancePortfolio = (pools: TPoolWithWeight[]) => {
  const pricesMap = new MichelsonMap();
  const poolsMap = new MichelsonMap();

  pools.forEach((pool) => {
    pricesMap.set(pool.token_symbol, pool.tez_to_token_dbg ?? 0);
    poolsMap.set(pool.token_symbol, pool.pool_address);
  });

  const slippage = 5;
  const amount = 200000000;

  return { pricesMap, poolsMap, slippage, amount };
};

const rebalancePortfolio = async (
  connection: DAppConnection,
  pools: TPool[]
) => {
  const { tezos, contractAddress } = connection;

  const { poolsMap, pricesMap, slippage, amount } =
    formatDataForRebalancePortfolio(pools);

  const contract = await tezos.wallet.at(contractAddress);

  const contractMethodObject = contract.methods.rebalance(
    pricesMap,
    poolsMap,
    slippage,
    amount
  );

  const wallet = await tezos.wallet
    .batch()
    .withContractCall(contractMethodObject)
    .send();

  return wallet.confirmation(1);
};

export { rebalancePortfolio };
