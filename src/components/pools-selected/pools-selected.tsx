import { ChangeEvent, memo } from "react";
import { TPoolWithWeight } from "../../helpers/types";
import { DeleteOutlined } from "@ant-design/icons";
import "./pools-selected.css";

type TPoolsProps = {
  pools: Array<TPoolWithWeight>;
  onRemove: (poolAddress: string) => () => void;
  onChangeWeight: (poolAddress: string, weight?: number) => void;
};

const PoolsSelected = memo((props: TPoolsProps): JSX.Element => {
  const { pools, onRemove, onChangeWeight } = props;

  const handleChangeWeight =
    (poolAddress: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;

      onChangeWeight(poolAddress, +value ?? undefined);
    };

  return (
    <ul className="pools-selected-list">
      {pools.map((pool) => {
        return (
          <li className="pool-selected" key={pool.pool_address}>
            <div className="pool-selected__wrapper">
              <div
                className="pool-selected__icon"
                onClick={onRemove(pool.pool_address)}
              >
                <DeleteOutlined />
              </div>
              <div className="pool-selected__name">{pool.token_name}</div>

              <div className="pool-selected__input">
                <input
                  type="text"
                  placeholder="%"
                  onChange={handleChangeWeight(pool.pool_address)}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
});

export { PoolsSelected };
