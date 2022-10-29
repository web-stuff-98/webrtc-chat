import classes from "./ProgressBar.module.scss";

export default function ProgressBar({
  percent,
  label,
}: {
  percent?: number;
  label?: string;
}) {
  return (
    <div className={classes.container}>
      <div className={classes.barContainer}>
        <div style={{ width: `${percent}%` }} className={classes.bar} />
      </div>
      {label && <div>{label}</div>}
    </div>
  );
}
