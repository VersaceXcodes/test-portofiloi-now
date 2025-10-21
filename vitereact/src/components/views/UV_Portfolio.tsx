import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import type { Project } from '@/store/types';
import { projectQuerySchema } from '@/schemas/project';
import * as z from 'zod';

// Type definition for category filters
interface CategoryFilter {
  id: string;
  name: string;
  slug: string;
}

const UV_Portfolio: React.FC = () => {
  // Get URL search parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';

  // State for filters and search
  const [selectedCategories, setSelectedCategories] = useState<string[]>([categoryParam].filter(Boolean));
  const [searchQuery, setSearchQuery] = useState<string>(searchParam);
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchParam);
  
  // Access store methods for project filtering
  const projects = useAppStore((state) => state.projects);
  const setProjects = useAppStore((state) => state.setProjects);
  const setSelectedProject = useAppStore((state) => state.setSelectedProject);
  const filteredProjects = useAppStore((state) => state.filteredProjects);
  const setSearchQueryStore = useAppStore((state) => state.setSearchQuery);
  const setFilterCategoryStore = useAppStore(
    (state) => state.setFilterCategory
  );

  // Debounce search input
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setSearchQueryStore(searchQuery);
      updateUrlParams({ search: searchQuery, category: selectedCategories[0] });
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchQuery, selectedCategories]);

  // Check if the URL contains query parameters and update state accordingly
  useEffect(() => {
    if (categoryParam) {
      handleCategoryChange(categoryParam);
    }
  }, [categoryParam]);

  // Fetch projects using React Query
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<Project[]>({
    queryKey: ['projects', { category: categoryParam, search: debouncedSearch }],
    queryFn: async () => {
      const baseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/projects`;
      const params = new URLSearchParams();
      
      if (categoryParam) {
        params.append('category', categoryParam);
      }
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const res = await fetch(`${baseUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }

      const rawData = await res.json();
      const parsed = z.array(projectQuerySchema).safeParse(rawData);
      
      if (!parsed.success) {
        console.error('API response validation failed:', parsed.error);
        throw new Error('Failed to validate API response');
      }

      setProjects(parsed.data);
      return parsed.data;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    select: (data) => data || [],
  });

  // Update projects in store when query returns data
  useEffect(() => {
    if (data && data.length) {
      setProjects(data);
    }
  }, [data, setProjects]);

  // Update URL parameters when filters change
  const updateUrlParams = useCallback(
    ({ search, category }: { search?: string; category?: string }) => {
      const newSearchParams = new URLSearchParams();
      
      if (search) newSearchParams.set('search', search);
      if (category) newSearchParams.set('category', category);
      
      setSearchParams(newSearchParams, { replace: true });
    },
    [setSearchParams]
  );

  // Handle category selection
  const handleCategoryChange = useCallback(
    (categorySlug: string) => {
      const newCategories = [categorySlug];
      setFilterCategoryStore(categorySlug);
      setSelectedCategories(newCategories);
      updateUrlParams({
        search: searchQuery,
        category: categorySlug,
      });
      
      // Clear all categories when clicking an active category
      if (selectedCategories.includes(categorySlug)) {
        setSelectedCategories([]);
        setFilterCategoryStore('');
        updateUrlParams({
          search: searchQuery,
          category: '',
        });
      }
    },
    [updateUrlParams, selectedCategories, searchQuery]
  );

  // Extract unique categories for filtering
  const allCategories = useMemo(
    () => [
      { id: 'all', name: 'All Projects', slug: '' },
      ...Array.from(
        new Set(projects.map((project) => project.category).filter(Boolean))
      ).map((category) => ({
        id: category.toLowerCase().replace(/\s+/g, '-'),
        name: category,
        slug: category,
      })),
    ],
    [projects]
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Categories Section */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
              <h2 className="text-3xl font-bold text-gray-900">
                Our Portfolio
              </h2>
              
              <div className="w-full md:w-80">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    aria-label="Search projects"
                  />
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-3 justify-center mb-8">
              {allCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                    selectedCategories.includes(category.slug)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-100'
                  }`}
                  aria-current={
                    selectedCategories.includes(category.slug)
                      ? 'page'
                      : undefined
                  }
                >
                  {category.name}
                  {selectedCategories.includes(category.slug) && (
                    <span className="ml-1" aria-hidden="true">
                      ×
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Selected Filters */}
            {selectedCategories.length > 0 && (
              <div className="flex justify-center mb-6">
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setSearchQuery('');
                    setDebouncedSearch('');
                    setSearchQueryStore('');
                    setFilterCategoryStore('');
                    setSearchParams({}, { replace: true });
                  }}
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium group transition-colors"
                >
                  <svg
                    className="mr-1 h-4 w-4 text-blue-600 group-hover:text-blue-800"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="mx-auto grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse bg-white rounded-xl shadow-md overflow-hidden"
                >
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="w-1/4 h-3 bg-gray-200 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="w-5/6 h-3 bg-gray-200 rounded"></div>
                      <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Whoops! Something went wrong
              </h3>
              <p className="mt-1 text-gray-600">
                {error instanceof Error ? 
                  "We couldn't load the portfolio at the moment. Please try again later." : 
                  String(error)
                }
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retry
                <svg
                  className="ml-2 -mr-0.5 h-4 w-4 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No projects found
              </h3>
              <p className="mt-1 text-gray-500">
                {selectedCategories.length > 0 || searchQuery
                  ? "No projects match your current filter criteria."
                  : "There are currently no projects to display."}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategories([]);
                    setSearchQuery('');
                    setSearchParams({}, { replace: true });
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.map((project) => (
                <Link
                  key={project.project_id}
                  to={`/projects/${encodeURIComponent(project.project_id)}`}
                  className="group block rounded-xl overflow-hidden shadow-lg bg-white transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100 transition-colors"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="relative pt-[70%] overflow-hidden">
                    {project.featured_image ? (
                      <img
                        src={project.featured_image}
                        alt={project.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                        <svg
                          className="h-12 w-12 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 5a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2H4zm10.504 6.214l-4.625 4.625a.75.75 0 01-1.125-1.125l5.38-5.38a.75.75 0 011.061 0l5.38 5.38a.75.75 0 01-1.06 1.06l-4.625-4.625a.75.75 0 01-1.06 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                      <div className="p-4 text-white translate-y-2 group-hover:translate-y-0 transition-transform">
                        <span className="text-xs font-semibold bg-blue-500 px-2 py-1 rounded-full mb-2 inline-block capitalize">
                          {project.category || 'Uncategorized'}
                        </span>
                        <h3 className="text-xl font-bold leading-tight line-clamp-1">
                          {project.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">
                        {project.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3 h-14">
                        {project.excerpt ||
                          'No description available for this project.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies &&
                        project.technologies.slice(0, 3).map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tech}
                          </span>
                        ))}
                      {project.technologies && project.technologies.length > 3 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{project.technologies.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <svg
                        className="mr-1.5 h-4 w-4 flex-shrink-0 text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.75 2a.75.75 0 01.75.75V3h7v-.25a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v14.5a.75.75 0 01-.75.75h-11a.75.75 0 01-.75-.75V2.25c0-.414.336-.75.75-.75h.5zm9 0h.5a.25.25 0 01.25.25v14.5a.25.25 0 01-.25.25h-11a.25.25 0 01-.25-.25V2.25A.25.25 0 015.75 2h.5V.75a.75.75 0 111.5 0v.5h7V.75a.75.75 0 011.5 0v1.25zM7.5 4.75A.75.75 0 018.25 4h3.5a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {project.project_date
                        ? new Date(project.project_date).toLocaleDateString(
                            'en-US',
                            { year: 'numeric', month: 'short' }
                          )
                        : 'No date'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_Portfolio;