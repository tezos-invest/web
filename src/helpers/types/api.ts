export type TApiError = {
  detail: [
    {
      loc: Array<string>;
      msg: string;
      type: string;
    }
  ];
};

export enum Tzips {
  FA2 = "fa2",
  FA12 = "fa12",
}

export type TPool = {
  endpoint: string;
  factory: string;
  token_address: string;
  token_id: string;
  pool_address: string;
  lastActivityTime: Date;
  tzips: Tzips;
  token_name: string;
  token_symbol: string;
  decimals: string;
  tez_pool: number;
  token_pool: number;
  fee_factor: number;
  tez_to_token_dbg: number;
  token_to_tez_dbg: number;
};

export type TPoolWithWeight = TPool & {
  weight?: number;
};

export type TPoolsResponse = Array<TPool>;

export type TEmulateRequest = {
  assets: Array<TEmulateAsset>;
};

export type TMarkovitzRequest = TEmulateRequest;

export type TEmulateResponse = {
  result: Array<TEmulateItem>;
};
export type TMarkovitzResponse = {
  result: Array<TMarkovitzItem>;
};

export type TEmulateAsset = {
  symbol: string;
  weight: number;
};

export type TEmulateItem = {
  day: string;
  evaluation: number;
};

export type TMarkovitzItem = {
  profit_percent: number;
  volatility: number;
  weights: Record<string, number>;
};

export type TGetPortfolioRequest = {
  owner: string;
  contract_address: string;
};

export type TGetPortfolioResponse = {
  result: Array<TGetPortfolioResultItem>;
};

export type TGetPortfolioResultItem = {
  symbol: string;
  asset: string;
  weight: string;
  token: string;
};
