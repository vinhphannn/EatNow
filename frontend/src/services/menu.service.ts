export type MenuItemDto = {
	name: string;
	price: number;
	type: 'food'|'drink';
	description?: string;
	imageUrl?: string;
	categoryId?: string;
	isActive?: boolean;
	position?: number;
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function parse(res: Response) {
	if (!res.ok) {
		let msg: string;
		try { const j = await res.clone().json(); msg = (Array.isArray(j?.message) ? j.message.join(', ') : (j?.message || `HTTP ${res.status}`)); } catch { msg = await res.text(); }
		throw new Error(msg || `HTTP ${res.status}`);
	}
	try { return await res.json(); } catch { return null; }
}

export const menuService = {
	async listMenuItems(restaurantId: string) {
		const res = await fetch(`${API}/api/v1/restaurants/${restaurantId}/items?sortBy=position&order=asc`, { credentials: 'include', cache: 'no-store' });
		return await parse(res);
	},
	async createMenuItem(restaurantId: string, dto: MenuItemDto) {
		const res = await fetch(`${API}/api/v1/restaurants/${restaurantId}/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(dto) });
		return await parse(res);
	},
	async updateMenuItem(itemId: string, dto: Partial<MenuItemDto>) {
		const res = await fetch(`${API}/api/v1/restaurants/items/${itemId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(dto) });
		return await parse(res);
	},
	async deleteMenuItem(itemId: string) {
		const res = await fetch(`${API}/api/v1/restaurants/items/${itemId}`, { method: 'DELETE', credentials: 'include' });
		return await parse(res);
	},
};






