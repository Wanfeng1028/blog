import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        // 水鸭青主按钮：沉稳、极简，与浅蓝毛玻璃背景和谐
        default:
          "bg-teal-600 text-white shadow-sm hover:bg-teal-700 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(13,148,136,0.38)] active:shadow-none",
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
