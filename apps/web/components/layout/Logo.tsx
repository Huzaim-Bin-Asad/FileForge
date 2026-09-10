import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center">
      <Image
        src={compact ? "/onlyLogo.png" : "/mainLogo.png"}
        alt="FileForge"
        width={compact ? 44 : 220}
        height={compact ? 44 : 56}
        priority
        className={cn(
          "object-contain transition group-hover:opacity-95",
          compact ? "h-12 w-12" : "h-16 w-auto sm:h-20"
        )}
      />
    </Link>
  );
}
