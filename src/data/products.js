export const products = [
  {
    id: 'forma-coat',
    name: 'The Forma Coat',
    category: 'Ready-to-wear',
    price: 895,
    color: 'Warm stone',
    image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1000&q=85',
    description: 'A beautifully balanced silhouette in a soft, substantial wool blend. Designed for layering, and for keeping.',
    label: 'BESTSELLER',
  },
  {
    id: 'noa-tote',
    name: 'Noa Leather Tote',
    category: 'Bags',
    price: 640,
    color: 'Espresso',
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=85',
    description: 'Quietly practical, endlessly considered. Cut from supple Italian leather with room for everything that matters.',
    label: 'NEW ARRIVAL',
  },
  {
    id: 'silk-column-dress',
    name: 'Silk Column Dress',
    category: 'Ready-to-wear',
    price: 720,
    color: 'Soft ivory',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=85',
    description: 'Fluid silk falls in a clean, uninterrupted line. A considered piece for evenings that ask for very little else.',
  },
  {
    id: 'sculpted-loafer',
    name: 'Sculpted Loafer',
    category: 'Shoes',
    price: 510,
    color: 'Black',
    image: 'https://images.unsplash.com/photo-1531310197839-ccf54634509e?auto=format&fit=crop&w=1000&q=85',
    description: 'A refined everyday classic, shaped in smooth leather with a softly structured profile and a comfortable low heel.',
  },
  {
    id: 'daylight-knit',
    name: 'Daylight Cashmere Knit',
    category: 'Ready-to-wear',
    price: 460,
    color: 'Oatmeal',
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=85',
    description: 'Light, soft cashmere with a relaxed drape. An effortless layer to return to, season after season.',
    label: 'EXCLUSIVE',
  },
  {
    id: 'arc-shoulder-bag',
    name: 'Arc Shoulder Bag',
    category: 'Bags',
    price: 785,
    color: 'Toffee',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=85',
    description: 'A soft sculptural shape meets considered function in this compact shoulder bag, finished by hand in Italy.',
  },
  {
    id: 'linen-trouser',
    name: 'Tailored Linen Trouser',
    category: 'Ready-to-wear',
    price: 385,
    color: 'Natural',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85',
    description: 'An easy, polished trouser in breathable European linen, with a gentle drape and a timeless straight leg.',
  },
  {
    id: 'golden-hour-earrings',
    name: 'Golden Hour Hoops',
    category: 'Accessories',
    price: 245,
    color: 'Recycled gold vermeil',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85',
    description: 'Sculptural, lightweight hoops made to catch the light. Crafted in recycled sterling silver with gold vermeil.',
    label: 'SMALL BATCH',
  },
]

export const formatPrice = (price) => {
  const amount = Number(price)
  const hasCents = Number.isFinite(amount) && !Number.isInteger(amount)

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)
}
