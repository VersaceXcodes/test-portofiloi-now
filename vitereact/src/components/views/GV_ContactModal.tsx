import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/main';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';

// Types
type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

// API function to submit contact form
const submitContactForm = async (formData: ContactFormData) => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/contact`,
    formData,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

const GV_ContactModal: React.FC = () => {
  // Get store methods
  const isContactModalOpen = useAppStore(state => state.isContactModalOpen);
  const closeContactModal = useAppStore(state => state.closeContactModal);
  
  // Form state
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  
  // Error state
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});
  
  // Modal ref for outside click detection
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Get URL params for subject prefilling
  const [searchParams] = useSearchParams();
  
  // Mutation for form submission
  const contactMutation = useMutation({
    mutationFn: submitContactForm,
    onSuccess: () => {
      // Show success notification
      useAppStore.getState().addNotification({
        message: 'Your message has been sent successfully!',
        type: 'success',
      });
      
      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      setErrors({});
      closeContactModal();
    },
    onError: (error: Error) => {
      // Show error notification
      useAppStore.getState().addNotification({
        message: error.message || 'Failed to send message. Please try again later.',
        type: 'error',
      });
    },
  });

  // Pre-fill subject from URL params if available
  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    if (subjectParam) {
      setFormData(prev => ({
        ...prev,
        subject: subjectParam,
      }));
    }
  }, [searchParams]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<ContactFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await contactMutation.mutateAsync(formData);
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    // Reset form if not in the middle of submission
    if (!contactMutation.isPending) {
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      setErrors({});
    }
    closeContactModal();
  };

  // Handle click outside modal
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      modalRef.current && 
      !modalRef.current.contains(e.target as Node) &&
      isContactModalOpen
    ) {
      handleCloseModal();
    }
  }, [isContactModalOpen]);

  // Add event listener for outside click and Escape key
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isContactModalOpen) {
        handleCloseModal();
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isContactModalOpen, handleClickOutside]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isContactModalOpen) {
      document.body.style.overflow = 'hidden';
      // Focus on first input when modal opens
      if (modalRef.current) {
        const firstInput = modalRef.current.querySelector('input') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isContactModalOpen]);

  // Don't render if modal is not open
  if (!isContactModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto transition-opacity duration-300">
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        ></div>
        
        <div className="flex min-h-screen items-center justify-center p-4 sm:p-0">
          <div 
            ref={modalRef}
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
          >
            {/* Modal header */}
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:px-6">
              <div>
                <h3 
                  id="contact-modal-title"
                  className="text-base font-semibold leading-6 text-gray-900"
                >
                  Get in Touch
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Have questions? Reach out and I'll get back to you as soon as possible.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="mt-1 inline-flex items-center justify-center rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:mt-0"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-4 pb-4 pt-5 sm:p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label 
                      htmlFor="name"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Name *
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ${
                          errors.name ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600'
                        } placeholder:text-gray-400 sm:text-sm sm:leading-6`}
                        placeholder="Your name"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                      />
                      {errors.name && (
                        <p id="name-error" className="mt-2 text-sm text-red-600">
                          {errors.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label 
                      htmlFor="email"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Email *
                    </label>
                    <div className="mt-2">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ${
                          errors.email ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600'
                        } placeholder:text-gray-400 sm:text-sm sm:leading-6`}
                        placeholder="your.email@example.com"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                      {errors.email && (
                        <p id="email-error" className="mt-2 text-sm text-red-600">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label 
                      htmlFor="subject"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Subject
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        placeholder="What's this about?"
                      />
                    </div>
                  </div>

                  <div>
                    <label 
                      htmlFor="message"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Message *
                    </label>
                    <div className="mt-2">
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleInputChange}
                        className={`block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ${
                          errors.message ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600'
                        } placeholder:text-gray-400 sm:text-sm sm:leading-6`}
                        placeholder="Your message..."
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? 'message-error' : undefined}
                      ></textarea>
                      {errors.message && (
                        <p id="message-error" className="mt-2 text-sm text-red-600">
                          {errors.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      * Required fields
                    </span>
                    <button
                      type="submit"
                      disabled={contactMutation.isPending}
                      className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {contactMutation.isPending ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : 'Send Message'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 sm:ml-3 sm:w-auto"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GV_ContactModal;