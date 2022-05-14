import { Signer as TaquitoSigner } from "@taquito/taquito";

export class Signer implements TaquitoSigner {
  constructor(private pkh: string, private pk: string) {}

  async publicKey(): Promise<string> {
    return this.pk;
  }

  async publicKeyHash(): Promise<string> {
    return this.pkh;
  }

  async sign(): Promise<{
    bytes: string;
    sig: string;
    prefixSig: string;
    sbytes: string;
  }> {
    throw new Error("cannot sign");
  }

  async secretKey(): Promise<string | undefined> {
    throw new Error("Secret key cannot be exposed");
  }
}
