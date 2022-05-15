import React, { useMemo, useState } from "react";
import "./App.css";
import { Button, Modal, Table } from "antd";
import {
  Chart as ChartJS,
  ArcElement,
  PointElement,
  LineElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";
import { Pie, Line } from "react-chartjs-2";
import { connectWalletBeacon, DAppConnection } from "./services/wallet";
import API from "./api";
import {
  TEmulateAsset,
  TEmulateItem,
  TEmulateRequest,
  TGetPortfolioResultItem,
  TMarkovitzItem,
  TMarkovitzRequest,
  TPool,
  TPoolWithWeight,
} from "./helpers/types";
import { PoolsSelected } from "./components/pools-selected/pools-selected";
import { Pools } from "./components/pools/pools";
import { createPortfolio } from "./api/contracts/create-portfolio";
import { rebalancePortfolio } from "./api/contracts/rebalance-portfolio";
import { withdraw } from "./api/contracts/withdraw";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ArcElement,
  Tooltip
);

const getRandomColor = (): string => {
  const letters = "0123456789ABCDEF".split("");

  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }

  return color;
};

const formatDataForPortfolioPie = (
  portfolio: TGetPortfolioResultItem[] | null
) => {
  const data = {
    labels: [] as string[],
    datasets: [
      {
        data: [] as number[],
        backgroundColor: [] as string[],
        borderWidth: 1,
      },
    ],
  };

  portfolio?.forEach((portfolioItem) => {
    data.labels.push(portfolioItem.symbol);
    data.datasets[0].data.push(+portfolioItem.weight);
    data.datasets[0].backgroundColor.push(getRandomColor());
  });

  return data;
};

const formatDataForEmulatedChart = (
  emulatedData: TEmulateItem[]
): ChartData<"line"> => {
  const data = {
    labels: [] as string[],
    datasets: [
      {
        data: [] as number[],
        backgroundColor: getRandomColor(),
        borderWidth: 1,
      },
    ],
  };

  emulatedData.forEach((emulatedItem) => {
    data.labels.push(new Date(emulatedItem.day).toLocaleString().split(",")[0]);
    data.datasets[0].data.push(+emulatedItem.evaluation * 100);
  });

  return data;
};

const formatDataForBackend = (
  data: TPoolWithWeight[]
): TEmulateRequest | TMarkovitzRequest => {
  const assets = data.map((selectedItem) => {
    return {
      symbol: selectedItem.token_symbol,
      weight: selectedItem.weight ?? 0,
    };
  });

  return {
    assets,
  };
};

const formatDataForMarkovitzTable = (data: TMarkovitzItem[]) => {
  const columns = [
    {
      key: "percent",
      title: "Percent",
      dataIndex: "percent",
      render: (percent: number) => {
        return (percent * 100).toFixed(2) + "%";
      },
    },
    {
      key: "volatility",
      title: "Volatility",
      dataIndex: "volatility",
      render: (volatility: number) => {
        return (volatility * 100).toFixed(2) + "%";
      },
    },
    {
      key: "weights",
      title: "Weights",
      dataIndex: "weights",
      render: (columnData: TMarkovitzItem["weights"]) => {
        return Object.keys(columnData).map((columnDataItem) => {
          return (
            <>
              <b>{columnDataItem}: </b>
              {columnData[columnDataItem]}
              <br />
            </>
          );
        });
      },
    },
    {
      key: "action",
      dataIndex: "action",
      render: (action: TMarkovitzItem["weights"]) => {
        return (
          <>
            <Button>Select this variant</Button>
          </>
        );
      },
    },
  ];

  const rows = data.map((dataItem, index) => ({
    key: index,
    percent: dataItem.profit_percent,
    volatility: dataItem.volatility,
    weights: dataItem.weights,
  }));

  return {
    columns,
    rows,
  };
};

