import ClientCategoryPage from './ClientCategoryPage';

export function generateStaticParams() {
  return [
    { name: 'Burgers' },
    { name: 'Burger' },
    { name: 'Biryani' },
    { name: 'Noodles' },
    { name: 'Momos' },
    { name: 'Pizza' },
    { name: 'Pizzas' },
    { name: 'Rolls' },
  ];
}

export default function Page({ params }: { params: { name: string } }) {
  return <ClientCategoryPage params={params} />;
}
