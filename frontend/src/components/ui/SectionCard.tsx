"use client";

import { Card, CardHeader, CardContent, CardActions, CardHeaderProps } from "@mui/material";
import React from "react";

export interface SectionCardProps {
	title?: React.ReactNode;
	subheader?: React.ReactNode;
	actions?: React.ReactNode;
	children?: React.ReactNode;
}

export default function SectionCard({ title, subheader, actions, children }: SectionCardProps) {
	return (
		<Card elevation={0} sx={{ border: theme => `1px solid ${theme.palette.divider}` }}>
			{(title || subheader) && (
				<CardHeader title={title} subheader={subheader} action={actions as CardHeaderProps["action"]} />
			)}
			<CardContent>
				{children}
			</CardContent>
		</Card>
	);
}


