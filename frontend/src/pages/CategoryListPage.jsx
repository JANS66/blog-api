import TaxonomyListPage from "../pages/TaxonomyListPage";
import { getCategories } from "../api/categories";
import CreateCategoryModal from "../features/categories/CreateCategoryModal";
import DeleteCategoryModal from "../features/categories/DeleteCategoryModal";
import EditCategoryModal from "../features/categories/EditCategoryModal";

export default function CategoryListPage() {
  return (
    <TaxonomyListPage
      title="Categories"
      queryKey="categories"
      fetchFn={getCategories}
      dataKey="categories"
      paramKey="category"
      CreateModal={CreateCategoryModal}
      EditModal={EditCategoryModal}
      DeleteModal={DeleteCategoryModal}
    />
  );
}
