/**
 * Type definitions for landing page components
 */

/**
 * Common animation component props
 */
export interface AnimationComponentProps {
  className?: string;
}

/**
 * WhatsApp configuration
 */
export interface WhatsAppConfig {
  phoneNumber: string;
  defaultMessage: string;
}

/**
 * Navigation link structure
 */
export interface NavLink {
  href: string;
  label: string;
}

/**
 * Feature data structure
 */
export interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bg: string;
}

/**
 * Testimonial data structure
 */
export interface Testimonial {
  name: string;
  role: string;
  text: string;
  image: string;
}

/**
 * FAQ item structure
 */
export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Animation phase types
 */
export type AnimationPhase = number;

/**
 * Theme type
 */
export type Theme = 'light' | 'dark';
