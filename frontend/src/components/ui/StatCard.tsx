"use client";

import { Card, CardContent, Stack, Typography, Box } from "@mui/material";
import React from "react";

export interface StatCardProps {
	label: string;
	value: string | number | React.ReactNode;
	icon?: React.ReactNode;
	subtext?: string;
	colorBoxBg?: string;
}

export default function StatCard({ label, value, icon, subtext, colorBoxBg }: StatCardProps) {
	return (
		<Card elevation={0} sx={{ border: theme => `1px solid ${theme.palette.divider}` }}>
			<CardContent>
				<Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
					<Box sx={{ width: 48, height: 48, borderRadius: 1.5, bgcolor: colorBoxBg || "action.hover", display: "flex", alignItems: "center", justifyContent: "center" }}>
						{icon}
					</Box>
					<Box sx={{ flex: 1 }}>
						<Typography variant="body2" color="text.secondary">{label}</Typography>
						<Typography variant="h5" color="text.primary">{value}</Typography>
						{subtext && (
							<Typography variant="caption" color="text.secondary">{subtext}</Typography>
						)}
					</Box>
				</Stack>
			</CardContent>
		</Card>
	);
}



