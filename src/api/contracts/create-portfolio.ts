import { TPoolWithWeight, Tzips } from "../../helpers/types";
import { DAppConnection } from "../../services/wallet";
import { MichelsonMap } from "@taquito/taquito";

const formatDataToCreatePortfolio = (pools: TPoolWithWeight[]) => {
  const michelsonData = new MichelsonMap();

  const tokens: Record<
    string,
    { [index: string]: { address: string; token_id?: string } }
  > = {};
  const weights: Record<string, number> = {};

  pools.forEach((pool) => {
    if (pool.tzips === Tzips.FA2) {
      tokens[pool.token_symbol] = {
        [pool.tzips]: {
          address: pool.pool_address,
          token_id: pool.token_id,
        },
      };
    } else {
      tokens[pool.token_symbol] = {
        [pool.tzips]: {
          address: pool.pool_address,
        },
      };
    }

    weights[pool.token_symbol] = pool.weight ?? 0;
  });
  //
  // michelsonData.set(`tokens`, tokens);
  // michelsonData.set(`weights`, weights);

  return { tokens, weights };
};

const contractAddress = "KT18q4si6YmzJjbgZ3wV7HYfds1E3EbD7tBx";

const createPortfolio = async (
  connection: DAppConnection,
  data: TPoolWithWeight[]
) => {
  const { tezos } = connection;

  const formattedData = formatDataToCreatePortfolio(data);

  console.log("formattedData", formattedData);

  const contract = await tezos.wallet.at(contractAddress);
  const contractMethodObject =
    contract.methodsObject.create_portfolio(formattedData);

  console.log("contract", contract);
  console.log("contractMethod", contractMethodObject);

  const wallet = await tezos.wallet
    .batch()
    .withContractCall(contractMethodObject)
    .send();

  return wallet.confirmation(1);
};

export { createPortfolio };
