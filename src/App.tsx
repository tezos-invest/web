import React, { useCallback, useMemo, useState } from "react";
import "./App.css";
import { Button, Modal, Spin, Table } from "antd";
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

const formatDataForMarkovitzTable = (
  data: TMarkovitzItem[],
  fnSelect: (weights: TMarkovitzItem["weights"]) => void
) => {
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
      render: (weights: TMarkovitzItem["weights"]) => {
        const handleSelect = () => {
          fnSelect(weights);
        };

        return (
          <>
            <Button type="primary" size="large" onClick={handleSelect}>
              Select this variant
            </Button>
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
    action: dataItem.weights,
  }));

  return {
    columns,
    rows,
  };
};

const App = (): JSX.Element => {
  const [connection, setConnection] = useState<DAppConnection>();
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isLoadingEmulate, setLoadingEmulate] = useState<boolean>(false);
  const [isLoadingVariants, setLoadingVariants] = useState<boolean>(false);
  const [pools, setPools] = useState<TPool[]>([]);
  const [poolsSelectedData, setPoolsSelectedData] = useState<TPoolWithWeight[]>(
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
  const piePortfolioData = useMemo(
    () => formatDataForPortfolioPie(portfolio),
    [portfolio]
  );
  const chartsEmulatedData = useMemo(
    () => formatDataForEmulatedChart(emulatedData),
    [emulatedData]
  );

  const handleSelectOtherTokens = useCallback(() => {
    setPoolsSelectedData([]);
    setEmulatedData([]);
    setMarkovitzData([]);
  }, []);

  const handleRequestPortfolio = useCallback(
    (appConnection: DAppConnection) => {
      handleSelectOtherTokens();
      setLoading(true);

      API.tezos
        .getPortfolio({
          owner: appConnection.pkh,
          contract_address: appConnection.contractAddress,
        })
        .then((response) => {
          API.tezos.getPools().then(setPools);
          setPortfolio(response.result);
          setLoading(false);
        })
        .catch((error) => {
          Modal.error({
            title: "Get portfolio is failed",
            content: error.message,
          });
          setLoading(false);
        });
    },
    []
  );

  const handleSelectVariant = useCallback(
    (weights: TMarkovitzItem["weights"]) => {
      if (!connection) return;

      const variantPoolsWithWeights: TPoolWithWeight[] = poolsSelectedData.map(
        (pool) => {
          return {
            ...pool,
            weight: weights[pool.token_symbol],
          };
        }
      );

      createPortfolio(connection, variantPoolsWithWeights)
        .then(() => {
          handleRequestPortfolio(connection);
        })
        .catch((error) => {
          console.error("createPortfolio error", error);
          Modal.error({
            title: "Create of portfolio is failed",
            content: error.message,
          });
        });
    },
    [connection, poolsSelectedData]
  );

  const tableMarkovitzData = useMemo(
    () => formatDataForMarkovitzTable(markovitzData, handleSelectVariant),
    [markovitzData]
  );

  const isWalletConnection = !!connection;
  const hasPortfolio = portfolio && portfolio?.length !== 0;
  const hasEmulation = emulatedData.length !== 0;
  const hasMarkovitz = markovitzData.length !== 0;

  const handleConnectWallet = useCallback(() => {
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
  }, [handleRequestPortfolio]);

  const handleAddPool = useCallback(
    (pool: TPool) => () => {
      setPoolsSelectedData([...poolsSelectedData, pool]);
    },
    [setPoolsSelectedData, poolsSelectedData.length]
  );

  const handleRemovePool = useCallback(
    (poolAddress: string) => () => {
      setPoolsSelectedData((prevSelectedPools) => {
        return prevSelectedPools.filter(
          (prevSelectedPool) => prevSelectedPool.pool_address !== poolAddress
        );
      });
    },
    [setPoolsSelectedData]
  );

  const handleChangeWeight = useCallback(
    (poolAddress: string, weight?: number) => {
      setPoolsSelectedData((prevSelectedPools) => {
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
    },
    [setPoolsSelectedData]
  );

  const handleRequestEmulate = useCallback(() => {
    setLoadingEmulate(true);

    API.tezos
      .emulate(formatDataForBackend(poolsSelectedData))
      .then((response) => {
        setLoadingEmulate(false);
        setEmulatedData(response.result);
      })
      .catch((error) => {
        setLoadingEmulate(false);
        console.error("rebalancePortfolio", error);
        Modal.error({
          title: "Emulate of portfolio is failed",
          content: error.message,
        });
      });
  }, [poolsSelectedData]);

  const handleRequestVariants = useCallback(() => {
    setLoadingVariants(true);

    API.tezos
      .markovitzOptimize(formatDataForBackend(poolsSelectedData))
      .then((response) => {
        setMarkovitzData(response.result);
        setLoadingVariants(false);

        if (response.result.length === 0) {
          Modal.info({
            title: "Creating variants is canceled",
            content: "There are no profitable variants for such tokens",
          });
        }
      })
      .catch((error) => {
        setLoadingVariants(false);
        console.error("Creating variants error", error);
        Modal.error({
          title: "Creating variants is failed",
          content: error.message,
        });
      });
  }, [poolsSelectedData]);

  const handleCreatePortfolio = useCallback(() => {
    if (!connection) return;

    createPortfolio(connection, poolsSelectedData)
      .then(() => {
        handleRequestPortfolio(connection);
      })
      .catch((error) => {
        console.error("createPortfolio error", error);
        Modal.error({
          title: "Create of portfolio is failed",
          content: error.message,
        });
      });
  }, [connection, poolsSelectedData]);

  const handleRebalancePortfolio = useCallback(() => {
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
        console.error("rebalance portfolio error", error);
        Modal.error({
          title: "Rebalance is failed",
          content: error.message,
        });
      });
  }, [connection, pools]);

  const handleWithdrawPortfolio = useCallback(() => {
    if (!connection) return;

    const portfolioTokens = pools.filter((pool) => {
      return portfolio?.find(
        (portfolioPool) => portfolioPool.token === pool.pool_address
      );
    });

    withdraw(connection, portfolioTokens)
      .then((response) => {
        console.log("withdraw", response);
      })
      .catch((error) => {
        console.error("withdraw error", error);
        Modal.error({
          title: "withdraw is failed",
          content: error.message,
        });
      });
  }, [connection, pools]);

  if (isLoading) {
    return (
      <div className="main-page">
        <div className="main-page__init">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (hasMarkovitz) {
    return (
      <div className="main-page">
        <div className="main-page__header">
          <h2 className="main-page__title">Variants</h2>
          <div className="main-page__actions">
            <Button
              size="large"
              type="dashed"
              onClick={handleSelectOtherTokens}
            >
              Select others tokens
            </Button>
          </div>
        </div>

        <div className="main-page__table">
          <Table
            rowKey="key"
            dataSource={tableMarkovitzData.rows}
            columns={tableMarkovitzData.columns}
          />
        </div>
      </div>
    );
  }

  if (hasEmulation) {
    return (
      <div className="main-page">
        <div className="main-page__header">
          <h2 className="main-page__title">
            Worth of the portfolio with selected tokens (Starts point is 100%)
          </h2>
          <div className="main-page__actions">
            <Button
              size="large"
              type="dashed"
              onClick={handleSelectOtherTokens}
            >
              Select others tokens
            </Button>
            <Button size="large" type="primary" onClick={handleCreatePortfolio}>
              Create portfolio
            </Button>
          </div>
        </div>
        <div className="main-page__chart">
          <Line
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
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
        <div className="main-page__header">
          <h2 className="main-page__title">Portfolio</h2>
          <div className="main-page__actions">
            <Button
              type="primary"
              size="large"
              onClick={handleRebalancePortfolio}
            >
              Rebalance portfolio
            </Button>
            <Button
              type="dashed"
              size="large"
              onClick={handleWithdrawPortfolio}
            >
              Close portfolio
            </Button>
          </div>
        </div>
        <div className="main-page__pie">
          <Pie
            options={{
              responsive: true,
            }}
            data={piePortfolioData}
          />
        </div>
      </div>
    );
  }

  if (isWalletConnection && !hasPortfolio) {
    return (
      <div className="main-page">
        <div className="main-page__header">
          <h2 className="main-page__title">
            Select tokens from list and set the percent for everyone
          </h2>
          <div className="main-page__actions">
            {poolsSelectedData.length > 0 && (
              <>
                <Button
                  size="large"
                  type="primary"
                  loading={isLoadingEmulate}
                  onClick={handleRequestEmulate}
                >
                  Send emulate
                </Button>
                <Button
                  size="large"
                  type="primary"
                  loading={isLoadingVariants}
                  onClick={handleRequestVariants}
                >
                  Get variants
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="main-page__pools">
          <Pools pools={displayedData} onAdd={handleAddPool} />
          <PoolsSelected
            pools={poolsSelectedData}
            onRemove={handleRemovePool}
            onChangeWeight={handleChangeWeight}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="main-page">
      <div className="main-page__init">
        <Button type="primary" size="large" onClick={handleConnectWallet}>
          Connect Wallet
        </Button>
      </div>
    </div>
  );
};

export default App;
