import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="mt-14 bg-[#172033] px-4 pt-12 pb-8 text-[rgba(248,250,252,0.88)]">
      <div className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="m-0 text-[1.35rem] font-bold tracking-tight text-white">Joii</p>
          <p className="mt-3 mb-0 max-w-[36ch] text-[13px] leading-relaxed text-[rgba(248,250,252,0.65)]">
            Group trip planning for shared itineraries, people, and decisions. Calm
            Travel Ops — not flight shopping.
          </p>
        </div>
        <div>
          <h4 className="m-0 mb-3 text-[13px] font-bold text-white">Product</h4>
          <ul className="m-0 list-none p-0">
            <li className="mb-2">
              <Link
                href="/"
                className="text-[13px] text-[rgba(248,250,252,0.65)] transition-colors duration-[180ms] hover:text-white"
              >
                Home
              </Link>
            </li>
            <li className="mb-2">
              <a
                href="#trip-access"
                className="text-[13px] text-[rgba(248,250,252,0.65)] transition-colors duration-[180ms] hover:text-white"
              >
                Trip access
              </a>
            </li>
            <li className="mb-2">
              <a
                href="#login"
                className="text-[13px] text-[rgba(248,250,252,0.65)] transition-colors duration-[180ms] hover:text-white"
              >
                Log in
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="m-0 mb-3 text-[13px] font-bold text-white">Plan</h4>
          <ul className="m-0 list-none p-0">
            <li className="mb-2">
              <a
                href="#destinations"
                className="text-[13px] text-[rgba(248,250,252,0.65)] transition-colors duration-[180ms] hover:text-white"
              >
                Popular destinations
              </a>
            </li>
            <li className="mb-2">
              <a
                href="#trips"
                className="text-[13px] text-[rgba(248,250,252,0.65)] transition-colors duration-[180ms] hover:text-white"
              >
                Trip ideas
              </a>
            </li>
            <li className="mb-2">
              <a
                href="#create"
                className="text-[13px] text-[rgba(248,250,252,0.65)] transition-colors duration-[180ms] hover:text-white"
              >
                Start planning
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 w-full max-w-[1120px] border-t border-white/12 pt-4 text-xs text-[rgba(248,250,252,0.45)]">
        Joii · group trip planning
      </div>
    </footer>
  );
}
