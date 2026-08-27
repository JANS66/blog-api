import TaxonomyListPage from "../components/TaxonomyListPage";
import { getTags } from "../api/tags";

export default function TagListPage() {
  return (
    <TaxonomyListPage
      title="Tags"
      queryKey="tags"
      fetchFn={getTags}
      dataKey="tags"
      paramKey="tag"
      showTagIcon={true}
    />
  );
}
