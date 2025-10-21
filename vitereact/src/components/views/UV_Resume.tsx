import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Experience, Education, Skill } from '@/types/zod-schemas';
import { format } from 'date-fns';

import { FiDownload, FiBriefcase, FiAward, FiUser, FiMail, FiPhone, FiMapPin, FiLink } from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa';
import { TbStars } from 'react-icons/tb';

const UV_Resume: React.FC = () => {
  // Get current user from Zustand store
  const currentUser = useAppStore(state => state.currentUser);
  const userId = currentUser?.user_id;

  // State for resume data
  const [workExperience, setWorkExperience] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [error, setError] = useState<string | null>(null);

  // API error handling
  const handleApiError = (error: any) => {
    console.error('API Error:', error);
    const message = error.response?.data?.message || error.message || 'Failed to fetch resume data';
    setError(message);
  };

  // Fetch resume data using React Query
  const { data: resumeData, isLoading, isError } = useQuery({
    queryKey: ['resume', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is not available');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${userId}/resume/full`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch resume data');
      }

      return response.json();
    },
    enabled: !!userId,
    retry: 1,
    staleTime: 1000 * 60 * 10, // 10 minutes
    onError: handleApiError
  });

  // Update state when data is loaded
  useEffect(() => {
    if (resumeData) {
      setWorkExperience(resumeData.experiences || []);
      setEducation(Array.isArray(resumeData.education) ? resumeData.education : []);
      setSkills(Array.isArray(resumeData.skills) ? resumeData.skills : []);
      setError(null);
    }
  }, [resumeData, userId]);

  // Handle resume download
  const handleDownloadResume = async () => {
    if (!resumeData?.resume_url) {
      setError('Resume URL is not available');
      return;
    }

    window.open(resumeData.resume_url, '_blank', 'noopener,noreferrer');
  };

  // Format date range
  const formatDateRange = (startDate: string | Date, endDate?: string | Date | null, isCurrent?: boolean) => {
    try {
      const start = format(new Date(startDate), 'MMM yyyy');
      const end = isCurrent ? 'Present' : (endDate ? format(new Date(endDate), 'MMM yyyy') : 'Present');
      return `${start} - ${end}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date not available';
    }
  };

  // Group skills by category
  const skillsByCategory = useMemo(() => {
    return skills.reduce<Record<string, Skill[]>>((acc, skill) => {
      const category = skill.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {});
  }, [skills]);

  // Add proper error handling
  const ErrorDisplay = ({ message, onRetry }: { message: string, onRetry?: () => void }) => (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mt-4">
      <p>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid border-opacity-50 mx-auto mb-4"></div>
            <p className="text-gray-700">Loading your professional resume...</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (isError && error) {
    return (
      <>
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Professional Resume</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        {/* Resume container */}
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden print:shadow-none">
          {/* Header */}
          <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold">{currentUser?.full_name || 'Your Name'}</h1>
                <p className="text-blue-100 mt-2 max-w-xl">
                  {/* Replace with actual designation or profession */}
                  {currentUser?.bio || 'Professional'}
                </p>
                
                <div className="mt-6 flex flex-wrap gap-4 text-sm text-blue-100">
                  <div className="flex items-center">
                    <FiMail className="mr-2" />
                    <a href={`mailto:${currentUser?.email || ''}`} className="hover:underline">
                      {currentUser?.email || 'email@example.com'}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <FiLink className="mr-2" />
                    <a href="#" className="hover:underline">yourwebsite.com</a>
                  </div>
                  <div className="flex items-center">
                    <FiMapPin className="mr-2" /> Location
                  </div>
                </div>
              </div>
              
              <div className="shrink-0 bg-white bg-opacity-10 border border-white border-opacity-30 backdrop-blur-sm hover:bg-opacity-20 transition-all rounded-2xl p-4 flex items-center text-center">
                {currentUser?.profile_pic_url ? (
                  <img 
                    src={currentUser.profile_pic_url} 
                    alt={currentUser.full_name} 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white border-opacity-20"
                  />
                ) : (
                  <div className="bg-white text-blue-600 w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl">
                    {currentUser?.full_name?.charAt(0) || 'Y'}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Resume Content */}
          <div className="p-8 print:p-2">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Sidebar (30% width) */}
              <div className="md:w-1/3 print:w-1/4">
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 border-b border-blue-100 pb-2 mb-4 flex items-center gap-2">
                    <FiUser className="text-blue-600" /> About Me
                  </h2>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {/* Brief professional summary */}
                    {currentUser?.bio || 'Passionate professional with expertise in multiple domains. Strong problem solver with excellent communication skills.'}
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 border-b border-blue-100 pb-2 mb-4 flex items-center gap-2">
                    <TbStars className="text-blue-600" /> Skills
                  </h2>
                  
                  {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                    <div key={category} className="mb-4">
                      <h3 className="font-medium text-gray-700 text-sm mb-2">{category}</h3>
                      <div className="flex flex-wrap gap-2">
                        {categorySkills.map((skill) => (
                          <span
                            key={`${category}-${skill.skill_id}`}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-800 rounded-full"
                          >
                            {skill.name}
                            {typeof skill.proficiency === 'number' && (
                              <span className="text-blue-500 ml-1">({skill.proficiency}%)</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-800 border-b border-blue-100 pb-2 mb-4 flex items-center gap-2">
                    <FiAward className="text-blue-600" /> Languages
                  </h2>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex justify-between items-center">
                      <span>English</span>
                      <span className="text-xs text-blue-600">Native</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Spanish</span>
                      <span className="text-xs text-blue-600">Professional</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>French</span>
                      <span className="text-xs text-blue-600">Intermediate</span>
                    </li>
                  </ul>
                </section>
              </div>

              {/* Main Content (70% width) */}
              <div className="md:w-2/3 print:w-3/4">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Professional Experience</h2>
                  <button
                    onClick={handleDownloadResume}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm font-medium"
                  >
                    <FiDownload /> Download Resume
                  </button>
                </div>

                {/* Work Experience */}
                <section className="mb-8">
                  <ul className="space-y-6">
                  {workExperience.map((experience) => {
                    // Check if this is the first experience to add a pipe to the left
                    const isFirst = workExperience.indexOf(experience) === 0;
                    
                    return (
                      <li key={experience.experience_id} className="relative pl-6 border-l-2 border-blue-200 pb-6 last:border-l-0 last:pb-0 last:after:hidden after:absolute after:left-[-7px] after:top-[7px] after:w-3 after:h-3 after:rounded-full after:bg-blue-600 after:border-2 after:border-blue-600 after:z-10">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {experience.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 sm:mt-0">
                            {formatDateRange(
                              experience.start_date,
                              experience.end_date,
                              !experience.end_date
                            )}
                          </p>
                        </div>
                        <div className="flex items-center text-gray-600 mt-1 mb-2">
                          <FiBriefcase className="mr-1 text-blue-600" size={14} />
                          <p className="text-sm font-medium">
                            {experience.company}
                            {experience.location && `, ${experience.location}`}
                          </p>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {experience.description}
                        </p>
                      </li>
                    );
                  })}
                  </ul>
                </section>

                {/* Education */}
                <section className="pt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Education</h2>
                  <div className="space-y-6">
                    {education.map((edu) => (
                      <div key={edu.education_id} className="relative pl-6 border-l-2 border-blue-200 pb-6 last:border-l-0 last:pb-0 last:after:hidden after:absolute after:left-[-7px] after:top-[7px] after:w-3 after:h-3 after:rounded-full after:bg-green-500 after:border-2 after:border-white after:z-10">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {edu.degree}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 sm:mt-0">
                            {edu.start_year}
                            {edu.end_year ? ` - ${edu.end_year}` : edu.current ? ' - Present' : ''}
                          </p>
                        </div>
                        <div className="flex items-center text-gray-600 mt-1">
                          <FaGraduationCap className="mr-1 text-green-500" size={14} />
                          <p className="text-sm font-medium">
                            {edu.institution}
                            {edu.field_of_study && `, ${edu.field_of_study}`}
                          </p>
                        </div>
                        {edu.description && (
                          <p className="mt-2 text-gray-700 text-sm">
                            {edu.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Portfolio Button */}
        <div className="max-w-6xl mx-auto mt-8 print:hidden">
          <Link 
            to="/portfolio" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Portfolio
          </Link>
        </div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body, html {
              margin: 0;
              padding: 0;
              background: white;
              color: black;
              font-size: 12pt;
            }
            
            .resume-container {
              box-shadow: none;
              margin: 0 auto;
              padding: 0;
              width: 100%;
              max-width: 100%;
            }
            
            .print-header {
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            header {
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .print-hidden {
              display: none !important;
            }

            a {
              text-decoration: none;
              color: black !important;
            }

            .break-inside-avoid {
              break-inside: avoid;
            }
          }
        `}
      </style>
    </>
  );
};

export default UV_Resume;