import { cn } from "../../lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-r from-white/[0.03] via-white/[0.08] to-white/[0.03] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
