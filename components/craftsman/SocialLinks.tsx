import type { SocialLink } from "@/lib/data/craftsmen";
import { IconFacebook, IconGlobe, IconInstagram, IconTikTok } from "@/components/shared/icons";

const platformLabels: Record<SocialLink["platform"], string> = {
  facebook: "فيسبوك",
  instagram: "إنستغرام",
  tiktok: "تيك توك",
  other: "رابط آخر",
};

function SocialIcon({ platform, className }: { platform: SocialLink["platform"]; className?: string }) {
  switch (platform) {
    case "facebook":
      return <IconFacebook className={className} />;
    case "instagram":
      return <IconInstagram className={className} />;
    case "tiktok":
      return <IconTikTok className={className} />;
    default:
      return <IconGlobe className={className} />;
  }
}

export function SocialLinks({ socialLinks }: { socialLinks?: SocialLink[] }) {
  if (!socialLinks || socialLinks.length === 0) return null;

  return (
    <section aria-label="روابط السوشيال ميديا">
      <h2 className="mb-3 font-heading text-xl font-bold text-foreground">
        روابط أخرى
      </h2>
      <div className="flex flex-wrap gap-3">
        {socialLinks.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={platformLabels[link.platform]}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <SocialIcon platform={link.platform} className="h-6 w-6" />
          </a>
        ))}
      </div>
    </section>
  );
}
