import { useMemo, useState } from "react";
import { ProjectData } from "@/types/project";
import { FilterOption } from "@/components/filter-chips";
import { SortOption } from "@/components/sort-selector";
import { getProjectStatus } from "@/components/project-status-badge";

export function useProjectFilters(projects: ProjectData[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [sortOption, setSortOption] = useState<SortOption>("date-desc");

  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((project) =>
        project.name.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterOption !== "all") {
      result = result.filter((project) => {
        if (!project.results) return false;
        const status = getProjectStatus(project.results.roi, project.results.npv);
        return status === filterOption;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "roi-desc":
          return (b.results?.roi || 0) - (a.results?.roi || 0);
        case "roi-asc":
          return (a.results?.roi || 0) - (b.results?.roi || 0);
        case "npv-desc":
          return (b.results?.npv || 0) - (a.results?.npv || 0);
        case "npv-asc":
          return (a.results?.npv || 0) - (b.results?.npv || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [projects, searchQuery, filterOption, sortOption]);

  const counts = useMemo(() => {
    const projectsWithResults = projects.filter((p) => p.results);

    return {
      all: projects.length,
      viable: projectsWithResults.filter((p) => 
        getProjectStatus(p.results!.roi, p.results!.npv) === 'viable'
      ).length,
      review: projectsWithResults.filter((p) => 
        getProjectStatus(p.results!.roi, p.results!.npv) === 'review'
      ).length,
      not_viable: projectsWithResults.filter((p) => 
        getProjectStatus(p.results!.roi, p.results!.npv) === 'not_viable'
      ).length,
    };
  }, [projects]);

  return {
    filteredProjects: filteredAndSortedProjects,
    searchQuery,
    setSearchQuery,
    filterOption,
    setFilterOption,
    sortOption,
    setSortOption,
    counts,
  };
}
