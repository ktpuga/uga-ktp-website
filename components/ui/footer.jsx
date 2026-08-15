import Link from "next/link";
export function Footer() {
  return (
    <footer className="w-full shrink-0 bg-[#052039] py-8 text-white">
        <div className="container mx-auto grid gap-8 px-4 md:px-6 lg:grid-cols-[minmax(14rem,0.85fr)_minmax(0,2.15fr)] lg:items-end">
          <div>
            <p className="text-sm font-semibold">Kappa Theta Pi · Phi Chapter</p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-300">Technology, leadership, and community at the University of Georgia.</p>
            <p className="mt-4 text-xs text-slate-400">&copy; {new Date().getFullYear()} KTP. All rights reserved.</p>
          </div>

          <nav className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8" aria-label="Footer navigation">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Policies &amp; Community</p>
              <div className="mt-3 flex flex-col gap-2">
                <FooterLink href="/code-of-conduct">Code of Conduct</FooterLink>
                <FooterLink href="/community-guidelines">Community Guidelines</FooterLink>
                <FooterLink href="/privacy">Privacy Policy</FooterLink>
                <FooterLink href="https://drive.google.com/file/d/17LkRqOsNCJVQUKkWTIOs_HaJhmTcSxmc/view" external>Constitution &amp; Governance</FooterLink>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Support</p>
              <div className="mt-3 flex flex-col gap-2">
                <FooterLink href="/support">App Support</FooterLink>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Explore</p>
              <div className="mt-3 flex flex-col gap-2">
                <FooterLink href="/blog">Blog</FooterLink>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Connect</p>
              <div className="mt-3 flex flex-col gap-2">
                <FooterLink href="https://www.instagram.com/ugaktp/" external>Instagram</FooterLink>
                <FooterLink href="https://www.linkedin.com/company/kappa-theta-pi-uga/" external>LinkedIn</FooterLink>
              </div>
            </div>
          </nav>
        </div>
    </footer>
  );
}

function FooterLink({ href, children, external = false }) {
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="w-fit text-xs text-slate-200 transition-colors hover:text-white hover:underline hover:underline-offset-4"
      prefetch={false}
    >
      {children}
    </Link>
  );
}

export default Footer;
