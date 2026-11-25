import ProductCard from './ProductCard.jsx'

export default function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-6">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  )
}
