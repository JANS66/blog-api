import TaxonomyListPage from "../components/TaxonomyListPage";
import { getCategories } from "../api/categories";
import CreateCategoryModal from "../components/CreateCategoryModal";
import DeleteCategoryModal from "../components/DeleteCategoryModal";
import EditCategoryModal from "../components/EditCategoryModal";

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
