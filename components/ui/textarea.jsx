import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        // resize-y, not the browser default of `both` — dragging a textarea
        // wider than the dialog it sits in breaks the layout, and every
        // textarea in this app is in a fixed-width column or modal.
        "flex min-h-[80px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 dark:text-white ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea };
