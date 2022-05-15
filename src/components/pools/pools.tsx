import { TPool } from "../../helpers/types";
import { getLetters } from "../../helpers/utils";
import "./pools.css";
import { memo } from "react";

type TPoolsProps = {
  pools: Array<TPool>;
  onAdd: (pool: TPool) => () => void;
};

const Pools = memo((props: TPoolsProps): JSX.Element => {
  const { pools, onAdd } = props;
  return (
    <ul className="pools-list">
      {pools.map((pool) => {
        return (
          <li className="pool" onClick={onAdd(pool)} key={pool.pool_address}>
            <div className="pool__wrapper">
              <div className="pool__icon">{getLetters(pool.token_name)}</div>
              <div className="pool__name">{pool.token_name}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
});

export { Pools };
