import React from 'react';

export interface NavLink {
  label: string;
  href: string;
}

export interface DownloadOption {
  id: string;
  label: string;
  url: string;
  version: string;
  type: 'macos' | 'windows' | 'linux';
}

export interface HeroData {
  visionTag: string;
  headline: string;
  subhead: string;
  description: string;
  downloads: {
    macos?: DownloadOption;
    windows: DownloadOption;
    linux?: DownloadOption;
  };
}

export interface ProductFeature {
  id: string;
  navTitle: string;
  cardTitle: string;
  description: string;
  iconType: 'kanban' | 'globe' | 'terminal' | 'message' | 'check'; // mapped to icons
}

export interface ProductSectionData {
  tag: string;
  headline: string;
  subhead: string;
  features: ProductFeature[];
}

export interface SecurityFeature {
  tag: string;
  title: string;
  description: string;
  linkText: string;
  linkUrl: string;
}

export interface SecuritySectionData {
  tag: string;
  headline: string;
  subhead: string;
  features: {
    security: SecurityFeature;
    enterprise: SecurityFeature;
  };
}

export interface DocLink {
  title: string;
  description: string;
  url: string;
  iconType: 'terminal' | 'kanban' | 'globe';
}

export interface DeveloperDocsData {
  tag: string;
  headline: string;
  description: string;
  links: DocLink[];
}

export interface BuildWithUsData {
  tag: string;
  cta: string;
  headline: string;
  buttonText: string;
  url: string;
}

export interface FooterLink {
  label: string;
  url?: string; // external
  action?: string; // internal navigation key
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface FooterData {
  tag: string;
  sections: {
    resources: FooterSection;
    company: FooterSection;
    legal: FooterSection;
  };
  socials: {
    twitter: string;
    linkedin: string;
    github: string;
  };
  copyright: string;
}

export interface ContactOption {
  id: string;
  title: string;
  description: string;
  url: string;
  iconType: 'whatsapp' | 'email' | 'calendar' | 'twitter' | 'discord' | 'linkedin';
}

export interface ContactData {
  tag: string;
  headline: string;
  subhead: string;
  subheadLinkText: string;
  subheadLinkUrl: string;
  options: ContactOption[];
}

export interface AppData {
  hero: HeroData;
  product: ProductSectionData;
  security: SecuritySectionData;
  developerDocs: DeveloperDocsData;
  buildWithUs: BuildWithUsData;
  contact: ContactData;
  footer: FooterData;
}
