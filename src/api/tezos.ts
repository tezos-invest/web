import { request } from "./lib";
import {
  TEmulateRequest,
  TPoolsResponse,
  TGetPortfolioRequest,
  TGetPortfolioResponse,
} from "../helpers/types";

export default {
  getPools: () => request<TPoolsResponse>({ url: `/pools` }),
  emulate: (data: TEmulateRequest) =>
    request<TPoolsResponse>({ url: `/emulate`, method: "POST", data }),
  getPortfolio: (params: TGetPortfolioRequest) =>
    request<TGetPortfolioResponse>({ url: "/portfolio", params }),
};
