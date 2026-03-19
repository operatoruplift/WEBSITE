
import React from 'react';

export const CopyIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

export const CheckIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const Logo = ({ className = "text-white" }: { className?: string }) => (
  <svg width="24" height="26" viewBox="0 0 472 510" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M379.51 143.322C379.59 144.022 379.59 144.722 379.51 145.392C379.09 148.712 376.19 151.192 372.87 151.592L261.43 165.892C260.1 166.592 259 167.692 258.28 169.002L243.66 195.722C240.7 201.182 232.85 201.182 229.84 195.722L215.24 169.002C214.52 167.692 213.42 166.592 212.11 165.892L98.9198 151.592C95.5998 151.192 92.7198 148.712 92.2998 145.412C92.1898 144.712 92.1898 144.012 92.2998 143.312C92.7198 139.992 95.5998 137.532 98.9198 137.132L212.11 122.832C213.42 122.112 214.52 121.032 215.24 119.702L229.84 93.0022C232.84 87.5422 240.69 87.5422 243.66 93.0022L258.28 119.702C259 121.032 260.1 122.112 261.43 122.832L372.87 137.132C376.19 137.512 379.09 139.992 379.51 143.312V143.322Z" fill="url(#paint0_linear_243_2)"/>
    <path d="M415.14 85.9625L292.55 15.1725C257.49 -5.0575 214.31 -5.0575 179.25 15.1725L56.66 85.9625C21.6 106.193 0 143.603 0 184.073V325.643C0 366.123 21.6 403.523 56.66 423.753L179.25 494.522C214.31 514.772 257.49 514.772 292.55 494.522L415.14 423.753C450.2 403.523 471.78 366.123 471.78 325.643V184.073C471.78 143.593 450.2 106.193 415.14 85.9625ZM400.86 167.503L380.51 179.902L278.04 242.323C255.38 256.143 218.44 256.473 195.52 243.083L91.93 182.512L71.39 170.493C48.48 157.083 48.29 135.033 70.95 121.233L193.75 46.3925C216.41 32.5925 253.35 32.2625 276.27 45.6525L400.42 118.243C423.33 131.633 423.52 153.683 400.86 167.503Z" fill="url(#paint1_linear_243_2)"/>
    <path d="M379.51 145.403C379.09 148.723 376.19 151.203 372.87 151.603L261.43 165.903C260.1 166.603 259 167.703 258.28 169.013L243.66 195.733C240.7 201.193 232.85 201.193 229.84 195.733L215.24 169.013C214.52 167.703 213.42 166.603 212.11 165.903L98.9198 151.603C95.5998 151.203 92.7198 148.723 92.2998 145.423C92.1898 144.723 92.1898 144.023 92.2998 143.323C92.7198 140.003 95.5998 137.543 98.9198 137.143L212.11 122.843C213.42 122.123 214.52 121.043 215.24 119.713L229.84 93.013C232.84 87.553 240.69 87.553 243.66 93.013L258.28 119.713C259 121.043 260.1 122.123 261.43 122.843L372.87 137.143C376.19 137.523 379.09 140.003 379.51 143.323C379.59 144.023 379.59 144.723 379.51 145.393V145.403Z" fill="url(#paint2_linear_243_2)"/>
    <path d="M379.51 145.403C379.09 148.723 376.19 151.203 372.87 151.603L261.43 165.903C260.1 166.603 259 167.703 258.28 169.013L243.66 195.733C240.7 201.193 232.85 201.193 229.84 195.733L215.24 169.013C214.52 167.703 213.42 166.603 212.11 165.903L98.9198 151.603C95.5998 151.203 92.7198 148.723 92.2998 145.423C92.1898 144.723 92.1898 144.023 92.2998 143.323C92.7198 140.003 95.5998 137.543 98.9198 137.143L212.11 122.843C213.42 122.123 214.52 121.043 215.24 119.713L229.84 93.013C232.84 87.553 240.69 87.553 243.66 93.013L258.28 119.713C259 121.043 260.1 122.123 261.43 122.843L372.87 137.143C376.19 137.523 379.09 140.003 379.51 143.323C379.59 144.023 379.59 144.723 379.51 145.393V145.403Z" fill="url(#paint3_linear_243_2)"/>
    <defs>
      <linearGradient id="paint0_linear_243_2" x1="92.2098" y1="144.372" x2="379.57" y2="144.372" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E77630"/>
        <stop offset="1" stopColor="#F1AD83"/>
      </linearGradient>
      <linearGradient id="paint1_linear_243_2" x1="0" y1="254.863" x2="471.78" y2="254.863" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E77630"/>
        <stop offset="1" stopColor="#F1AD83"/>
      </linearGradient>
      <linearGradient id="paint2_linear_243_2" x1="92.2098" y1="144.373" x2="379.57" y2="144.373" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E77630"/>
        <stop offset="1" stopColor="#F1AD83"/>
      </linearGradient>
      <linearGradient id="paint3_linear_243_2" x1="92.2098" y1="144.373" x2="379.57" y2="144.373" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E77630"/>
        <stop offset="1" stopColor="#F1AD83"/>
      </linearGradient>
    </defs>
  </svg>
);

export const UpliftLogo = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg width="472" height="510" viewBox="0 0 472 510" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M379.51 143.322C379.59 144.022 379.59 144.722 379.51 145.392C379.09 148.712 376.19 151.192 372.87 151.592L261.43 165.892C260.1 166.592 259 167.692 258.28 169.002L243.66 195.722C240.7 201.182 232.85 201.182 229.84 195.722L215.24 169.002C214.52 167.692 213.42 166.592 212.11 165.892L98.9198 151.592C95.5998 151.192 92.7198 148.712 92.2998 145.412C92.1898 144.712 92.1898 144.012 92.2998 143.312C92.7198 139.992 95.5998 137.532 98.9198 137.132L212.11 122.832C213.42 122.112 214.52 121.032 215.24 119.702L229.84 93.0022C232.84 87.5422 240.69 87.5422 243.66 93.0022L258.28 119.702C259 121.032 260.1 122.112 261.43 122.832L372.87 137.132C376.19 137.512 379.09 139.992 379.51 143.312V143.322Z" fill="url(#paint0_linear_243_2_large)"/>
    <path d="M415.14 85.9625L292.55 15.1725C257.49 -5.0575 214.31 -5.0575 179.25 15.1725L56.66 85.9625C21.6 106.193 0 143.603 0 184.073V325.643C0 366.123 21.6 403.523 56.66 423.753L179.25 494.522C214.31 514.772 257.49 514.772 292.55 494.522L415.14 423.753C450.2 403.523 471.78 366.123 471.78 325.643V184.073C471.78 143.593 450.2 106.193 415.14 85.9625ZM400.86 167.503L380.51 179.902L278.04 242.323C255.38 256.143 218.44 256.473 195.52 243.083L91.93 182.512L71.39 170.493C48.48 157.083 48.29 135.033 70.95 121.233L193.75 46.3925C216.41 32.5925 253.35 32.2625 276.27 45.6525L400.42 118.243C423.33 131.633 423.52 153.683 400.86 167.503Z" fill="url(#paint1_linear_243_2_large)"/>
    <path d="M379.51 145.403C379.09 148.723 376.19 151.203 372.87 151.603L261.43 165.903C260.1 166.603 259 167.703 258.28 169.013L243.66 195.733C240.7 201.193 232.85 201.193 229.84 195.733L215.24 169.013C214.52 167.703 213.42 166.603 212.11 165.903L98.9198 151.603C95.5998 151.203 92.7198 148.723 92.2998 145.423C92.1898 144.723 92.1898 144.023 92.2998 143.323C92.7198 140.003 95.5998 137.543 98.9198 137.143L212.11 122.843C213.42 122.123 214.52 121.043 215.24 119.713L229.84 93.013C232.84 87.553 240.69 87.553 243.66 93.013L258.28 119.713C259 121.043 260.1 122.123 261.43 122.843L372.87 137.143C376.19 137.523 379.09 140.003 379.51 143.323C379.59 144.023 379.59 144.723 379.51 145.393V145.403Z" fill="url(#paint2_linear_243_2_large)"/>
    <path d="M379.51 145.403C379.09 148.723 376.19 151.203 372.87 151.603L261.43 165.903C260.1 166.603 259 167.703 258.28 169.013L243.66 195.733C240.7 201.193 232.85 201.193 229.84 195.733L215.24 169.013C214.52 167.703 213.42 166.603 212.11 165.903L98.9198 151.603C95.5998 151.203 92.7198 148.723 92.2998 145.423C92.1898 144.723 92.1898 144.023 92.2998 143.323C92.7198 140.003 95.5998 137.543 98.9198 137.143L212.11 122.843C213.42 122.123 214.52 121.043 215.24 119.713L229.84 93.013C232.84 87.553 240.69 87.553 243.66 93.013L258.28 119.713C259 121.043 260.1 122.123 261.43 122.843L372.87 137.143C376.19 137.523 379.09 140.003 379.51 143.323C379.59 144.023 379.59 144.723 379.51 145.393V145.403Z" fill="url(#paint3_linear_243_2_large)"/>
    <defs>
      <linearGradient id="paint0_linear_243_2_large" x1="92.2098" y1="144.372" x2="379.57" y2="144.372" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E77630"/>
        <stop offset="1" stopColor="#F1AD83"/>
      </linearGradient>
      <linearGradient id="paint1_linear_243_2_large" x1="0" y1="254.863" x2="471.78" y2="254.863" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E77630"/>
        <stop offset="1" stopColor="#F1AD83"/>
      </linearGradient>
      <linearGradient id="paint2_linear_243_2_large" x1="92.2098" y1="144.373" x2="379.57" y2="144.373" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E77630"/>
        <stop offset="1" stopColor="#F1AD83"/>
      </linearGradient>
      <linearGradient id="paint3_linear_243_2_large" x1="92.2098" y1="144.373" x2="379.57" y2="144.373" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E77630"/>
        <stop offset="1" stopColor="#F1AD83"/>
      </linearGradient>
    </defs>
  </svg>
);

export const ChevronRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export const DownloadIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);

