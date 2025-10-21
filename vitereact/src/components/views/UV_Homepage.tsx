import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { WorkflowOutline, RocketOutline, DocumentTextOutline, MailOpenOutline } from './icons';

// Interfaces for type safety
interface Project {
  project_id: string;
  title: string;
  slug: string;
  featured_image: string;
  excerpt: string;
  category: string;
  project_date: string;
}

interface UserProfile {
  full_name: string;
  bio: string;
  profile_pic_url: string;
  skills: Array<{
    name: string;
    proficiency: number;
  }>;
  experience: Array<{
    title: string;
    company: string;
    description: string;
  }>;
}

const UV_Homepage: React.FC = () => {
  // API base URL from environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  
  // Fetch featured projects
  const { data: featuredProjects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['featuredProjects'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/projects`, {
          params: { 
            featured: 'true', 
            limit: 3,
            sort_by: 'project_date',
            sort_order: 'desc'
          }
        });
        
        // Validate response format
        if (!Array.isArray(response.data)) {
          throw new Error('Invalid response format: expected array of projects');
        }
        
        return response.data;
      } catch (error) {
        console.error('Failed to fetch featured projects', error);
        throw error;
      }
    },
    staleTime: 300000, // 5 minutes
    retry: 1
  });

  // Fetch user profile data
  const { data: userProfile, isLoading: loadingProfile } = useQuery<UserProfile>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/public-profile`);
        
        // Validate response format
        if (!response.data || typeof response.data !== 'object') {
          throw new Error('Invalid user profile response');
        }
        
        return {
          full_name: response.data.full_name || '',
          bio: response.data.bio || '',
          profile_pic_url: response.data.profile_pic_url || '',
          skills: response.data.skills || [],
          experience: response.data.experience || []
        };
      } catch (error) {
        console.error('Failed to fetch user profile', error);
        throw error;
      }
    },
    staleTime: 3600000, // 1 hour
    retry: 1
  });

  // Animation effect for stats counters
  useEffect(() => {
    const countStats = () => {
      if (!userProfile) return;

      const stats = [
        { element: document.querySelector('#experience-years'), target: 5, suffix: '+', interval: 1000 },
        { element: document.querySelector('#projects-completed'), target: 50, suffix: '+', interval: 50 },
        { element: document.querySelector('#client-satisfaction'), target: 95, suffix: '%', interval: 20 }
      ];

      stats.forEach((stat) => {
        if (stat.element) {
          let current = 0;
          const increment = stat.target / 30;
          const timer = setInterval(() => {
            current += increment;
            if (current >= stat.target) {
              clearInterval(timer);
              current = stat.target;
            }
            stat.element.textContent = Math.floor(current) + (current >= stat.target ? stat.suffix : '');
          }, stat.interval / 30);
        }
      });
    };

    if (!loadingProfile) {
      countStats();
    }
  }, [loadingProfile]);

  return (
    <>
      {/* Hero Section */}
      <header className="relative w-full bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[85vh] md:min-h-[75vh] lg:min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute top-0 right-0 bottom-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-0 right-0 w-2/5 h-full bg-gradient-to-r from-transparent to-white/60 transform -skew-x-12"></div>
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                {userProfile?.full_name || 'Professional Designer & Developer'}
              </h1>
              <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-lg leading-relaxed">
                {userProfile?.bio || "Crafting exceptional digital experiences with precision and passion."}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/portfolio"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-300 transform hover:-translate-y-1"
                >
                  View My Work
                </Link>
                <Link
                  to="/contact"
                  className="inline-block border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-8 rounded-lg transition-colors duration-300"
                >
                  Get In Touch
                </Link>
              </div>
            </div>

            <div className="relative hidden md:flex items-center justify-end">
              {userProfile?.profile_pic_url ? (
                <img
                  src={userProfile.profile_pic_url}
                  alt={userProfile.full_name || "Professional Headshot"}
                  className="w-full h-auto max-w-md rounded-2xl shadow-2xl ring-2 ring-white ring-offset-4 ring-offset-blue-100"
                />
              ) : (
                <div className="w-full h-96 rounded-2xl shadow-2xl bg-gradient-to-tr from-blue-200 to-purple-200 flex items-center justify-center">
                  <div className="text-5xl text-gray-400">📸</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <div className="w-8 h-12 border-2 border-gray-700 rounded-full flex justify-center items-start p-2">
              <div className="w-1 h-3 bg-gray-700 rounded-full animate-scrolldown"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <span className="text-5xl font-bold text-blue-600 mb-2" id="experience-years">0</span>
              <p className="text-lg font-medium text-gray-700">Years Experience</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-5xl font-bold text-blue-600 mb-2" id="projects-completed">0</span>
              <p className="text-lg font-medium text-gray-700">Projects Delivered</p>
            </div>
            <div className="flex flex-col items-center col-span-2 md:col-span-1">
              <span className="text-5xl font-bold text-blue-600 mb-2" id="client-satisfaction">0%</span>
              <p className="text-lg font-medium text-gray-700">Client Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-4">What I Do</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Bringing your ideas to life through creative design and development solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <ServiceCard
              icon={<WorkflowOutline className="h-10 w-10" />}
              title="Web Development"
              description="Building responsive, fast, and secure websites with modern technologies."
            />
            
            <ServiceCard
              icon={<RocketOutline className="h-10 w-10" />}
              title="UI/UX Design"
              description="Creating intuitive and engaging user experiences with a focus on user needs."
            />
            
            <ServiceCard
              icon={<DocumentTextOutline className="h-10 w-10" />}
              title="Brand Strategy"
              description="Developing brand identities that stand out and communicate effectively."
            />
            
            <ServiceCard
              icon={<MailOpenOutline className="h-10 w-10" />}
              title="Digital Marketing"
              description="Launching marketing campaigns that drive real business results."
            />
          </div>
        </div>
      </section>

      {/* Featured Work Section */}
      <section className="py-16 sm:py-24" id="work">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Featured Projects</h2>
            <p className="text-xl text-gray-600 mt-4">A selection of my best work and projects</p>
          </div>

          {loadingProjects ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-2"
                >
                  <div className="h-60 bg-gray-200 animate-pulse"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProjects.map((project) => (
                <div 
                  key={project.project_id} 
                  className="group relative bg-white rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-2"
                >
                  <div className="h-60 overflow-hidden">
                    <img
                      src={project.featured_image}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6">
                    <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full mb-3">
                      {project.category}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {project.excerpt}
                    </p>
                    <Link
                      to={`/projects/${project.slug}`}
                      className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-800 transition-colors"
                    >
                      View Project
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No featured projects to display at the moment.</p>
            </div>
          )}

          {!loadingProjects && featuredProjects.length > 0 && (
            <div className="mt-12 text-center">
              <Link
                to="/portfolio"
                className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
              >
                View All Projects
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">My Skills</h2>
            <p className="text-xl text-gray-600 mt-4">Expertise in various technologies and tools</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {userProfile?.skills.slice(0, 8).map((skill, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-transform hover:scale-105"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="relative h-3 w-full bg-gray-200 rounded-xl">
                    <div 
                      className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"
                      style={{ width: `${skill.proficiency}%` }}
                    ></div>
                  </div>
                </div>
                <h3 className="text-center font-medium text-gray-900">
                  {skill.name}
                  <span className="block text-sm font-normal text-gray-500">
                    {skill.proficiency}%
                  </span>
                </h3>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              to="/resume"
              className="inline-flex items-center justify-center border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 px-8 rounded-lg transition-colors duration-300"
            >
              View Full Resume
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section (Placeholder) */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">What My Clients Say</h2>
            <p className="text-xl text-gray-600 mt-4">Trusted by individuals and companies</p>
          </div>
          <div className="bg-gray-50 p-10 rounded-3xl text-center max-w-3xl mx-auto">
            <blockquote className="text-xl text-gray-700 italic">
              "He transformed our business with his web development expertise. His attention to detail and problem-solving approach exceeded our expectations. We couldn't be happier with the results and look forward to working with him again in the future."
            </blockquote>
            <div className="mt-8">
              <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold">
                JD
              </div>
              <p className="text-lg font-medium text-gray-900 mt-4">John Doe</p>
              <p className="text-gray-600">CEO, Tech Solutions Inc.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-6 sm:text-4xl">Start Your Project Today</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Let's work together to create something amazing. I'm ready to bring your ideas to life.
          </p>
          
          <Link
            to="/contact"
            className="inline-block bg-white text-blue-600 hover:bg-gray-100 font-semibold py-4 px-12 rounded-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 text-lg"
          >
            Get In Touch
          </Link>
          
          <div className="mt-20 flex flex-wrap justify-center gap-20">
            {[
              { value: "10+", label: "Happy Clients" },
              { value: "100%", label: "Satisfaction" },
              { value: "24/7", label: "Support" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-extrabold mb-2">{item.value}</p>
                <p className="text-blue-100">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

// Service Card Component
const ServiceCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md h-full flex flex-col">
    <div className="h-16 w-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
    <p className="text-gray-600 mb-0">{description}</p>
  </div>
);

// Export as default
export default UV_Homepage;