import data from './data.json';

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1>Categories</h1>
      <section className="flex flex-1 flex-col gap-4">
        {data.map((category) => (
          <div
            key={category.id}
            className="px-4 py-6 border rounded shadow-sm"
          >
            <h2>{category.name}</h2>
          </div>
        ))}

      </section>
    </div>
  )
}