export const AppleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 384 512" fill="currentColor" className={className}>
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

export const WindowsIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 448 512" fill="currentColor" className={className}>
    <path d="M0 93.7l183.6-25.3v177.4H0V93.7zm0 324.6l183.6 25.3V268.4H0v149.9zm203.8 28L448 480V268.4H203.8v177.9zm0-380.6v180.1H448V32L203.8 65.7z"/>
  </svg>
);

export const LinuxIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 448 512" fill="currentColor" className={className}>
    <path d="M220.8 123.3c1 .5 1.8 1.7 3 1.7 1.1 0 2.8-.4 2.9-1.5.2-1.4-1.9-2.3-3.2-2.9-1.7-.7-3.9-1-5.5-.1-.4.2-.8.7-.6 1.1.3 1.3 2.3 1.1 3.4 1.7zm-21.9 1.7c1.2 0 2-1.2 3-1.7 1.1-.6 3.1-.4 3.5-1.6.2-.4-.2-.9-.6-1.1-1.6-.9-3.8-.6-5.5.1-1.3.6-3.4 1.5-3.2 2.9.1 1 1.8 1.5 2.8 1.4zM420 403.8c-3.6-4-5.3-11.6-7.2-19.7-1.8-8.1-3.9-16.8-10.5-22.4-1.3-1.1-2.6-2.1-4-2.9-1.3-.8-2.7-1.5-4.1-2 9.2-27.3 5.6-54.5-3.7-79.1-11.4-30.1-31.3-56.4-46.5-74.4-17.1-21.5-33.7-41.9-33.4-72C311.1 85.4 315.7.1 234.8 0 132.4-.2 158 103.4 156.9 135.2c-1.7 23.4-12.5 37.6-24.4 53.8-13 15.8-25.3 33-34.2 59.3-9.3 24.6-12.8 51.8-3.6 79.1-1.4.5-2.8 1.2-4.1 2-1.4.8-2.7 1.8-4 2.9-6.6 5.6-8.7 14.3-10.5 22.4-1.9 8.1-3.6 15.7-7.2 19.7-4.4 4.9-6.7 13.3-4.2 20.1 2.6 7 8.6 11.4 15.7 14.3 6.1 2.5 13 3.8 19.3 7.7 6.7 4.1 11.3 10 18.4 12.5 7.9 2.8 18.3.7 26.3-4.3 7.3-4.5 12.5-11.1 19.4-15.6 6.5-4.2 14.1-7.1 22.3-8.4 16.2-2.5 33.6-.3 48.1 9.2 5.6 3.7 11.6 10.8 19.6 10.7 7.4-.1 13.4-6.9 19.5-10.2 14-7.6 32.5-11 48.8-8.4 8.2 1.3 15.8 4.2 22.3 8.4 6.9 4.5 12.1 11.1 19.4 15.6 8 5 18.4 7.1 26.3 4.3 7.1-2.5 11.7-8.4 18.4-12.5 6.3-3.9 13.2-5.2 19.3-7.7 7.1-2.9 13.1-7.3 15.7-14.3 2.5-6.8.2-15.2-4.2-20.1z"/>
  </svg>
);

