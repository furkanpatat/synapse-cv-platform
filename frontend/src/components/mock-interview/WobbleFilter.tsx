/**
 * The hand-drawn "wobble" filter that gives the Mira avatar its sketchy
 * feel. SVG <filter> elements are referenced by id from anywhere on the
 * page, so we render this once near the top of the active screen. The
 * zero-sized host keeps it out of the layout.
 *
 * Why a separate component: the filter declaration is shared between the
 * avatar and the stage halo. Putting it in its own file means we mount it
 * once at the page level instead of inside every Avatar instance.
 */
export function WobbleFilter() {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0 }}
    >
      <defs>
        <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves="2"
            seed="3"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="2.2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
