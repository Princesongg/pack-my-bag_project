export default function PackLessIllustration() {
  return <span className="pmb-pack-less-art" aria-hidden="true">
    <svg viewBox="0 0 340 210" fill="none" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="181" cy="188" rx="113" ry="7" fill="#DCCFA5" opacity=".35"/>
      {/* Tilted lid and open shell share a hinge behind the folded clothes. */}
      <g transform="rotate(-16 125 126)" stroke="#315C9D" strokeWidth="2" strokeLinejoin="round">
        <path d="M87 43V30Q87 25 92 25H114Q119 25 119 30V43"/>
        <rect x="63" y="42" width="113" height="106" rx="16" fill="#6C99E9"/>
        <rect x="72" y="51" width="95" height="87" rx="10" fill="#EDF3FC" stroke="#B3C9EC"/>
        <path d="M82 70H157M82 81H157M82 92H157" stroke="#C5D7EE" strokeWidth="1.5"/>
        <path d="M120 56V132" stroke="#9EB9DD" strokeDasharray="3 4"/>
      </g>
      {/* Three folded pieces, kept distinct with quiet flat colours. */}
      <g stroke="#55749C" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M104 116L119 101H161L178 116V145H104Z" fill="#FFFDF7"/>
        <path d="M127 102Q140 117 153 102M116 117V140M166 117V140"/>
        <rect x="122" y="124" width="82" height="30" rx="7" fill="#F3DB91"/>
        <path d="M129 135H197M141 125V153" stroke="#C5A85F"/>
        <rect x="135" y="141" width="81" height="25" rx="6" fill="#CBDDF6"/>
        <path d="M143 150H208" stroke="#88A9D5"/>
      </g>
      {/* Front of the half-open case. */}
      <g stroke="#315C9D" strokeWidth="2" strokeLinejoin="round">
        <path d="M91 145Q91 138 98 138H220Q227 138 227 145V173Q227 182 218 182H101Q91 182 91 172Z" fill="#4679D4"/>
        <path d="M98 143H219" stroke="#AAC6F3"/>
        <path d="M112 155V171M132 155V171M152 155V171M172 155V171M192 155V171M212 155V171" stroke="#7DA5E9"/>
        <path d="M143 181V187H174V181"/>
        <rect x="104" y="180" width="11" height="9" rx="4" fill="#253F70"/>
        <rect x="205" y="180" width="11" height="9" rx="4" fill="#253F70"/>
      </g>
      {/* Small pouch and two travel bottles, without labels or product detail. */}
      <g stroke="#55749C" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M237 143Q237 137 244 137H274Q281 137 281 144V171Q281 178 274 178H244Q237 178 237 171Z" fill="#FFFDF7"/>
        <path d="M243 146H275M272 146V152" stroke="#A7BAD5"/>
        <rect x="260" y="106" width="20" height="31" rx="5" fill="#F3DB91"/>
        <rect x="264" y="100" width="12" height="8" rx="2" fill="#315C9D"/>
        <rect x="286" y="124" width="18" height="37" rx="5" fill="#EDF3FC"/>
        <path d="M290 124V116H300V124" fill="#315C9D"/>
        <path d="M265 117H275M291 139H299" stroke="#9EB9DD"/>
      </g>
      <g stroke="#7193C2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M231 66V78M225 72H237M52 129V139M47 134H57"/>
        <path d="M270 73L275 78L284 66"/>
      </g>
    </svg>
  </span>;
}
