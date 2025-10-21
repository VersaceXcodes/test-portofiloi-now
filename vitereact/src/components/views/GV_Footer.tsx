import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  ArrowUp
} from 'lucide-react';

export const GV_Footer: React.FC = () => {
  // Get current year for copyright
  const [year] = useState<number>(new Date().getFullYear());
  
  // State for back-to-top button visibility
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // Navigation links
  const navigationLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Portfolio', path: '/portfolio' },
    { name: 'Resume', path: '/resume' },
    { name: 'Contact', path: '/contact' },
  ];

  // Social media links
  const socialLinks = [
    { name: 'Facebook', url: 'https://facebook.com', icon: <Facebook className="h-5 w-5" /> },
    { name: 'Twitter', url: 'https://twitter.com', icon: <Twitter className="h-5 w-5" /> },
    { name: 'Instagram', url: 'https://instagram.com', icon: <Instagram className="h-5 w-5" /> },
    { name: 'LinkedIn', url: 'https://linkedin.com', icon: <Linkedin className="h-5 w-5" /> },
    { name: 'GitHub', url: 'https://github.com', icon: <Github className="h-5 w-5" /> },
  ];

  // Handle scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Show/hide back to top button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    // Set initial state
    handleScroll();
    
    // Add event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <footer className="relative bg-gray-900 text-white w-full border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Site Identity and Description */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Portfolio</h2>
              <p className="text-gray-400">
                Crafting exceptional digital experiences that stand out. Let's create something amazing together.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                {navigationLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.path}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Get In Touch</h3>
              <address className="not-italic text-gray-400 space-y-3">
                <p>Email: contact@example.com</p>
                <p>Phone: (123) 456-7890</p>
                <p>Location: San Francisco, CA</p>
              </address>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Me</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="bg-gray-800 p-3 rounded-full hover:bg-blue-600 transition-colors duration-200"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              &copy; {year} My Portfolio. All rights reserved.
            </p>
            
            <div className="flex space-x-8 mt-6 md:mt-0">
              <Link 
                to="/privacy" 
                className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms" 
                className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
              >
                Terms of Service
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            aria-label="Back to top"
          >
            <ArrowUp className="h-6 w-6" />
          </button>
        )}
      </footer>

      {/* Sticky Mobile Navigation Spacer */}
      <div className="pb-16 md:pb-0" />
    </>
  );
};

export default GV_Footer;