"use client";

import { useEffect } from "react";

export default function AdminIndex() {
	useEffect(() => {
		window.location.href = "/admin/dashboard";
	}, []);
	
	return <div>Redirecting...</div>;
}



