import SharedBreadcrumb from 'src/components/Breadcrumb';
import { useTranslation } from 'react-i18next';
import path from 'src/constant/path';

interface BreadcrumbProps {
  categoryName: string;
  categoryId: string;
  productName: string;
}

const Breadcrumb = ({ categoryName, categoryId, productName }: BreadcrumbProps) => {
  const { t } = useTranslation('common');

  const items = [
    { label: t('breadcrumb.home'), to: path.home },
    { label: categoryName, to: `${path.products}?category=${categoryId}` },
    { label: productName },
  ];

  return <SharedBreadcrumb items={items} />;
};

export default Breadcrumb;
