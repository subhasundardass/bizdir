import { useQuery } from "@tanstack/react-query";
import { Route } from "@/routes/result";
import { searchBusinessesQuery } from "@/client/queries/search/searchBusinesses";
import type { SearchValues } from "@/components/BusinessSearchForm";
import { BreadCrumb } from "./Breadcrumb";
import { ResultHeader } from "./ResultHeader";
import { MobileFilterBar } from "./MobileFilterBar";
import { Header } from "./Header";
import { MainResultArea } from "./MainReseltArea";

export function SearchResult() {
  const values = Route.useSearch();
  const navigate = Route.useNavigate();
  const search = useQuery(searchBusinessesQuery({ ...values, perPage: 20 }));
  function handleSearch(next: SearchValues) {
    void navigate({
      search: { ...next, locationId: next.locationId, page: 1 },
    });
  }
  const total = search.data?.total ?? 0;
  return (
    <>
      <Header
        values={values}
        onSearch={handleSearch}
        isFetching={search.isFetching}
      />
      <BreadCrumb
        query={values.query}
        location={search.data?.location?.name ?? values.location}
      />
      <main className="pb-8">
        <ResultHeader
          query={values.query}
          location={search.data?.location?.name ?? values.location}
          total={search.data?.total}
        />
        <MobileFilterBar />
        {search.data?.locationUnresolved && (
          <p
            role="status"
            className="mx-auto max-w-360 px-6 py-3 text-sm text-jd-orange"
          >
            We couldn’t find that location. Try another spelling or select a
            suggested location.
          </p>
        )}
        <MainResultArea
          data={search.data}
          isLoading={search.isLoading && search.fetchStatus !== "idle"}
          isError={search.isError}
          error={search.error}
        />
        {total > 20 && (
          <nav
            aria-label="Search result pages"
            className="flex items-center justify-center gap-4"
          >
            <button
              disabled={values.page <= 1 || search.isFetching}
              onClick={() =>
                navigate({ search: { ...values, page: values.page - 1 } })
              }
            >
              Previous
            </button>
            <span>
              Page {values.page} of {Math.ceil(total / 20)}
            </span>
            <button
              disabled={values.page * 20 >= total || search.isFetching}
              onClick={() =>
                navigate({ search: { ...values, page: values.page + 1 } })
              }
            >
              Next
            </button>
          </nav>
        )}
      </main>
    </>
  );
}
