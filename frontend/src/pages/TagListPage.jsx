import TaxonomyListPage from "./TaxonomyListPage";
import { getTags } from "../api/tags";
import DeleteTagModal from "../features/tags/DeleteTagModal";

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
