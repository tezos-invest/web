import React, { useMemo, useState } from "react";
import "./App.css";
import { Button, Modal } from "antd";
import { connectWalletBeacon, DAppConnection } from "./services/wallet";
import API from "./api";
import { TEmulateAsset, TPool, TPoolWithWeight } from "./helpers/types";
import { PoolsSelected } from "./components/pools-selected/pools-selected";
import { Pools } from "./components/pools/pools";
import { createPortfolio } from "./api/contracts/create-portfolio";

const App = (): JSX.Element => {
  const [connection, setConnection] = useState<DAppConnection>();
  const [data, setData] = useState<TPool[]>([]);
  const [selectedData, setSelectedData] = useState<TPoolWithWeight[]>([]);

  const isWalletConnection = !!connection;

  const displayedData = useMemo(() => {
    return data.filter((pool) => {
      return selectedData.indexOf(pool) == -1;
    });
  }, [data.length, selectedData.length]);

  const handleConnectWallet = () => {
    connectWalletBeacon(true)
      .then((walletConnection) => {
        console.info("connecting wallet", walletConnection);
        setConnection(walletConnection);
        API.tezos.getPools().then(setData);
      })
      .catch((error) => {
        Modal.error({
          title: "Connection of wallet is failed",
          content: error.message,
        });
      });
  };

  const handleAddPool = (pool: TPool) => () => {
    setSelectedData([...selectedData, pool]);
  };

  const handleRemovePool = (poolAddress: string) => () => {
    setSelectedData((prevSelectedPools) => {
      return prevSelectedPools.filter(
        (prevSelectedPool) => prevSelectedPool.pool_address !== poolAddress
      );
    });
  };

  const handleChangeWeight = (poolAddress: string, weight?: number) => {
    setSelectedData((prevSelectedPools) => {
      return prevSelectedPools.map((prevSelectedPool) => {
        if (prevSelectedPool.pool_address === poolAddress) {
          return {
            ...prevSelectedPool,
            weight,
          };
        }

        return prevSelectedPool;
      });
    });
  };

  const handleRequestEmulate = () => {
    const assets: Array<TEmulateAsset> = selectedData.map((selectedItem) => {
      return {
        symbol: selectedItem.token_symbol,
        weight: selectedItem.weight ?? 0,
      };
    });

    const requestData = {
      assets,
    };

    API.tezos
      .emulate(requestData)
      .then((response) => {
        console.info("response", response);
      })
      .catch((error) => {
        Modal.error({
          title: "Emulate of portfolio is failed",
          content: error.message,
        });
      });
  };

  const handleRequestPortfolio = () => {
    if (!connection) return;

    API.tezos
      .getPortfolio({
        owner: connection.pkh,
      })
      .then((response) => {
        console.info("response", response);
      })
      .catch((error) => {
        Modal.error({
          title: "Get portfolio is failed",
          content: error.message,
        });
      });
  };

  const handleCreatePortfolio = () => {
    if (!connection) return;

    createPortfolio(connection, selectedData).then((response) => {
      console.log("create portfolio", response);
    });
  };

  //
  // if (isWalletConnection) {
  //   return (
  //     <div className="main-page">
  //       <h3 className="main-page__title">This is your portfolio</h3>
  //       <Button onClick={handleRequestPortfolio}>Get portfolio</Button>
  //     </div>
  //   );
  // }

  if (isWalletConnection) {
    return (
      <div className="main-page">
        <h3 className="main-page__title">
          Select tokens from list and set the percent for everyone
        </h3>
        <div className="pools">
          <Pools pools={displayedData} onAdd={handleAddPool} />
          <PoolsSelected
            pools={selectedData}
            onRemove={handleRemovePool}
            onChangeWeight={handleChangeWeight}
          />
        </div>

        {selectedData.length > 0 && (
          <>
            <Button onClick={handleRequestEmulate}>Send emulate</Button>
            <Button onClick={handleCreatePortfolio}>Create portfolio</Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="main-page">
      <Button onClick={handleConnectWallet}>Connect Wallet</Button>
    </div>
  );
};

export default App;
