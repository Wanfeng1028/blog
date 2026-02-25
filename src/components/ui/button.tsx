import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        // Uiverse-inspired gradient button style.
        default:
          "relative overflow-hidden border border-sky-300/30 bg-[linear-gradient(135deg,#46b7ff_0%,#6366f1_55%,#a855f7_100%)] text-white shadow-[0_10px_25px_-10px_rgba(99,102,241,0.95)] before:absolute before:inset-0 before:bg-[radial-gradient(120px_circle_at_20%_-20%,rgba(255,255,255,0.7),transparent_45%)] before:opacity-80 before:transition-opacity hover:before:opacity-100 after:absolute after:inset-0 after:bg-[linear-gradient(120deg,transparent_25%,rgba(255,255,255,0.35)_45%,transparent_65%)] after:translate-x-[-160%] after:transition-transform after:duration-700 hover:after:translate-x-[160%]",
        secondary: "bg-secondary text-text hover:opacity-90",
        outline: "border border-border bg-transparent hover:bg-surface/70",
        ghost: "bg-transparent hover:bg-surface/70",
        danger: "bg-red-600 text-white hover:bg-red-700"
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
        {asChild ? children : <span className="relative z-10">{loading ? "Loading..." : children}</span>}
      </Comp>
    );
  }
);
Button.displayName = "Button";
