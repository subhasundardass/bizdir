import { BreadCrumb } from "./Breadcrumb";
import { Header } from "./Header";
import { MainResultArea } from "./MainReseltArea";
import { MobileFilterBar } from "./MobileFilterBar";
import { ResultHeader } from "./ResultHeader";

export function SearchResult() {
  return (
    <>
      {/* Header */}
      <Header />
      {/* SEARCH CONTEXT / BREADCRUMB */}
      <BreadCrumb />
      <main className="pb-8">
        {/* RESULT HEADER  */}
        <ResultHeader />
        {/* MOBILE FILTER BAR  */}
        <MobileFilterBar />
        {/* MAIN RESULTS AREA */}
        <MainResultArea />
      </main>
    </>
  );
}