const App = (): JSX.Element => {
  const [connection, setConnection] = useState<DAppConnection>();
  const [pools, setPools] = useState<TPool[]>([]);
  const [poolsSelectedData, setpoolsSelectedData] = useState<TPoolWithWeight[]>(
    []
  );
  const [emulatedData, setEmulatedData] = useState<TEmulateItem[]>([]);
  const [markovitzData, setMarkovitzData] = useState<TMarkovitzItem[]>([]);
  const [portfolio, setPortfolio] = useState<TGetPortfolioResultItem[] | null>(
    null
  );

  const displayedData = useMemo(
    () => pools.filter((pool) => poolsSelectedData.indexOf(pool) == -1),
    [pools.length, poolsSelectedData.length]
  );
  const piePortfolioData = formatDataForPortfolioPie(portfolio);
  const chartsEmulatedData = formatDataForEmulatedChart(emulatedData);
  const tableMarkovitzData = formatDataForMarkovitzTable(markovitzData);

  const isWalletConnection = !!connection;
  const hasPortfolio = !!portfolio;
  const hasEmulation = emulatedData.length !== 0;
  const hasMarkovitz = markovitzData.length !== 0;

  const handleRequestPortfolio = (appConnection: DAppConnection) => {
    API.tezos
      .getPortfolio({
        owner: appConnection.pkh,
      })
      .then((response) => {
        API.tezos.getPools().then(setPools);
        setPortfolio(response.result);
      })
      .catch((error) => {
        Modal.error({
          title: "Get portfolio is failed",
          content: error.message,
        });
      });
  };

  const handleConnectWallet = () => {
    connectWalletBeacon(true)
      .then((walletConnection) => {
        console.info("connecting wallet", walletConnection);
        setConnection(walletConnection);
        handleRequestPortfolio(walletConnection);
      })
      .catch((error) => {
        Modal.error({
          title: "Connection of wallet is failed",
          content: error.message,
        });
      });
  };

  const handleAddPool = (pool: TPool) => () => {
    setpoolsSelectedData([...poolsSelectedData, pool]);
  };

  const handleRemovePool = (poolAddress: string) => () => {
    setpoolsSelectedData((prevSelectedPools) => {
      return prevSelectedPools.filter(
        (prevSelectedPool) => prevSelectedPool.pool_address !== poolAddress
      );
    });
  };

  const handleChangeWeight = (poolAddress: string, weight?: number) => {
    setpoolsSelectedData((prevSelectedPools) => {
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
    API.tezos
      .emulate(formatDataForBackend(poolsSelectedData))
      .then((response) => {
        setEmulatedData(response.result);
      })
      .catch((error) => {
        console.error("rebalancePortfolio", error);
        Modal.error({
          title: "Emulate of portfolio is failed",
          content: error.message,
        });
      });
  };

  const handleRequestVariants = () => {
    API.tezos
      .markovitzOptimize(formatDataForBackend(poolsSelectedData))
      .then((response) => {
        setMarkovitzData(response.result);
      })
      .catch((error) => {
        console.error("rebalancePortfolio", error);
        Modal.error({
          title: "Emulate of portfolio is failed",
          content: error.message,
        });
      });
  };

  const handleCreatePortfolio = () => {
    if (!connection) return;

    createPortfolio(connection, poolsSelectedData)
      .then((response) => {
        console.log("create portfolio", response);
      })
      .catch((error) => {
        console.error("rebalancePortfolio", error);
        Modal.error({
          title: "Create of portfolio is failed",
          content: error.message,
        });
      });
  };

  const handleRebalancePortfolio = () => {
    if (!connection) return;

    const portfolioTokens = pools.filter((pool) => {
      return portfolio?.find(
        (portfolioPool) => portfolioPool.token === pool.pool_address
      );
    });

    rebalancePortfolio(connection, portfolioTokens)
      .then((response) => {
        console.log("rebalance portfolio", response);
      })
      .catch((error) => {
        console.error("rebalancePortfolio", error);
        Modal.error({
          title: "Rebalance is failed",
          content: error.message,
        });
      });
  };

  const handleWithdrawPortfolio = () => {
    if (!connection) return;

    const portfolioTokens = pools.filter((pool) => {
      return portfolio?.find(
        (portfolioPool) => portfolioPool.token === pool.pool_address
      );
    });

    withdraw(connection, portfolioTokens)
      .then((response) => {
        console.log("withdraw portfolio", response);
      })
      .catch((error) => {
        console.error("withdraw", error);
        Modal.error({
          title: "withdraw is failed",
          content: error.message,
        });
      });
  };

  if (hasMarkovitz) {
    return (
      <div className="main-page">
        <h2 className="main-page__title">Variants</h2>

        <Table
          style={{
            width: "500px",
          }}
          dataSource={tableMarkovitzData.rows}
          columns={tableMarkovitzData.columns}
        />
      </div>
    );
  }

  if (hasEmulation) {
    return (
      <div className="main-page">
        <h2 className="main-page__title">
          Worth of the portfolio with selected tokens (Start point is 100%)
        </h2>
        <div className="main-page__chart">
          <Line
            options={{
              responsive: true,
            }}
            data={chartsEmulatedData}
          />
        </div>
      </div>
    );
  }

  if (hasPortfolio) {
    return (
      <div className="main-page">
        <h2 className="main-page__title">PortFolio</h2>
        <div className="main-page__pie">
          <Pie
            options={{
              responsive: true,
            }}
            data={piePortfolioData}
          />
        </div>

        <Button onClick={handleRebalancePortfolio}>Rebalance portfolio</Button>
        <Button onClick={handleWithdrawPortfolio}>Close portfolio</Button>
      </div>
    );
  }

  if (isWalletConnection && !hasPortfolio) {
    return (
      <div className="main-page">
        <h2 className="main-page__title">
          Select tokens from list and set the percent for everyone
        </h2>
        <div className="pools">
          <Pools pools={displayedData} onAdd={handleAddPool} />
          <PoolsSelected
            pools={poolsSelectedData}
            onRemove={handleRemovePool}
            onChangeWeight={handleChangeWeight}
          />
        </div>

        {poolsSelectedData.length > 0 && (
          <>
            <Button onClick={handleRequestEmulate}>Send emulate</Button>
            <Button onClick={handleRequestVariants}>Get variants</Button>
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
