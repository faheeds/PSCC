import Image from "next/image";
import { cn } from "@/lib/utils";

export function ClubLogo({
  className,
  priority = false
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <Image
        src="/pscc-logo.png"
        alt="Puget Sound Cricket Club logo"
        fill
        priority={priority}
        sizes="(max-width: 640px) 96px, 160px"
        className="object-contain"
      />
    </div>
  );
}
