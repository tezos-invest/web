import { TPoolWithWeight, Tzips } from "../../helpers/types";
import { DAppConnection } from "../../services/wallet";
import { MichelsonMap } from "@taquito/taquito";

const formatDataToCreatePortfolio = (pools: TPoolWithWeight[]) => {
  const tokensMap = new MichelsonMap();
  const weightsMap = new MichelsonMap();

  pools.forEach((pool) => {
    if (pool.tzips === Tzips.FA2) {
      tokensMap.set(pool.token_symbol, {
        [pool.tzips]: {
          address: pool.pool_address,
          token_id: pool.token_id,
        },
      });
    } else {
      tokensMap.set(pool.token_symbol, {
        [pool.tzips]: pool.pool_address,
      });
    }

    weightsMap.set(pool.token_symbol, pool.weight ?? 0);
  });

  return { tokensMap, weightsMap };
};

const createPortfolio = async (
  connection: DAppConnection,
  data: TPoolWithWeight[]
) => {
  const { tezos, contractAddress } = connection;

  const { tokensMap, weightsMap } = formatDataToCreatePortfolio(data);

  const contract = await tezos.wallet.at(contractAddress);

  const contractMethodObject = contract.methods.create_portfolio(
    tokensMap,
    weightsMap
  );

  console.log("contract", contract);
  console.log("contractMethod", contractMethodObject);

  const wallet = await tezos.wallet
    .batch()
    .withContractCall(contractMethodObject)
    .send();

  return wallet.confirmation(1);
};

export { createPortfolio };
