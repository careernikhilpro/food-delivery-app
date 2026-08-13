import ClientCategoryPage from './ClientCategoryPage';

export function generateStaticParams() {
  return [
    { name: 'All' },
    { name: 'Burgers' },
    { name: 'Burger' },
    { name: 'Biryani' },
    { name: 'Noodles' },
    { name: 'Momos' },
    { name: 'Pizza' },
    { name: 'Pizzas' },
    { name: 'Rolls' },
    { name: 'Ice Cream' },
    { name: 'Cake' },
    { name: 'Sandwich' },
    { name: 'Paratha' },
    { name: 'Pasta' },
    { name: 'Khichdi' },
    { name: 'Kebab' },
    { name: 'Coffee' },
    { name: 'Pastry' },
    { name: 'Dosa' },
    { name: 'Gulab Jamun' },
    { name: 'Juice' },
    { name: 'Pav Bhaji' },
    { name: 'Poha' },
    { name: 'Poori' },
    { name: 'Jalebi' },
    { name: 'Pakoda' },
    { name: 'Kachori' },
    { name: 'Cutlet' },
  ];
}

export default function Page({ params }: { params: { name: string } }) {
  return <ClientCategoryPage params={params} />;
}
