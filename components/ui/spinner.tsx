import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
    return (
        <Loader2Icon
            data-slot="spinner"
            role="status"
            aria-label="Loading"
            className={cn("size-16 animate-spin", className)}
            {...props}
        />
    );
}

export { Spinner };

export function ScreenSpinner() {
    return (
        <div className="absolute inset-0 w-full flex h-full justify-center items-center">
            <Spinner />
        </div>
    );
}
