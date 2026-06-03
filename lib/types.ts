export interface NavLink {
  label: string;
  href: string;
}

export interface HeroData {
  headline: string;
}

export interface FooterLink {
  label: string;
  url?: string;
  action?: string;
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
    github: string | undefined;
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
  contact: ContactData;
  footer: FooterData;
}
