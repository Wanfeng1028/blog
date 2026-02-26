import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] relative overflow-hidden group",
  {
    variants: {
      variant: {
        // 赛博/极光炫目流体：动态多色渐变背景，极强烈的边缘高光与外发光呼吸阴影，悬停时触发高亮度泛光，拉满"花里胡哨"感
        default:
          "text-white bg-[linear-gradient(110deg,#1e293b,45%,#0ea5e9,55%,#1e293b)] bg-[length:200%_100%] animate-[shimmer_2s_infinite] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),_0_2px_10px_rgba(14,165,233,0.4)] border border-sky-400/30 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),_0_0_20px_rgba(56,189,248,0.8),_0_0_40px_rgba(56,189,248,0.4)] hover:-translate-y-1 hover:border-sky-300/60 active:shadow-none",
        secondary: "bg-secondary text-text hover:bg-secondary/80",
        outline: "border border-border bg-transparent hover:bg-surface/70",
        ghost: "bg-transparent hover:bg-surface/70",
        danger: "bg-red-500 text-white shadow-sm hover:bg-red-600 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(239,68,68,0.32)] active:shadow-none"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, asChild, ...props }, ref) => {
    const Comp: any = asChild ? Slot : "button";
    const disabled = loading || props.disabled;
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref as any}
        {...(asChild ? props : { ...props, disabled })}
      >
        {asChild ? children : (loading ? "Loading..." : children)}
      </Comp>
    );
  }
);
Button.displayName = "Button";
