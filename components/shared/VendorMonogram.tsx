import { cn } from "@/lib/utils";
import { EltropyMark } from "@/components/shared/EltropyMark";

type Vendor =
  | "symitar"
  | "meridianlink"
  | "velera"
  | "eltropy"
  | "akuvo"
  | "verafin";

type Props = {
  vendor: Vendor;
  className?: string;
};

/**
 * Compact monogram badge per integration partner. Real brand-leaning colors
 * (or close approximations) to make integration pills + catalog cards read
 * as a real marketplace, not a placeholder list.
 */
const CONFIG: Record<
  Vendor,
  { label: string; bg: string; fg: string }
> = {
  symitar:       { label: "Jh", bg: "#0F3B73", fg: "#FFFFFF" },
  meridianlink:  { label: "ML", bg: "#0B5394", fg: "#FFFFFF" },
  velera:        { label: "V",  bg: "#4A1D70", fg: "#FFFFFF" },
  eltropy:       { label: "",   bg: "#0E7C7B", fg: "#FFFFFF" },
  akuvo:         { label: "A",  bg: "#7B1A1A", fg: "#FFFFFF" },
  verafin:       { label: "Vf", bg: "#0F5132", fg: "#FFFFFF" },
};

export function VendorMonogram({ vendor, className }: Props) {
  const c = CONFIG[vendor];
  if (vendor === "eltropy") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-[3px]",
          className,
        )}
        style={{ backgroundColor: c.bg, color: c.fg }}
      >
        <EltropyMark className="h-[60%] w-[60%]" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[3px] font-bold tracking-tight leading-none",
        className,
      )}
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  );
}