export const AndroidIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 576 512" fill="currentColor" className={className}>
    <path d="M420.55 301.93a24 24 0 1 1 24-24 24 24 0 0 1-24 24m-265.1 0a24 24 0 1 1 24-24 24 24 0 0 1-24 24m273.7-144.48l47.94-83a10 10 0 1 0-17.27-10l-48.54 84.07a301.25 301.25 0 0 0-246.56 0L116.18 64.45a10 10 0 1 0-17.27 10l47.94 83C64.53 202.22 8.24 285.55 0 384h576c-8.24-98.45-64.54-181.78-146.85-226.55"/>
  </svg>
);

export const SmartphoneIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>
  </svg>
);

export const TerminalIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" x2="20" y1="19" y2="19"/>
  </svg>
);

export const GlobeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
    <path d="M2 12h20"/>
  </svg>
);

export const MessageIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

export const KanbanIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2"/>
    <path d="M8 7v7"/>
    <path d="M12 7v4"/>
    <path d="M16 7v9"/>
  </svg>
);

// Social & UI Icons

export const TwitterIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
  </svg>
);

export const GitHubIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2A10 10 0 008.84 21.5c.5.08.66-.23.66-.5V19.31C6.73 19.91 6.14 18 6.14 18A2.69 2.69 0 005 16.5c-.91-.62.07-.6.07-.6a2.1 2.1 0 011.53 1 2.15 2.15 0 002.91.83 2.16 2.16 0 01.63-1.34C8 16.17 5.62 15.31 5.62 11.5a3.87 3.87 0 011-2.71 3.65 3.65 0 01.1-2.64s.84-.27 2.75 1.02a9.63 9.63 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02a3.65 3.65 0 01.1 2.64 3.87 3.87 0 011 2.71c0 3.82-2.34 4.66-4.57 5.34a2.39 2.39 0 01.69 1.87v2.79c0 .27.16.58.67.5A10 10 0 0012 2z"/>
  </svg>
);

export const SunIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2"/>
    <path d="M12 21v2"/>
    <path d="M4.22 4.22l1.42 1.42"/>
    <path d="M18.36 18.36l1.42 1.42"/>
    <path d="M1 12h2"/>
    <path d="M21 12h2"/>
    <path d="M4.22 19.78l1.42-1.42"/>
    <path d="M18.36 5.64l1.42-1.42"/>
  </svg>
);

export const MoonIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

export const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a0.5 .5 0 0 0 1 1a5 5 0 0 0 2.67 2.67a0.5 .5 0 0 0 1 1" />
  </svg>
);

export const DiscordIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 14.118 14.118 0 0 0-.62 1.277 18.257 18.257 0 0 0-5.463 0 14.118 14.118 0 0 0-.62-1.277.074.074 0 0 0-.079-.037 19.791 19.791 0 0 0-4.885 1.515.05.05 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.076.076 0 0 0-.04.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.897 19.897 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.096 2.157 2.418 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.096 2.157 2.418 0 1.334-.946 2.42-2.157 2.42z"/>
  </svg>
);

export const MailIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

export const CalendarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);

export const ArrowUpRightIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="7" x2="17" y1="17" y2="7"/>
    <polyline points="7 7 17 7 17 17"/>
  </svg>
);
