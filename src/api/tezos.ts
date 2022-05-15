import { request } from "./lib";
import {
  TEmulateRequest,
  TPoolsResponse,
  TGetPortfolioRequest,
  TGetPortfolioResponse,
  TEmulateResponse,
  TMarkovitzResponse,
} from "../helpers/types";

export default {
  getPools: () => request<TPoolsResponse>({ url: `/pools` }),
  emulate: (data: TEmulateRequest) =>
    request<TEmulateResponse>({ url: `/emulate`, method: "POST", data }),
  markovitzOptimize: (data: TEmulateRequest) =>
    request<TMarkovitzResponse>({
      url: `/markovitz-optimize`,
      method: "POST",
      data,
    }),
  getPortfolio: (params: TGetPortfolioRequest) =>
    request<TGetPortfolioResponse>({ url: "/portfolio", params }),
};
