import { STORE_NOTICE } from "@/lib/pakistan";

export function StoreBanner() {
  return (
    <div className="w-full bg-primary text-primary-foreground text-center text-xs md:text-sm font-bold uppercase tracking-widest py-2 px-4">
      {STORE_NOTICE}
    </div>
  );
}
