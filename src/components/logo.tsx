import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  titleSize?: string;
  subTitleSize?: string;
}

export default function Logo({ className, titleSize = "text-sm", subTitleSize = "text-xs" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="Logo RT 004"
        width={50}
        height={50}
        className="h-auto w-auto"
      />
      <div className="flex flex-col">
        <h1 className={cn("font-bold text-foreground font-headline leading-tight", titleSize)}>
          RT 004
        </h1>
        <p className={cn("text-muted-foreground leading-tight", subTitleSize)}>
          Wisma Tajur
        </p>
      </div>
    </div>
  );
}
