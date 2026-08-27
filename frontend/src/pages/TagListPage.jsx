import TaxonomyListPage from "../components/TaxonomyListPage";
import { getTags } from "../api/tags";
import DeleteTagModal from "../components/DeleteTagModal";

export default function TagListPage() {
  return (
    <TaxonomyListPage
      title="Tags"
      queryKey="tags"
      fetchFn={getTags}
      dataKey="tags"
      paramKey="tag"
      showTagIcon={true}
      DeleteModal={DeleteTagModal}
    />
  );
}
