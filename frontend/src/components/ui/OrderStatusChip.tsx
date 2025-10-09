"use client";

import { Chip } from "@mui/material";
import {
	ClockIcon,
	CheckCircleIcon,
	WrenchScrewdriverIcon,
	CubeIcon,
	TruckIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import React from "react";

type StatusKey = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";

const STATUS_CONFIG: Record<StatusKey, { label: string; color: any; Icon: React.FC<React.SVGProps<SVGSVGElement>> }> = {
	pending: { label: "Chờ xác nhận", color: "warning", Icon: ClockIcon },
	confirmed: { label: "Đã xác nhận", color: "info", Icon: CheckCircleIcon },
	preparing: { label: "Đang chuẩn bị", color: "secondary", Icon: WrenchScrewdriverIcon },
	ready: { label: "Sẵn sàng", color: "success", Icon: CubeIcon },
	delivered: { label: "Đã giao", color: "default", Icon: TruckIcon },
	cancelled: { label: "Đã hủy", color: "error", Icon: XMarkIcon },
};

export function OrderStatusChip({ status }: { status: StatusKey }) {
	const cfg = STATUS_CONFIG[status];
	const Icon = cfg.Icon;
	return (
		<Chip
			size="small"
			variant="filled"
			color={cfg.color}
			icon={<Icon width={16} height={16} />}
			label={cfg.label}
		/>
	);
}

export default OrderStatusChip;


