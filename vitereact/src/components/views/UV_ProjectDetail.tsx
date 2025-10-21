import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

// Import the project and image type definitions
import type { Project, ProjectGalleryImage } from '@/schemas/project';

// Define types for component state
interface ProjectDetailResponse {
  project: Project;
  gallery_images: ProjectGalleryImage[];
  related_projects: Project[];
}

const UV_ProjectDetail: React.FC = () => {
  const { project_slug } = useParams<{ project_slug: string }>();
  const navigate = useNavigate();

  // Fetch project details
  const { data: projectData, isLoading, isError, error } = useQuery<ProjectDetailResponse>({
    queryKey: ['project', project_slug],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/projects/${project_slug}`
      );
      if (!response.ok) throw new Error('Project not found');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    enabled: !!project_slug,
  });

  // Handle errors
  useEffect(() => {
    if (isError) {
      console.error('Error loading project:', error);
      // Consider redirecting to 404 or showing error state
    }
  }, [isError, error]);

  // Define project data with default values to prevent destructuring errors
  const project = projectData?.project || {
    project_id: '',
    title: '',
    slug: '',
    featured_image: '',
    category: '',
    excerpt: '',
    content: '',
    client: '',
    technologies: [],
    project_url: '',
    project_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: ''
  };

  const gallery_images = projectData?.gallery_images || [];
  const related_projects = projectData?.related_projects || [];

  // Format project date
  const formattedDate = format(new Date(project.project_date), 'MMMM yyyy');

  return (
    <>
      {/* Back to Portfolio Button */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-8 flex items-center group hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2 text-gray-500 group-hover:text-gray-700" />
          <span className="text-gray-600 group-hover:text-gray-900">Back to Portfolio</span>
        </Button>
      </div>

      {isLoading ? (
        // Loading state
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-20 w-3/4" />
              <div className="space-y-6">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-40 mt-8" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-32" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : isError ? (
        // Error state
        <div className="text-center py-20">
          <div className="max-w-md mx-auto px-4">
            <div className="text-red-100 bg-red-500 p-4 rounded-full inline-flex items-center justify-center w-16 h-16 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project Not Found</h3>
            <p className="text-gray-500 mb-6">
              The project you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild variant="outline">
              <Link to="/portfolio">Back to Portfolio</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <div className="relative h-96 w-full bg-gray-50 overflow-hidden">
            {project.featured_image ? (
              <img
                src={project.featured_image}
                alt={`${project.title} featured`}
                className="w-full h-full object-cover absolute inset-0"
              />
            ) : (
              <div className="bg-gray-200 w-full h-full"></div>
            )}
          </div>

          {/* Project Content */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col space-y-8 lg:space-y-0 lg:space-x-12 lg:flex-row">
                {/* Main Content */}
                <div className="lg:w-2/3">
                  <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">{project.title}</h1>
                  
                  <div className="prose prose-lg max-w-none text-gray-700 mb-12">
                    <div dangerouslySetInnerHTML={{ __html: project.content }} />
                  </div>

                  {/* Additional Sections Can Be Added Here */}
                  <div className="mt-12 border-t border-gray-200 pt-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h3>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        {project.client && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Client</dt>
                            <dd className="mt-1 text-base text-gray-900">{project.client}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Project Date</dt>
                          <dd className="mt-1 text-base text-gray-900">{formattedDate}</dd>
                        </div>
                        {project.technologies && project.technologies.length > 0 && (
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Technologies Used</dt>
                            <dd className="mt-2 flex flex-wrap gap-2">
                              {project.technologies.map((tech, index) => (
                                <span key={index} className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                  {tech}
                                </span>
                              ))}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:w-1/3">
                  <div className="sticky top-20">
                    {/* Project Overview */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Overview</h3>
                      <p className="text-gray-600 mb-4">{project.excerpt}</p>
                      {project.project_url && (
                        <div className="mt-4">
                          <a 
                            href={project.project_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            View Live Project <span aria-hidden="true">&rarr;</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Let's Work Together */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Let's Work Together</h3>
                      <p className="text-gray-600 mb-4">Have a similar project in mind? Get in touch to discuss how we can bring your ideas to life.</p>
                      <Link 
                        to="/contact" 
                        className="block w-full text-center bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                      >
                        Start a Project
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Section */}
            {gallery_images.length > 0 && (
              <div className="mt-24">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Project Gallery</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {gallery_images.map((image, index) => (
                    <div key={index} className="rounded-xl overflow-hidden group">
                      <img
                        src={image.image_url}
                        alt={image.caption || `Project Image ${index + 1}`}
                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {image.caption && (
                        <p className="mt-2 text-sm text-gray-600">{image.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Projects */}
            {related_projects.length > 0 && (
              <div className="mt-24">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">More Projects</h2>
                  <Link to="/portfolio" className="text-blue-600 font-medium hover:underline">
                    View All Projects
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {related_projects.map((relatedProject) => (
                    <Link
                      key={relatedProject.project_id}
                      to={`/portfolio/${relatedProject.slug}`}
                      className="group"
                    >
                      <div className="rounded-xl overflow-hidden mb-4 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                          <img
                            src={relatedProject.featured_image}
                            alt={relatedProject.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>
                        <div className="py-4">
                          <p className="text-sm font-medium text-blue-600 mb-1">
                            {relatedProject.category}
                          </p>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {relatedProject.title}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Project Navigation */}
      <div className="border-t border-gray-200 py-6 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Previous Project Button */}
            {related_projects.length > 0 && (
              <Button variant="outline" size="lg" className="group" asChild>
                <Link to={`/portfolio/${related_projects[0].slug}`}>
                  <ArrowLeft className="h-5 w-5 mr-2 text-gray-500 group-hover:text-blue-600 transition-colors" />
                  Previous Project
                </Link>
              </Button>
            )}
            <div className="flex-1"></div>
            {/* Next Project Button - would need additional logic for actual next in sequence */}
            <Button variant="outline" size="lg" className="group ml-auto" asChild>
              <Link to={related_projects.length > 1 ? `/portfolio/${related_projects[1].slug}` : "#"}>
                Next Project
                <ArrowLeft className="h-5 w-5 ml-2 text-gray-500 group-hover:text-blue-600 transition-colors transform rotate-180" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 mt-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Your Project?</h2>
          <p className="text-gray-600 mb-8 text-xl">
            Let's bring your vision to life. Contact us today for a free consultation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="default" className="px-8 py-4 text-lg" asChild>
              <Link to="/contact">
                Get in Touch
              </Link>
            </Button>
            <Button variant="outline" className="px-8 py-4 text-lg" asChild>
              <Link to="/portfolio">
                View More Work
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_ProjectDetail;