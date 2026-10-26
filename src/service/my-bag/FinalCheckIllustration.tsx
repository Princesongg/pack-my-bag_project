// Decorative SVG: no external request, accessible name, or interactive elements.
export default function FinalCheckIllustration() {
  return <span className="pmb-final-cta-art" aria-hidden="true">
    <svg viewBox="0 0 380 250" fill="none" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="203" cy="228" rx="109" ry="8" fill="#CBD9EE" opacity=".45"/>
      {/* Boarding pass: left and behind, tilted -13 degrees. */}
      <g transform="rotate(-13 117 143)" stroke="#55749C" strokeWidth="2" strokeLinejoin="round">
        <rect x="48" y="91" width="145" height="91" rx="11" fill="#FFFDF7"/>
        <path d="M155 92V181" strokeDasharray="4 5"/>
        <path d="M62 109H128" stroke="#245BE0" strokeWidth="5" strokeLinecap="round"/>
        <path d="M63 128H87M63 139H114" stroke="#B8C8DD" strokeWidth="3" strokeLinecap="round"/>
        <path d="M68 154V169M73 154V169M80 154V169M84 154V169M91 154V169M96 154V169M103 154V169"/>
        <path d="M165 114H180M165 122H176" stroke="#B8C8DD"/>
      </g>
      {/* Passport: right and behind the bag. */}
      <g transform="rotate(12 268 154)" strokeLinejoin="round">
        <rect x="237" y="97" width="76" height="113" rx="9" fill="#315C9D" stroke="#244F8C" strokeWidth="2"/>
        <path d="M245 100V207" stroke="#7292BF" strokeWidth="2"/>
        <path d="M254 115H293" stroke="#F0D991" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="274" cy="152" r="16" stroke="#F0D991" strokeWidth="1.7"/>
        <ellipse cx="274" cy="152" rx="7" ry="16" stroke="#F0D991" strokeWidth="1.7"/>
        <path d="M258 152H290M261 144H287M261 160H287M261 184H287" stroke="#F0D991" strokeWidth="1.7"/>
      </g>
      {/* Closed suitcase is the primary object. */}
      <g stroke="#315C9D" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M177 79V55Q177 50 182 50H210Q215 50 215 55V79" fill="#FFFDF7"/>
        <path d="M184 77V59H208V77"/>
        <rect x="139" y="76" width="119" height="141" rx="22" fill="#F3D889"/>
        <rect x="149" y="86" width="99" height="121" rx="16" fill="#F8E6AD" stroke="#D3B568" strokeWidth="1.5"/>
        <path d="M169 101V190M188 101V190M208 101V190M227 101V190" stroke="#D9BD75" strokeWidth="2" strokeLinecap="round"/>
        <path d="M139 110H132V137H139" fill="#EDF3FC"/>
        <rect x="182" y="76" width="30" height="8" rx="3" fill="#315C9D" stroke="none"/>
        <rect x="155" y="214" width="15" height="12" rx="5" fill="#315C9D"/>
        <rect x="228" y="214" width="15" height="12" rx="5" fill="#315C9D"/>
        <path d="M246 103V132" stroke="#FFFDF7" strokeWidth="3" strokeLinecap="round"/>
        <rect x="221" y="123" width="28" height="19" rx="4" fill="#EDF3FC" transform="rotate(8 235 132)"/>
        <path d="M228 132H241" stroke="#245BE0" strokeWidth="2"/>
      </g>
      <path d="M264 73C282 79 309 66 309 50C309 38 296 40 299 49C302 59 323 52 329 42" stroke="#8BA9CF" strokeWidth="1.8" strokeDasharray="3 5" strokeLinecap="round"/>
      <path d="M15 0C12 0 12 2 12 4V12L0 20V23L12 19V28L8 31V34L15 31L22 34V31L18 28V19L30 23V20L18 12V4C18 2 18 0 15 0Z" transform="translate(325 18) rotate(35 15 17) scale(.8)" fill="#FFFDF7" stroke="#315C9D" strokeWidth="1.8" strokeLinejoin="round"/>
      <g stroke="#7193C2" strokeWidth="1.7" strokeLinecap="round">
        <path d="M105 56V68M99 62H111M318 188V198M313 193H323"/>
        <path d="M280 24V32M276 28H284" stroke="#D3B568"/>
      </g>
    </svg>
  </span>;
}
