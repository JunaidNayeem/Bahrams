"use client";

import { Button } from "@/components/ui/button";
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/components/ui/use-toast";

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: "Added to cart",
            description: "Tussar silk saree with zari border.",
            action: <ToastAction altText="View cart">View cart</ToastAction>,
          })
        }
      >
        Default toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            variant: "success",
            title: "Address saved",
            description: "We deliver to 110017, and cash on delivery is available.",
          })
        }
      >
        Success toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            variant: "destructive",
            title: "This piece has just sold",
            description: "It was one of a kind. Similar weaves are below.",
          })
        }
      >
        Error toast
      </Button>
    </div>
  );
}
