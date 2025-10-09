"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService, MenuItemDto } from "@/services/menu.service";

export function useMenuItems(restaurantId: string | undefined) {
	return useQuery({
		queryKey: ["menu-items", restaurantId],
		enabled: Boolean(restaurantId),
		queryFn: () => menuService.listMenuItems(restaurantId as string),
	});
}

export function useMenuItemActions(restaurantId: string | undefined) {
	const qc = useQueryClient();

	const create = useMutation({
		mutationFn: (dto: MenuItemDto) => menuService.createMenuItem(restaurantId as string, dto),
		onSuccess: () => { qc.invalidateQueries({ queryKey: ["menu-items", restaurantId] }); },
	});

	const update = useMutation({
		mutationFn: ({ itemId, dto }: { itemId: string; dto: Partial<MenuItemDto> }) => menuService.updateMenuItem(itemId, dto),
		onSuccess: () => { qc.invalidateQueries({ queryKey: ["menu-items", restaurantId] }); },
	});

	const remove = useMutation({
		mutationFn: (itemId: string) => menuService.deleteMenuItem(itemId),
		onSuccess: () => { qc.invalidateQueries({ queryKey: ["menu-items", restaurantId] }); },
	});

	return { create, update, remove };
}



