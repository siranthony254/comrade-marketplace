import { STATUS_LABEL, type OrderStatus } from "@/lib/order-state";
import { cn } from "@/lib/utils";

const TONE: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-800",
  PLACED: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800",
  READY: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-teal-100 text-teal-800",
  COMPLETED: "bg-green-100 text-green-800",
  DISPUTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", TONE[status])}>{STATUS_LABEL[status]}</span>;
}
