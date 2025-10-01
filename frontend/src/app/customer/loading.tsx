export default function Loading() {
	return (
		<main className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-10">
				<div className="h-28 w-full animate-pulse rounded-2xl bg-gray-200" />
				<div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="h-10 w-full animate-pulse rounded-xl bg-gray-200" />
					))}
				</div>
				<div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<div key={i} className="h-48 w-full animate-pulse rounded-2xl bg-gray-200" />
					))}
				</div>
			</div>
		</main>
	);
}
