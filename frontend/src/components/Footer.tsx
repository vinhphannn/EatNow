export default function Footer() {
	return (
		<footer className="border-t bg-white">
			<div className="container mx-auto flex flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
				<div className="text-sm text-gray-600">© {new Date().getFullYear()} EatNow. All rights reserved.</div>
				<nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
					<a href="#" className="hover:text-orange-600">Giới thiệu</a>
					<a href="#" className="hover:text-orange-600">Liên hệ</a>
					<a href="#" className="hover:text-orange-600">CSKH</a>
					<a href="#" className="hover:text-orange-600">Chính sách</a>
				</nav>
			</div>
		</footer>
	);
}
