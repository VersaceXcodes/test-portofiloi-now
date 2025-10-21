import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useQuery, useQueries } from '@tanstack/react-query';
import axios from 'axios';
import { skillSchema, experienceSchema, educationSchema, resumeSchema } from '@/schemas/zod';
import { type Skill, type Experience, type Education, type Resume } from '@/schemas/zod';
import { Spinner } from '@/components/ui/spinner';

const UV_About: React.FC = () => {
  // Zustand state
  const currentUser = useAppStore(state => state.currentUser);
  const setError = useAppStore(state => state.setError);
  
  // API base URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // Fetch all required data in parallel
  const results = useQueries({
    queries: [
      {
        queryKey: ['userSkills', currentUser?.user_id],
        queryFn: async () => {
          if (!currentUser?.user_id) return { skills: [] };
          try {
            const response = await axios.get(
              `${apiBaseUrl}/api/users/${currentUser.user_id}/skills`
            );
            return skillSchema.parse(response.data);
          } catch (err) {
            setError('Failed to load skills. Please try again later.');
            console.error('Error fetching skills:', err);
            return { skills: [] };
          }
        },
        enabled: !!currentUser?.user_id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
      },
      {
        queryKey: ['experiences', currentUser?.user_id],
        queryFn: async () => {
          if (!currentUser?.user_id) return { experiences: [] };
          try {
            const response = await axios.get(
              `${apiBaseUrl}/api/users/${currentUser.user_id}/experiences`
            );
            return experienceSchema.parse(response.data);
          } catch (err) {
            setError('Failed to load work experience. Please try again later.');
            console.error('Error fetching experiences:', err);
            return { experiences: [] };
          }
        },
        enabled: !!currentUser?.user_id,
        staleTime: 5 * 60 * 1000,
        retry: 1,
      },
      {
        queryKey: ['education', currentUser?.user_id],
        queryFn: async () => {
          if (!currentUser?.user_id) return { education: [] };
          try {
            const response = await axios.get(
              `${apiBaseUrl}/api/users/${currentUser.user_id}/education`
            );
            return educationSchema.parse(response.data);
          } catch (err) {
            setError('Failed to load education. Please try again later.');
            console.error('Error fetching education:', err);
            return { education: [] };
          }
        },
        enabled: !!currentUser?.user_id,
        staleTime: 60 * 60 * 1000, // 1 hour
        retry: 1,
      },
      {
        queryKey: ['resume', currentUser?.user_id],
        queryFn: async () => {
          if (!currentUser?.user_id) return { resume: null };
          try {
            const response = await axios.get(
              `${apiBaseUrl}/api/users/${currentUser.user_id}/resume`
            );
            return resumeSchema.parse(response.data);
          } catch (err) {
            setError('Failed to load resume. Please try again later.');
            console.error('Error fetching resume:', err);
            return { resume: null };
          }
        },
        enabled: !!currentUser?.user_id,
        staleTime: 60 * 60 * 1000,
        retry: 1,
      }
    ]
  });

  // Destructure query results
  const [
    skillsQuery,
    experiencesQuery,
    educationQuery,
    resumeQuery
  ] = results;

  // Extract data from queries
  const skills = skillsQuery.data?.skills || [];
  const experiences = experiencesQuery.data?.experiences || [];
  const education = educationQuery.data?.education || [];
  const resumeUrl = resumeQuery.data?.resume?.file_url || '';

  // Group skills by category
  const groupedSkills = useMemo(() => {
    return skills.reduce((acc: Record<string, Skill[]>, skill: Skill) => {
      const category = skill.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {});
  }, [skills]);

  // Check loading state
  const isLoading = results.some(query => query.isLoading);
  const showSkeleton = isLoading && !skills.length && !experiences.length;

  // Handler for download resume
  const handleDownloadResume = (url: string, fileName: string = 'resume.pdf') => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date range
  const formatDateRange = (startDate: Date, endDate?: Date | null, isCurrent: boolean = false) => {
    const start = new Date(startDate);
    const end = isCurrent ? null : endDate ? new Date(endDate) : null;

    const startFormatted = `${start.toLocaleString('default', { month: 'short' })} ${start.getFullYear()}`;
    const endFormatted = end 
      ? `${end.toLocaleString('default', { month: 'short' })} ${end.getFullYear()}`
      : isCurrent ? 'Present' : 'Present';

    return `${startFormatted} - ${endFormatted}`;
  };

  return (
    <>
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About {currentUser?.full_name || 'Me'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {showSkeleton ? 'Loading...' : 'Passionate professional with diverse skills and experiences.'}
            </p>
          </div>

          {/* Profile Section */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-7xl mx-auto">
            <div className="md:flex">
              <div className="md:w-1/3 p-6 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="aspect-square relative rounded-lg overflow-hidden shadow-lg mb-6">
                  {showSkeleton ? (
                    <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                  ) : currentUser?.profile_pic_url ? (
                    <img
                      src={currentUser.profile_pic_url}
                      alt={`${currentUser.full_name}'s profile`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-500">
                      {currentUser?.full_name?.charAt(0) || 'A'}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">Email</h3>
                    <p className="text-gray-600">
                      {showSkeleton ? 'loading@email.com' : currentUser?.email}
                    </p>
                  </div>

                  {resumeUrl && (
                    <button
                      onClick={() => handleDownloadResume(resumeUrl, `${currentUser?.full_name || 'resume'}.pdf`)}
                      className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      Download Full Resume
                    </button>
                  )}
                </div>
              </div>

              <div className="md:w-2/3 p-6 md:p-8">
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Professional Profile</h2>
                  {showSkeleton ? (
                    <div>
                      <p className="h-3 w-full bg-gray-200 rounded mb-2"></p>
                      <p className="h-3 w-full bg-gray-200 rounded mb-2"></p>
                      <p className="h-3 w-3/4 bg-gray-200 rounded mb-4"></p>
                    </div>
                  ) : (
                    <p className="text-gray-600 leading-relaxed">
                      {currentUser?.bio || 'No bio available.'}
                    </p>
                  )}
                </section>

                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Skills & Expertise</h2>
                  {showSkeleton ? (
                    <div className="space-y-6">
                      {[1, 2, 3].map((_, index) => (
                        <div key={index}>
                          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{width: '75%'}}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : Object.entries(groupedSkills).length > 0 ? (
                    Object.entries(groupedSkills).map(([category, skills]) => (
                      <div key={category} className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">{category}</h3>
                        <div className="space-y-4">
                          {skills.map((skill) => (
                            <div key={skill.skill_id} className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-700">{skill.name}</span>
                                <span className="text-gray-500 text-sm">{skill.proficiency}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                  style={{ width: `${skill.proficiency}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No skills data available.</p>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Work Experience</h2>
            
            {showSkeleton ? (
              <div className="space-y-8">
                {[1, 2, 3].map((_, index) => (
                  <div key={index} className="relative pl-8 sm:pl-32 pb-8 group">
                    <div className="flex flex-col sm:flex-row items-start mb-1 group-last:before:hidden before:absolute before:left-2 sm:before:left-28 before:h-full before:px-px before:bg-gray-200 before:self-start before:-translate-x-1/2 before:translate-y-3 after:absolute after:left-2 sm:after:left-28 after:w-2 after:h-2 after:bg-blue-500 after:border-4 after:box-content after:border-gray-50 after:rounded-full after:-translate-x-1/2 after:translate-y-1.5">
                      <div className="w-full sm:w-48 mb-3 text-gray-500"></div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : experiences.length > 0 ? (
              <div className="relative">
                {experiences.map((experience, index) => (
                  <div key={experience.experience_id} className="relative pl-8 sm:pl-28 pb-8 group">
                    <div className="flex flex-col sm:flex-row items-start mb-1 group-last:before:hidden before:absolute before:left-2 sm:before:left-0 before:h-full before:px-px before:bg-gray-200 before:self-start before:-translate-x-1/2 before:translate-y-3 after:absolute after:left-2 after:w-3 after:h-3 after:bg-blue-500 after:border-4 after:box-content after:border-gray-50 after:rounded-full after:-translate-x-1/2 after:translate-y-2">
                      <div className="w-48 mb-3 text-gray-500">
                        {formatDateRange(experience.start_date, experience.end_date, experience.current)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800">
                          {experience.title}
                        </h3>
                        <p className="text-blue-600 font-medium mb-2">
                          {experience.company}
                          {experience.location && `, ${experience.location}`}
                        </p>
                        <p className="text-gray-600 whitespace-pre-line">
                          {experience.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No work experience data available.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Education</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {showSkeleton ? (
                [1, 2, 3].map((_, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-12 bg-gray-200 rounded"></div>
                  </div>
                ))
              ) : education.length > 0 ? (
                education.map((edu) => (
                  <div key={edu.education_id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{edu.degree}</h3>
                    <p className="text-blue-600 font-medium mb-2">{edu.institution}</p>
                    <p className="text-gray-500 text-sm mb-4">
                      {edu.start_year}{edu.end_year ? ` - ${edu.current ? 'Present' : edu.end_year}` : ''}
                      {edu.field_of_study && ` | ${edu.field_of_study}`}
                    </p>
                    {edu.description && (
                      <p className="text-gray-600 text-sm">
                        {edu.description.split('.').slice(0, 2).join('.')}.
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No education data available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Looking for more information?</h2>
            <p className="text-xl mb-8">
              Feel free to explore my portfolio or get in touch directly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/portfolio"
                className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors duration-200"
              >
                View Portfolio
              </Link>
              <Link
                to="/contact"
                className="px-6 py-3 bg-blue-800 text-white font-medium rounded-lg hover:bg-blue-900 transition-colors duration-200"
              >
                Contact Me
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default UV_About;