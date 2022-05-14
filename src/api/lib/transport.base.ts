import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { TApiError } from "../../helpers/types";

const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await axios({
      ...config,
      baseURL: "http://213.108.130.179:8000",
    });

    return response?.data as T;
  } catch (errorResponse: unknown) {
    const networkError = (errorResponse as AxiosError).message;
    const apiError = (errorResponse as AxiosError<TApiError>).response?.data
      ?.detail?.[0]?.msg;
    const error = apiError ?? networkError ?? errorResponse;

    throw new Error(error);
  }
};

export { request };
