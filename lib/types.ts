export interface NavLink {
  label: string;
  href: string;
}

export interface DownloadOption {
  id: string;
  label: string;
  url: string;
  version: string;
  type: 'macos' | 'windows' | 'linux' | 'ios' | 'android';
}

export interface HeroData {
  visionTag: string;
  headline: string;
  subhead: string;
  description: string;
  contractAddress: string;
  contractLabel: string;
  downloads: {
    macos?: DownloadOption;
    windows: DownloadOption;
    linux?: DownloadOption;
    ios?: DownloadOption;
    android?: DownloadOption;
  };
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
  contact: ContactData;
  footer: FooterData;
}
