import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchBusinessesQuery } from "@/client/queries/search/searchBusinesses";

import { BreadCrumb } from "./Breadcrumb";
import { Header } from "./Header";
import { MainResultArea } from "./MainReseltArea";
import { MobileFilterBar } from "./MobileFilterBar";
import { ResultHeader } from "./ResultHeader";

export function SearchResult() {
  const [query, setQuery] = useState(
    "Best AC Gas Filling in Hakimpara Siliguri",
  );

  const [searchQuery, setSearchQuery] = useState(
    "Best AC Gas Filling in Hakimpara Siliguri",
  );

  const search = useQuery(
    searchBusinessesQuery({
      query: searchQuery,
      page: 1,
      perPage: 20,
    }),
  );

  function handleSearch() {
    const value = query.trim();

    if (value.length >= 2 && value !== searchQuery) {
      setSearchQuery(value);
    }
  }

  return (
    <>
      <Header
        query={query}
        setQuery={setQuery}
        onSearch={handleSearch}
        isFetching={search.isFetching}
      />

      <BreadCrumb />

      <main className="pb-8">
        <ResultHeader />
        <MobileFilterBar />

        <MainResultArea
          data={search.data}
          isLoading={search.isLoading}
          isError={search.isError}
          error={search.error}
        />
      </main>
    </>
  );
}
