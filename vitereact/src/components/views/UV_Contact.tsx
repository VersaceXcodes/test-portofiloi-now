// src/components/views/UV_Contact.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMap } from 'react-leaflet/hooks';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Mail, Phone, MapPin, Clock, Send, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/main';
import { useMutation } from '@tanstack/react-query';
import { createContactMessageInputSchema } from '@/lib/validations/contact';

// Fix for default Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const DEFAULT_VIEWPORT = {
  center: [51.505, -0.09] as [number, number],
  zoom: 15,
};

const MapWithMarker: React.FC<{ position: [number, number], popupText: string }> = ({ position, popupText }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={position}>
        <Popup>{popupText}</Popup>
      </Marker>
    </>
  );
};

const UV_Contact: React.FC = () => {
  // Global state
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const currentUser = useAppStore(state => state.currentUser);
  const currentUserEmail = currentUser?.email || '';
  const currentUserName = currentUser?.full_name || '';
  
  // Local state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset form when switching between auth states
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUserName,
        email: currentUserEmail,
      }));
    }
  }, [isAuthenticated, currentUser, currentUserEmail, currentUserName]);

  // Form submission mutation
  const submitContactForm = useMutation(
    async (formData: typeof createContactMessageInputSchema._output) => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/contact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }

      return response.json();
    },
    {
      onSuccess: () => {
        setIsSuccess(true);
        setFormErrors({});
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setIsSuccess(false), 3000);
      },
      onError: (error: Error) => {
        setFormErrors({ server: error.message });
      },
    }
  );

  // Form validation
  const validateField = (field: string, value: string) => {
    try {
      const fieldSchema = 
        field === 'name' ? createContactMessageInputSchema.shape.name :
        field === 'email' ? createContactMessageInputSchema.shape.email :
        field === 'message' ? createContactMessageInputSchema.shape.message :
        field === 'subject' ? createContactMessageInputSchema.shape.subject : null;

      if (fieldSchema && fieldSchema instanceof z.ZodType) {
        fieldSchema.parse(value);
        setFormErrors(prev => ({ ...prev, [field]: '' }));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFormErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    try {
      const validatedData = createContactMessageInputSchema.parse(formData);
      await submitContactForm.mutateAsync(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce((acc, curr) => {
          const field = curr.path[0];
          acc[field] = curr.message;
          return acc;
        }, {} as Record<string, string>);
        setFormErrors(errors);
      }
    }
  };

  // Social links data
  const socialLinks = [
    { name: 'Twitter', url: '#', icon: '🍃' },
    { name: 'LinkedIn', url: '#', icon: '🔗' },
    { name: 'GitHub', url: '#', icon: '👨‍💻' },
    { name: 'Dribbble', url: '#', icon: '🏀' },
  ];

  return (
    <>
      {/* Full-width map section */}
      <div className="relative h-96 w-full">
        <MapContainer 
          center={DEFAULT_VIEWPORT.center} 
          zoom={DEFAULT_VIEWPORT.zoom}
          className="h-full w-full z-0"
          zoomControl={false}
          scrollWheelZoom={false}
        >
          <MapWithMarker 
            position={DEFAULT_VIEWPORT.center} 
            popupText="Our Office Location"
          />
        </MapContainer>
      </div>

      {/* Main contact content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get In Touch</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have a project in mind or want to make an inquiry? Feel free to reach out through the form below or our contact information.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Left Column - Contact Information */}
          <div className="md:col-span-2 space-y-8">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Mail className="mr-2 h-5 w-5 text-blue-600" />
                Contact Information
              </h3>
              <p className="text-gray-600">Email us directly or fill out the form</p>
              <a 
                href="mailto:contact@example.com" 
                className="text-blue-600 hover:text-blue-800 transition-colors inline-block mt-2"
              >
                contact@example.com
              </a>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Phone className="mr-2 h-5 w-5 text-blue-600" />
                Phone
              </h3>
              <a 
                href="tel:+1234567890" 
                className="text-blue-600 hover:text-blue-800 transition-colors inline-block"
              >
                +1 (234) 567-890
              </a>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-blue-600" />
                Our Location
              </h3>
              <p className="text-gray-600">
                123 Business Avenue<br />
                Suite 456<br />
                New York, NY 10001
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-blue-600" />
                Business Hours
              </h3>
              <p className="text-gray-600">
                Monday - Friday: 9am - 5pm EST<br />
                Saturday: By appointment only
              </p>
            </div>

            <div className="pt-4">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Follow Us</h4>
              <div className="flex space-x-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-200"
                    aria-label={link.name}
                  >
                    <span className="text-base">{link.icon}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {submitContactForm.isSuccess && (
                <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-md transition-all duration-300">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="font-medium">Message Sent Successfully!</h3>
                      <p className="text-sm mt-1">Thank you for reaching out. I'll get back to you as soon as possible.</p>
                    </div>
                  </div>
                </div>
              )}
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    required
                    disabled={isAuthenticated}
                    className={`block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                      formErrors.name ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-300'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    required
                    disabled={isAuthenticated}
                    className={`block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                      formErrors.email ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-300'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject (Optional)
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                      formErrors.subject ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-300'
                    }`}
                  />
                  {formErrors.subject && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {formErrors.subject}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    required
                    minLength={10}
                    className={`block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                      formErrors.message ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-300'
                    }`}
                  />
                  {formErrors.message && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {formErrors.message}
                    </p>
                  )}
                </div>

                {formErrors.server && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{formErrors.server}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitContactForm.isLoading}
                    className={`inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors duration-200 ${
                      submitContactForm.isLoading ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {submitContactForm.isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Contact;